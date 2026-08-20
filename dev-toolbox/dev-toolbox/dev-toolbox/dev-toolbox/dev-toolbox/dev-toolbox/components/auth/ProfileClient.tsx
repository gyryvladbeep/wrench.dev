"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { Locale, localePath } from "@/lib/i18n/config";
import { Button } from "@/components/ui/button";

interface UsageRow {
  tool_slug: string;
  uses: number;
  last_used: string;
}

export function ProfileClient({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const t = dict.auth;

  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [usage, setUsage] = useState<UsageRow[]>([]);
  const [memberSince, setMemberSince] = useState("");

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !user) {
      router.replace(localePath(locale, "/auth/login"));
    }
  }, [user, loading, router, locale]);

  // Load profile + usage stats
  useEffect(() => {
    if (!user) return;

    setMemberSince(
      new Date(user.created_at).toLocaleDateString(
        locale === "ru" ? "ru-RU" : "en-US",
        { year: "numeric", month: "long", day: "numeric" }
      )
    );

    // Load profile display name
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single()
      .then(({ data }: { data: { display_name?: string } | null }) => {
        if (data?.display_name) setDisplayName(data.display_name);
      });

    // Load usage stats grouped by tool
    supabase
      .from("tool_usage_events")
      .select("tool_slug, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }: { data: { tool_slug: string; created_at: string }[] | null }) => {
        if (!data) return;
        const map = new Map<string, { uses: number; last_used: string }>();
        for (const row of data) {
          const existing = map.get(row.tool_slug);
          if (existing) {
            existing.uses++;
          } else {
            map.set(row.tool_slug, { uses: 1, last_used: row.created_at });
          }
        }
        setUsage(
          Array.from(map.entries())
            .map(([tool_slug, v]) => ({ tool_slug, ...v }))
            .sort((a, b) => b.uses - a.uses)
        );
      });
  }, [user, supabase, locale]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    await supabase
      .from("profiles")
      .update({ display_name: displayName, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    setSaving(false);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  }

  async function handleSignOut() {
    await signOut();
    router.push(localePath(locale, "/"));
    router.refresh();
  }

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <div className="text-text-muted">…</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">{t.profileHeading}</h1>
        <Button variant="secondary" onClick={handleSignOut}>{t.signOut}</Button>
      </div>

      {/* Account info */}
      <div className="mt-6 rounded-[10px] border border-border bg-surface p-5">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-text-muted">{t.emailLabel}</p>
            <p className="mt-1 font-mono text-text-primary">{user.email}</p>
          </div>
          <div>
            <p className="text-text-muted">{t.memberSince}</p>
            <p className="mt-1 text-text-primary">{memberSince}</p>
          </div>
          <div>
            <p className="text-text-muted">{t.plan}</p>
            <p className="mt-1 text-text-primary">{t.planFree}</p>
          </div>
        </div>
      </div>

      {/* Display name */}
      <form onSubmit={handleSave} className="mt-6 rounded-[10px] border border-border bg-surface p-5">
        <label htmlFor="display-name" className="block text-sm font-medium text-text-primary">
          {t.displayName}
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={user.email?.split("@")[0]}
            className="code-surface flex-1 rounded-[10px] p-2.5 text-sm text-text-primary outline-none focus:ring-1 focus:ring-accent"
          />
          <Button type="submit" disabled={saving}>
            {saving ? t.saving : savedMsg ? t.saved : t.saveChanges}
          </Button>
        </div>
      </form>

      {/* Usage stats */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-text-primary">{t.toolUsageHeading}</h2>
        {usage.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">{t.noUsageYet}</p>
        ) : (
          <div className="mt-3 space-y-2">
            {usage.map((row) => (
              <div
                key={row.tool_slug}
                className="flex items-center justify-between rounded-[10px] border border-border bg-surface px-4 py-3 text-sm"
              >
                <span className="font-mono text-text-primary">{row.tool_slug}</span>
                <div className="flex items-center gap-4 text-text-muted">
                  <span>{row.uses} {t.usageCount}</span>
                  <span>
                    {t.lastUsed}{" "}
                    {new Date(row.last_used).toLocaleDateString(
                      locale === "ru" ? "ru-RU" : "en-US"
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
