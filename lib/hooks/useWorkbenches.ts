"use client";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { createClient } from "@/lib/supabase/client";
import { ToolPosition, defaultToolPosition } from "@/lib/workbench-layout";

export interface Workbench {
  id: string;
  name: string;
  tool_slugs: string[];
  position: number;
  // Позиция каждой карточки на свободном холсте, по slug'у инструмента.
  // Инструмент без записи в layout (например, из старого workbench,
  // созданного до этой фичи) получает позицию на лету — см. использование
  // defaultToolPosition() в WorkbenchCanvas и в addTool() ниже.
  layout: Record<string, ToolPosition>;
  // Публичная read-only ссылка на этот рабочий стол (см. app/[locale]/w/[id]).
  is_public: boolean;
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
      .select("id, name, tool_slugs, position, layout, is_public")
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
        .insert({ user_id: user.id, name: "My Workbench", tool_slugs: [], position: 0, layout: {}, is_public: false })
        .select("id, name, tool_slugs, position, layout, is_public")
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
      .insert({ user_id: user.id, name, tool_slugs: [], position: workbenches.length, layout: {}, is_public: false })
      .select("id, name, tool_slugs, position, layout, is_public")
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

  // Общий помощник для частичного обновления одного workbench — и в
  // локальном состоянии, и в Supabase. Раньше здесь был setToolSlugs(),
  // заточенный только под tool_slugs; свободному холсту нужно менять ещё
  // и layout, и is_public теми же двумя шагами (оптимистично в стейте,
  // затем запрос в фоне), так что вместо трёх похожих функций — одна
  // обобщённая на произвольный патч колонок.
  const persist = useCallback((id: string, patch: Partial<Pick<Workbench, "tool_slugs" | "layout" | "is_public">>) => {
    setWorkbenches((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)));
    const supabase = createClient();
    supabase.from("workbenches").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id)
      .then(({ error }: { error: unknown }) => { if (error) console.error("useWorkbenches: update failed", error); });
  }, []);

  const addTool = useCallback((id: string, slug: string) => {
    const wb = workbenches.find((w) => w.id === id);
    if (!wb || wb.tool_slugs.includes(slug) || wb.tool_slugs.length >= maxToolsPerWorkbench) return;
    const position = defaultToolPosition(wb.tool_slugs.length);
    persist(id, {
      tool_slugs: [...wb.tool_slugs, slug],
      layout: { ...wb.layout, [slug]: position },
    });
  }, [workbenches, maxToolsPerWorkbench, persist]);

  const removeTool = useCallback((id: string, slug: string) => {
    const wb = workbenches.find((w) => w.id === id);
    if (!wb) return;
    const nextLayout = { ...wb.layout };
    delete nextLayout[slug];
    persist(id, {
      tool_slugs: wb.tool_slugs.filter((s) => s !== slug),
      layout: nextLayout,
    });
  }, [workbenches, persist]);

  // Перемещение карточки на свободном холсте. Помимо самой позиции,
  // переносим slug в конец tool_slugs — порядок массива теперь значит не
  // "визуальный ряд" (это делает layout), а z-index: последний элемент
  // рисуется поверх остальных, так что последняя тронутая карточка
  // ожидаемо оказывается сверху, если несколько случайно перекрылись.
  const moveTool = useCallback((id: string, slug: string, position: ToolPosition) => {
    const wb = workbenches.find((w) => w.id === id);
    if (!wb) return;
    persist(id, {
      tool_slugs: [...wb.tool_slugs.filter((s) => s !== slug), slug],
      layout: { ...wb.layout, [slug]: position },
    });
  }, [workbenches, persist]);

  const setPublic = useCallback((id: string, isPublic: boolean) => {
    persist(id, { is_public: isPublic });
  }, [persist]);

  // Изменение размера карточки на свободном холсте (ручка в правом
  // нижнем углу — см. WorkbenchCanvas). Мержим width/height в
  // существующую запись layout[slug], а не заменяем её целиком — иначе
  // ресайз стёр бы позицию x/y, которую отдельно двигает moveTool.
  // Если записи ещё нет вовсе (легаси-инструмент, добавленный до этой
  // фичи) — считаем ей дефолтную каскадную позицию по индексу в
  // tool_slugs, ровно как это делает WorkbenchCanvas при отрисовке, так
  // что первый же ресайз заодно "материализует" x/y в базу.
  const resizeTool = useCallback((id: string, slug: string, size: { width: number; height: number }) => {
    const wb = workbenches.find((w) => w.id === id);
    if (!wb) return;
    const existing = wb.layout[slug] ?? defaultToolPosition(wb.tool_slugs.indexOf(slug));
    persist(id, { layout: { ...wb.layout, [slug]: { ...existing, ...size } } });
  }, [workbenches, persist]);

  // Перетаскивание самих вкладок рабочих столов (не инструментов внутри
  // одного стола — этим занимается moveTool выше). newIdOrder — id рабочих
  // столов в новом порядке отображения; position каждого пересчитывается
  // по его индексу в этом массиве и сохраняется той же схемой, что уже
  // используется для сортировки при загрузке (order("position")).
  const reorderWorkbenches = useCallback((newIdOrder: string[]) => {
    setWorkbenches((prev) => {
      const byId = new Map(prev.map((w) => [w.id, w]));
      const next = newIdOrder.map((id) => byId.get(id)).filter((w): w is Workbench => Boolean(w));
      // Если что-то не сошлось (id не нашёлся), лучше не терять рабочие
      // столы — оставляем прежний порядок, чем рисковать пропажей вкладки.
      return next.length === prev.length ? next : prev;
    });
    const supabase = createClient();
    newIdOrder.forEach((id, index) => {
      supabase.from("workbenches").update({ position: index, updated_at: new Date().toISOString() }).eq("id", id)
        .then(({ error }: { error: unknown }) => { if (error) console.error("useWorkbenches: reorder failed", error); });
    });
  }, []);

  return {
    workbenches, loading, maxWorkbenches, maxToolsPerWorkbench,
    createWorkbench, renameWorkbench, deleteWorkbench,
    addTool, removeTool, moveTool, resizeTool, setPublic, reorderWorkbenches,
  };
}
