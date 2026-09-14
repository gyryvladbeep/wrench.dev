"use client";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { createClient } from "@/lib/supabase/client";

// .upsert() не существует у заглушки createClient() (см. её же
// комментарий в lib/supabase/client.ts) — заглушка отдаётся, когда
// переменные окружения Supabase не заданы. try/catch по той же причине,
// что уже зафиксирована для калькулятора зарплат и mock-эндпоинтов:
// без этого страница /trainer падала бы целиком в среде без
// .env.local, хотя сами упражнения (статический контент, без Supabase)
// прекрасно работают и без него.
export function useTrainerProgress() {
  const { user } = useAuth();
  const [solved, setSolved] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setSolved(new Set()); setLoading(false); return; }
    setLoading(true);
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from("trainer_progress")
        .select("exercise_id")
        .eq("user_id", user.id);
      if (error) throw error;
      setSolved(new Set(((data as { exercise_id: string }[] | null) ?? []).map((r) => r.exercise_id)));
    } catch {
      setSolved(new Set());
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const markSolved = useCallback(async (exerciseId: string) => {
    setSolved((prev) => new Set(prev).add(exerciseId));
    if (!user) return;
    const supabase = createClient();
    try {
      await supabase.from("trainer_progress").upsert(
        { user_id: user.id, exercise_id: exerciseId },
        { onConflict: "user_id,exercise_id" }
      );
    } catch {
      // Supabase not configured — progress stays local to this session only.
    }
  }, [user]);

  return { solved, loading, markSolved, signedIn: Boolean(user) };
}
