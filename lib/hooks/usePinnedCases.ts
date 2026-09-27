"use client";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { createClient } from "@/lib/supabase/client";
import { useLocalStorage } from "./useLocalStorage";
import { MAX_PINNED_CASES } from "@/lib/tier-limits";

const KEY = "dtb_pinned_cases";

export interface PinnedCase {
  id: string;
  tool_slug: string;
  label: string;
  input_payload: unknown;
  expected_output: unknown;
  created_at: string;
}

export interface PinCaseInput {
  tool_slug: string;
  label: string;
  input_payload: unknown;
  expected_output: unknown;
}

/**
 * Test Vault — тот же dual-mode паттерн, что и useFavorites.ts:
 *  - без аккаунта: всё в localStorage, работает сразу, без регистрации.
 *  - с аккаунтом: источник истины — таблица `pinned_cases` в Supabase
 *    (см. supabase/test-vault-migration.sql).
 *  - при первом входе после регистрации локально закреплённые кейсы
 *    переносятся в аккаунт ОДИН раз, затем локальная копия очищается —
 *    в отличие от favorites, у pinned_cases нет уникального ключа
 *    (можно закрепить один и тот же ввод дважды осознанно), поэтому
 *    без очистки повторный вход дублировал бы перенесённые кейсы.
 */
export function usePinnedCases() {
  const { user } = useAuth();
  const [localCases, setLocalCases, localHydrated] = useLocalStorage<PinnedCase[]>(KEY, []);

  // null = ещё не загрузили из Supabase (или пользователь не залогинен)
  const [remoteCases, setRemoteCases] = useState<PinnedCase[] | null>(null);
  const [migrated, setMigrated] = useState(false);

  useEffect(() => {
    if (!user) {
      setRemoteCases(null);
      setMigrated(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("pinned_cases")
          .select("id, tool_slug, label, input_payload, expected_output, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (error) throw error;
        if (cancelled) return;

        const remote = (data as PinnedCase[] | null) ?? [];

        if (localCases.length > 0) {
          const rows = localCases.map((c) => ({
            user_id: user.id,
            tool_slug: c.tool_slug,
            label: c.label,
            input_payload: c.input_payload,
            expected_output: c.expected_output,
          }));
          const { data: inserted, error: insertError } = await supabase
            .from("pinned_cases")
            .insert(rows)
            .select("id, tool_slug, label, input_payload, expected_output, created_at");
          if (insertError) throw insertError;
          if (cancelled) return;

          const insertedRows = (inserted as PinnedCase[] | null) ?? [];
          setRemoteCases(
            [...insertedRows, ...remote].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
          );
          // Переносим один раз — очищаем локальную копию, иначе повторный
          // вход/выход задвоил бы уже перенесённые кейсы.
          setLocalCases([]);
        } else {
          setRemoteCases(remote);
        }
        setMigrated(true);
      } catch (err) {
        // Сеть отвалилась / RLS отказал — не блокируем интерфейс,
        // просто показываем пустой Vault вместо вечной загрузки.
        console.error("usePinnedCases: failed to load/migrate pinned cases", err);
        if (!cancelled) {
          setRemoteCases([]);
          setMigrated(true);
        }
      }
    })();

    return () => { cancelled = true; };
    // localCases намеренно не в зависимостях: миграция должна сработать
    // один раз при входе, а не при каждом локальном закреплении.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const cases = user ? (remoteCases ?? []) : localCases;
  const hydrated = user ? migrated : localHydrated;

  const pin = useCallback(async (input: PinCaseInput): Promise<boolean> => {
    if (cases.length >= MAX_PINNED_CASES) return false;

    if (user) {
      const supabase = createClient();
      try {
        const { data, error } = await supabase
          .from("pinned_cases")
          .insert({ user_id: user.id, ...input })
          .select("id, tool_slug, label, input_payload, expected_output, created_at")
          .single();
        if (error || !data) throw error;
        setRemoteCases((prev) => [data as PinnedCase, ...(prev ?? [])]);
        return true;
      } catch (err) {
        console.error("usePinnedCases: failed to pin case", err);
        return false;
      }
    } else {
      const newCase: PinnedCase = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        ...input,
      };
      setLocalCases((prev) => [newCase, ...prev]);
      return true;
    }
  }, [user, cases.length, setLocalCases]);

  const unpin = useCallback((id: string) => {
    if (user) {
      setRemoteCases((prev) => (prev ?? []).filter((c) => c.id !== id));
      const supabase = createClient();
      supabase.from("pinned_cases").delete().eq("id", id).then(({ error }: { error: unknown }) => {
        if (error) console.error("usePinnedCases: failed to unpin case", error);
      });
    } else {
      setLocalCases((prev) => prev.filter((c) => c.id !== id));
    }
  }, [user, setLocalCases]);

  return { cases, hydrated, pin, unpin, atLimit: cases.length >= MAX_PINNED_CASES };
}
