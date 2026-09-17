import { NextRequest, NextResponse } from "next/server";
import { getStripe, PLANS } from "@/lib/stripe";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { locale = "en" } = await req.json().catch(() => ({}));
  const origin = req.headers.get("origin") ?? "https://wrench-dev-lr29.vercel.app";

  try {
    const stripe = getStripe();

    // Get or create Stripe customer
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    let customerId = sub?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      // Save customer ID. Written through the service-role admin client,
      // not the request-scoped anon-key client above: the `subscriptions`
      // table (supabase/challenges-schema.sql) has RLS enabled with only a
      // SELECT policy ("subscriptions_select") — no INSERT/UPDATE policy
      // exists for it at all. An upsert through the anon-key client (even
      // for the caller's own row, under their own session) is silently
      // rejected by RLS's default-deny, so this write never actually
      // persisted; account/delete/route.ts already establishes the pattern
      // of using the admin client for this kind of privileged server-side
      // write.
      const admin = getSupabaseAdmin();
      const { error: upsertErr } = await admin.from("subscriptions").upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        plan: "free",
        status: "active",
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      if (upsertErr) console.error("Stripe checkout: failed to save customer id", upsertErr);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: PLANS.pro.stripePriceId, quantity: 1 }],
      success_url: `${origin}/${locale}/pro/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/${locale}/pro`,
      metadata: { user_id: user.id },
      subscription_data: {
        metadata: { supabase_user_id: user.id },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
