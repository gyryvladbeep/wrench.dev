"use client";
import { useState } from "react";
import { DISCIPLINES, Discipline } from "@/lib/disciplines";
import { Locale } from "@/lib/i18n/config";
import { useRolePreference, RoleSelector, CurrentRoleBadge } from "@/components/RoleSelector";
import { DisciplineSection } from "@/components/DisciplineSection";

const DISMISS_KEY = "wrench_role_selector_dismissed";

export function DisciplineSectionsClient({ locale, isRu }: { locale: Locale; isRu: boolean }) {
  const { role, setRole, hydrated } = useRolePreference();
  const [dismissed, setDismissed] = useState(false);

  // Order disciplines: preferred role first, rest follow in default order
  const ordered = role
    ? [
        DISCIPLINES.find((d) => d.id === role)!,
        ...DISCIPLINES.filter((d) => d.id !== role),
      ]
    : DISCIPLINES;

  function handleSelect(id: Discipline) {
    setRole(id);
  }

  function handleDismiss() {
    setDismissed(true);
    if (typeof window !== "undefined") localStorage.setItem(DISMISS_KEY, "1");
  }

  const wasDismissed = typeof window !== "undefined" && localStorage.getItem(DISMISS_KEY) === "1";
  const showSelector = hydrated && !role && !dismissed && !wasDismissed;

  return (
    <div>
      {showSelector && (
        <div className="mb-2">
          <RoleSelector isRu={isRu} onSelect={handleSelect} onDismiss={handleDismiss} />
        </div>
      )}
      {hydrated && role && (
        <div className="mb-4">
          <CurrentRoleBadge isRu={isRu} role={role} onChange={() => setRole(null)} />
        </div>
      )}
      <div className="divide-y divide-border">
        {ordered.map((d) => (
          <DisciplineSection key={d.id} discipline={d} locale={locale} isRu={isRu} />
        ))}
      </div>
    </div>
  );
}