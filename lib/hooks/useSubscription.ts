"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { PlanId } from "@/lib/stripe";

interface Subscription {
  plan: PlanId;
  status: string;
  current_period_end?: string;
}

export function useSubscription() {
  const { user } = useAuth();
  const [sub,     setSub]     = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setSub(null); setLoading(false); return; }
    const supabase = createClient();
    supabase.from("subscriptions")
      .select("plan, status, current_period_end")
      .eq("user_id", user.id)
      .single()
      .then(({ data }: { data: Subscription | null }) => {
        setSub(data as Subscription ?? { plan: "free", status: "active" });
        setLoading(false);
      });
  }, [user]);

  const isPro = sub?.plan === "pro" && sub?.status === "active";

  async function startCheckout(locale = "en") {
    const res  = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
  }

  async function openPortal(locale = "en") {
    const res  = await fetch("/api/stripe/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
  }

  return { sub, loading, isPro, startCheckout, openPortal };
}
