"use client";
import { useEffect, useState } from "react";
import { Discipline, DISCIPLINES } from "@/lib/disciplines";

const STORAGE_KEY = "wrench_preferred_role";

export function useRolePreference() {
  const [role, setRoleState] = useState<Discipline | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Discipline | null;
    if (saved && DISCIPLINES.some((d) => d.id === saved)) setRoleState(saved);
    setHydrated(true);
  }, []);

  function setRole(role: Discipline | null) {
    setRoleState(role);
    if (role) localStorage.setItem(STORAGE_KEY, role);
    else localStorage.removeItem(STORAGE_KEY);
  }

  return { role, setRole, hydrated };
}

interface RoleSelectorProps {
  isRu: boolean;
  onSelect: (role: Discipline) => void;
  onDismiss: () => void;
}

export function RoleSelector({ isRu, onSelect, onDismiss }: RoleSelectorProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-5 animate-fade-in-up">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-sm font-semibold text-text-primary">
            {isRu ? "Кто ты по роли?" : "What's your role?"}
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            {isRu
              ? "Покажем сначала инструменты которые нужны тебе чаще всего — остальное никуда не денется"
              : "We'll surface the tools you'll use most first — everything else stays one click away"}
          </p>
        </div>
        <button onClick={onDismiss} className="shrink-0 text-text-disabled hover:text-text-muted transition-colors text-sm">✕</button>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {DISCIPLINES.map((d) => (
          <button key={d.id} onClick={() => onSelect(d.id)}
            className="group flex flex-col items-center gap-1.5 rounded-xl border border-border bg-canvas p-4 transition-all hover:scale-[1.03]"
            style={{ borderColor: undefined }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${d.color}60`)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "")}>
            <span className="text-2xl">{d.icon}</span>
            <span className="text-xs font-medium text-text-primary text-center">{isRu ? d.labelRu : d.labelEn}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function CurrentRoleBadge({ isRu, role, onChange }: { isRu: boolean; role: Discipline; onChange: () => void }) {
  const meta = DISCIPLINES.find((d) => d.id === role)!;
  return (
    <button onClick={onChange}
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors hover:bg-surface"
      style={{ borderColor: `${meta.color}40`, background: `${meta.color}10`, color: meta.color }}>
      <span>{meta.icon}</span>
      {isRu ? meta.labelRu : meta.labelEn}
      <span className="text-text-disabled ml-1">· {isRu ? "изменить" : "change"}</span>
    </button>
  );
}