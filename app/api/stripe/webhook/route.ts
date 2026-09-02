import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Track processed event IDs for idempotency (in-memory, resets on cold start)
// For production scale, use Redis or a DB table — this covers most cases
const processedEvents = new Set<string>();

export async function POST(req: NextRequest) {
  const body      = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";
  const secret    = process.env.STRIPE_WEBHOOK_SECRET ?? "";

  // Limit body size to 1MB
  if (body.length > 1_000_000) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency — skip already processed events
  if (processedEvents.has(event.id)) {
    return NextResponse.json({ received: true, duplicate: true });
  }
  processedEvents.add(event.id);
  // Clean up old events to prevent memory leak (keep last 1000)
  if (processedEvents.size > 1000) {
    const [first] = processedEvents;
    processedEvents.delete(first);
  }

  const supabase = createServerSupabaseClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as {
          metadata?: { user_id?: string };
          subscription?: string;
          customer?: string;
        };
        const userId = session.metadata?.user_id;
        if (!userId) {
          console.error("Webhook: missing user_id in session metadata");
          break;
        }

        const stripe  = getStripe();
        const rawSub  = await stripe.subscriptions.retrieve(session.subscription as string);
        const subData = rawSub as unknown as {
          id: string;
          current_period_end: number;
          status: string;
        };

        const periodEnd = subData.current_period_end
          ? new Date(subData.current_period_end * 1000).toISOString()
          : null;

        const { error } = await supabase.from("subscriptions").upsert({
          user_id:                userId,
          stripe_customer_id:     session.customer as string,
          stripe_subscription_id: subData.id,
          plan:                   "pro",
          status:                 "active",
          current_period_end:     periodEnd,
          updated_at:             new Date().toISOString(),
        }, { onConflict: "user_id", ignoreDuplicates: false });

        if (error) console.error("Webhook upsert error:", error);
        break;
      }

      case "customer.subscription.updated": {
        const sub  = event.data.object as unknown as {
          id: string;
          status: string;
          current_period_end: number;
        };
        const plan = sub.status === "active" ? "pro" : "free";
        const periodEnd = sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null;

        await supabase.from("subscriptions")
          .update({
            plan,
            status:             sub.status,
            current_period_end: periodEnd,
            updated_at:         new Date().toISOString(),
          })
          .eq("stripe_subscription_id", sub.id);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as { id: string };
        await supabase.from("subscriptions")
          .update({
            plan:       "free",
            status:     "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", sub.id);
        break;
      }

      case "invoice.payment_failed": {
        // Notify user their payment failed (optional: send email via Resend)
        const invoice = event.data.object as { subscription?: string };
        if (invoice.subscription) {
          await supabase.from("subscriptions")
            .update({ status: "past_due", updated_at: new Date().toISOString() })
            .eq("stripe_subscription_id", invoice.subscription);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}