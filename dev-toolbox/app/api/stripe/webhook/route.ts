import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs"; // Webhooks need Node.js runtime

export async function POST(req: NextRequest) {
  const body      = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";
  const secret    = process.env.STRIPE_WEBHOOK_SECRET ?? "";

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as { metadata?: { user_id?: string }; subscription?: string; customer?: string };
        const userId  = session.metadata?.user_id;
        if (!userId) break;

        const stripe   = getStripe();
        const rawSub   = await stripe.subscriptions.retrieve(session.subscription as string);
        const subData  = rawSub as unknown as { id: string; current_period_end: number };

        await supabase.from("subscriptions").upsert({
          user_id: userId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subData.id,
          plan: "pro",
          status: "active",
          current_period_end: new Date(subData.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
        break;
      }

      case "customer.subscription.updated": {
        const subRaw  = event.data.object as unknown as { id: string; status: string; current_period_end: number };
        const sub     = subRaw;
        const plan    = sub.status === "active" ? "pro" : "free";

        await supabase.from("subscriptions")
          .update({
            plan,
            status: sub.status,
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", sub.id);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as { id: string };
        await supabase.from("subscriptions")
          .update({ plan: "free", status: "canceled", updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", sub.id);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
