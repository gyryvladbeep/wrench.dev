"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import { localePath, Locale } from "@/lib/i18n/config";
import { getStackTag } from "@/lib/profile-stack";
import { CheckIcon } from "@/components/icons/GameIcons";
import { groupEndorsementsByTag, isEndorsedByViewer, formatEndorserNames, EndorsementRow } from "@/lib/skill-endorsements";

interface EndorserProfile {
  username:     string;
  display_name: string;
}

interface SkillEndorsementsProps {
  locale:        Locale;
  // id профиля, чьи навыки показываем/эндорсим (профиль ВЛАДЕЛЬЦА
  // страницы, не текущего залогиненного зрителя).
  profileUserId: string;
  // Теги из lib/profile-stack.ts, которые владелец выбрал у себя —
  // эндорсить можно только их, ничего произвольного (см. миграцию).
  techStack:     string[];
  // true на приватной странице настроек (app/[locale]/profile/page.tsx)
  // и когда залогиненный зритель открыл свой же публичный /u/[username] —
  // в обоих случаях кнопки эндорса скрыты (нельзя эндорсить себя), но
  // список полученных эндорсементов всё равно показывается.
  isOwnProfile:  boolean;
}

// Peer-эндорсементы навыков (roadmap item 2) — облегчённая версия
// LinkedIn endorsements. Анти-спам гейт: эндорснуть можно только того,
// чей профиль ты реально открывал (см. supabase/skill-endorsements-migration.sql,
// таблица profile_views) — эта запись делается прямо здесь, при монтировании
// компонента на чужом публичном профиле, до того как кнопки эндорса
// становятся активными.
export function SkillEndorsements({ locale, profileUserId, techStack, isOwnProfile }: SkillEndorsementsProps) {
  const isRu = locale === "ru";
  const { user } = useAuth();
  const [rows, setRows] = useState<EndorsementRow[]>([]);
  const [names, setNames] = useState<Map<string, EndorserProfile>>(new Map());
  const [viewRecorded, setViewRecorded] = useState(false);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [rowError, setRowError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    supabase
      .from("skill_endorsements")
      .select("skill_tag, endorser_id")
      .eq("endorsee_id", profileUserId)
      .then(async ({ data }: { data: EndorsementRow[] | null }) => {
        if (cancelled) return;
        const list = data ?? [];
        setRows(list);

        const ids = [...new Set(list.map((r) => r.endorser_id))];
        if (ids.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, username, display_name")
            .in("id", ids);
          if (cancelled) return;
          const map = new Map<string, EndorserProfile>();
          for (const p of (profiles ?? []) as Array<{ id: string; username: string; display_name: string }>) {
            map.set(p.id, { username: p.username, display_name: p.display_name });
          }
          setNames(map);
        }
      });

    // Фиксируем факт просмотра — только на ЧУЖОМ профиле и только для
    // залогиненного зрителя (аноним всё равно не сможет эндорснуть,
    // insert требует auth.uid()). Тихий best-effort: ошибка здесь просто
    // оставляет кнопки эндорса неактивными, ничего не ломает выше.
    if (user && !isOwnProfile) {
      supabase
        .from("profile_views")
        .upsert({ viewer_id: user.id, viewed_user_id: profileUserId }, { onConflict: "viewer_id,viewed_user_id" })
        .then(({ error }: { error: unknown }) => {
          if (!cancelled && !error) setViewRecorded(true);
        });
    }

    return () => { cancelled = true; };
  }, [profileUserId, isOwnProfile, user]);

  const validTags = techStack.map(getStackTag).filter((t): t is NonNullable<typeof t> => Boolean(t));
  if (validTags.length === 0) return null;

  const grouped = groupEndorsementsByTag(rows);
  const canEndorse = Boolean(user) && !isOwnProfile && viewRecorded;

  async function toggleEndorse(skillTag: string) {
    if (!user || !canEndorse || pending.has(skillTag)) return;
    setRowError(null);
    setPending((prev) => new Set(prev).add(skillTag));

    const supabase = createClient();
    const tagRows = grouped.get(skillTag) ?? [];
    const alreadyEndorsed = isEndorsedByViewer(tagRows, user.id);

    if (alreadyEndorsed) {
      const { error } = await supabase
        .from("skill_endorsements")
        .delete()
        .eq("endorser_id", user.id)
        .eq("endorsee_id", profileUserId)
        .eq("skill_tag", skillTag);
      if (!error) {
        setRows((prev) => prev.filter((r) => !(r.endorser_id === user.id && r.skill_tag === skillTag)));
      } else {
        setRowError(isRu ? "Не удалось отменить эндорсемент." : "Couldn't remove the endorsement.");
      }
    } else {
      const { error } = await supabase
        .from("skill_endorsements")
        .insert({ endorser_id: user.id, endorsee_id: profileUserId, skill_tag: skillTag });
      if (!error) {
        setRows((prev) => [...prev, { endorser_id: user.id, skill_tag: skillTag }]);
      } else {
        setRowError(isRu ? "Не удалось поставить эндорсемент — возможно, нужно сначала открыть профиль целиком и подождать пару секунд." : "Couldn't add the endorsement — try reloading the profile first.");
      }
    }

    setPending((prev) => {
      const next = new Set(prev);
      next.delete(skillTag);
      return next;
    });
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <h2 className="mb-1 text-sm font-semibold text-text-primary">
        {isRu ? "Навыки" : "Skills"}
      </h2>
      <p className="mb-3 text-xs text-text-muted">
        {isRu
          ? "Подтверждены другими участниками, которые открывали этот профиль."
          : "Confirmed by other members who viewed this profile."}
      </p>

      <div className="space-y-2">
        {validTags.map((tag) => {
          const tagRows = grouped.get(tag.id) ?? [];
          const count = tagRows.length;
          const endorsedByMe = isEndorsedByViewer(tagRows, user?.id);
          const displayNames = tagRows
            .map((r) => names.get(r.endorser_id))
            .filter((p): p is EndorserProfile => Boolean(p))
            .map((p) => p.display_name || `@${p.username}`);
          const namesLine = formatEndorserNames(displayNames, isRu);
          const isPending = pending.has(tag.id);

          return (
            <div key={tag.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-md border border-border bg-canvas px-3 py-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-primary">{isRu ? tag.labelRu : tag.label}</span>
                  {count > 0 && (
                    <span className="rounded-full border border-border px-1.5 py-0.5 text-[11px] text-text-muted">
                      {count}
                    </span>
                  )}
                </div>
                {namesLine && (
                  <p className="mt-0.5 truncate text-xs text-text-muted">
                    {isRu ? "Подтвердили: " : "Endorsed by: "}{namesLine}
                  </p>
                )}
              </div>

              {!isOwnProfile && user && (
                <button
                  onClick={() => toggleEndorse(tag.id)}
                  disabled={!canEndorse || isPending}
                  className={`shrink-0 flex items-center gap-1 rounded border px-2.5 py-1 text-xs font-medium transition-colors ${
                    endorsedByMe
                      ? "border-accent/40 bg-accent/10 text-accent"
                      : "border-border text-text-muted hover:border-border-focus hover:text-text-secondary"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {endorsedByMe ? (
                    <>
                      <CheckIcon size={11} />
                      {isRu ? "Подтвердил(а)" : "Endorsed"}
                    </>
                  ) : (
                    isRu ? "Подтвердить" : "Endorse"
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {rowError && <p className="mt-2 text-xs text-red-400">{rowError}</p>}

      {!user && (
        <p className="mt-3 text-xs text-text-muted">
          {isRu ? "Чтобы подтвердить навык — " : "To endorse a skill — "}
          <Link href={localePath(locale, "/auth/signup")} className="text-link hover:underline">
            {isRu ? "войдите или зарегистрируйтесь" : "sign in or sign up"}
          </Link>.
        </p>
      )}
    </div>
  );
}
