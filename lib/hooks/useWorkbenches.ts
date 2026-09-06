"use client";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { createClient } from "@/lib/supabase/client";

export interface Workbench {
  id: string;
  name: string;
  tool_slugs: string[];
  position: number;
}

// ═══════════════════════════════════════════════════════
// Лимиты free/Pro
// ═══════════════════════════════════════════════════════
// Бесплатный аккаунт получает ровно один рабочий стол — этого достаточно,
// чтобы почувствовать ценность фичи ("наконец-то мои инструменты рядом
// на одной странице") и стать тем самым аргументом регистрации. Больше
// одного набора или большие наборы — это уже про людей, которые реально
// вплетают сайт в свой рабочий процесс, и это ровно то, за что имеет
// смысл предложить Pro (как уже сделано с лимитом AI-запросов в день).
export const FREE_MAX_WORKBENCHES = 1;
export const FREE_MAX_TOOLS = 6;
export const PRO_MAX_WORKBENCHES = 5;
export const PRO_MAX_TOOLS = 16;

export function useWorkbenches(isPro: boolean) {
  const { user } = useAuth();
  const [workbenches, setWorkbenches] = useState<Workbench[]>([]);
  const [loading, setLoading] = useState(true);

  const maxWorkbenches      = isPro ? PRO_MAX_WORKBENCHES : FREE_MAX_WORKBENCHES;
  const maxToolsPerWorkbench = isPro ? PRO_MAX_TOOLS : FREE_MAX_TOOLS;

  const load = useCallback(async () => {
    if (!user) { setWorkbenches([]); setLoading(false); return; }
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("workbenches")
      .select("id, name, tool_slugs, position")
      .eq("user_id", user.id)
      .order("position", { ascending: true });

    if (error) {
      console.error("useWorkbenches: failed to load", error);
      setWorkbenches([]);
      setLoading(false);
      return;
    }

    let list = (data as Workbench[] | null) ?? [];

    // Первый визит на страницу — у пользователя ещё нет ни одного
    // workbench. Создаём дефолтный сразу, а не показываем "у тебя пока
    // ничего нет, нажми кнопку создать" — так фича сразу ощущается
    // готовой к работе, а не требует лишнего шага перед первым же
    // добавлением инструмента.
    if (list.length === 0) {
      const { data: created, error: createError } = await supabase
        .from("workbenches")
        .insert({ user_id: user.id, name: "My Workbench", tool_slugs: [], position: 0 })
        .select("id, name, tool_slugs, position")
        .single();
      if (createError) console.error("useWorkbenches: failed to create default workbench", createError);
      if (created) list = [created as Workbench];
    }

    setWorkbenches(list);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const createWorkbench = useCallback(async (name: string) => {
    if (!user || workbenches.length >= maxWorkbenches) return null;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("workbenches")
      .insert({ user_id: user.id, name, tool_slugs: [], position: workbenches.length })
      .select("id, name, tool_slugs, position")
      .single();
    if (error || !data) { console.error("useWorkbenches: create failed", error); return null; }
    setWorkbenches((prev) => [...prev, data as Workbench]);
    return data as Workbench;
  }, [user, workbenches, maxWorkbenches]);

  const renameWorkbench = useCallback((id: string, name: string) => {
    setWorkbenches((prev) => prev.map((w) => (w.id === id ? { ...w, name } : w)));
    const supabase = createClient();
    supabase.from("workbenches").update({ name, updated_at: new Date().toISOString() }).eq("id", id)
      .then(({ error }: { error: unknown }) => { if (error) console.error("useWorkbenches: rename failed", error); });
  }, []);

  const deleteWorkbench = useCallback((id: string) => {
    setWorkbenches((prev) => prev.filter((w) => w.id !== id));
    const supabase = createClient();
    supabase.from("workbenches").delete().eq("id", id)
      .then(({ error }: { error: unknown }) => { if (error) console.error("useWorkbenches: delete failed", error); });
  }, []);

  const setToolSlugs = useCallback((id: string, slugs: string[]) => {
    setWorkbenches((prev) => prev.map((w) => (w.id === id ? { ...w, tool_slugs: slugs } : w)));
    const supabase = createClient();
    supabase.from("workbenches").update({ tool_slugs: slugs, updated_at: new Date().toISOString() }).eq("id", id)
      .then(({ error }: { error: unknown }) => { if (error) console.error("useWorkbenches: update tools failed", error); });
  }, []);

  const addTool = useCallback((id: string, slug: string) => {
    const wb = workbenches.find((w) => w.id === id);
    if (!wb || wb.tool_slugs.includes(slug) || wb.tool_slugs.length >= maxToolsPerWorkbench) return;
    setToolSlugs(id, [...wb.tool_slugs, slug]);
  }, [workbenches, maxToolsPerWorkbench, setToolSlugs]);

  const removeTool = useCallback((id: string, slug: string) => {
    const wb = workbenches.find((w) => w.id === id);
    if (!wb) return;
    setToolSlugs(id, wb.tool_slugs.filter((s) => s !== slug));
  }, [workbenches, setToolSlugs]);

  const reorderTools = useCallback((id: string, slugs: string[]) => {
    setToolSlugs(id, slugs);
  }, [setToolSlugs]);

  return {
    workbenches, loading, maxWorkbenches, maxToolsPerWorkbench,
    createWorkbench, renameWorkbench, deleteWorkbench,
    addTool, removeTool, reorderTools,
  };
}
