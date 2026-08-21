import Stripe from "stripe";

// Server-side Stripe client (never expose secret key to browser)
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2026-07-29.dahlia" as any });
}

export const PLANS = {
  free: {
    name: "Free",
    nameRu: "Бесплатный",
    price: 0,
    features: {
      tools: "unlimited",
      aiGenerationsPerDay: 3,
      challenges: "daily only",
      history: 5,
    },
  },
  pro: {
    name: "Pro",
    nameRu: "Pro",
    price: 5,
    stripePriceId: process.env.STRIPE_PRICE_ID ?? "",
    features: {
      tools: "unlimited",
      aiGenerationsPerDay: -1, // unlimited
      challenges: "unlimited",
      history: -1, // unlimited
    },
  },
} as const;

export type PlanId = "free" | "pro";
