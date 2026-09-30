"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDict } from "@/lib/i18n/dict-context";
import { CloseIcon } from "@/components/icons/GameIcons";

// ═══════════════════════════════════════════════════════════════
// Экскурсия по продукту при регистрации (roadmap item 16, доработка)
// ═══════════════════════════════════════════════════════════════
// Раньше "улучшение онбординга" было расплывчатым пунктом; пользователь
// уточнил конкретно: модалка согласия сразу после регистрации, и если
// человек согласен — тур, который сразу показывает, "где что есть".
// Формат выбран явно (из трёх предложенных) — спотлайт по реальным
// элементам ГЛАВНОЙ страницы, без перехода между страницами: проще и
// надёжнее многостраничного тура, при этом настоящий визуальный тур, а
// не просто список ссылок (это уже есть — OnboardingBanner.tsx — и
// сознательно оставлен как есть, это отдельный, постоянный чек-лист для
// любого залогиненного, а не одноразовый тур сразу после регистрации).
//
// Тур запускается только по ?tour=1 в URL главной страницы — этот флаг
// выставляют SignupForm.tsx (email/пароль — точно знает, что это новый
// аккаунт) и app/[locale]/auth/callback/route.ts (OAuth — по совпадению
// created_at/last_sign_in_at, см. комментарий там). window.location.search
// вместо useSearchParams() — тот же приём, что и в SearchModal.tsx: не
// заводить Suspense-границу ради одного разового флага.
//
// Раскладка по шагам метится атрибутом data-tour="..." прямо на реальных
// элементах (Header.tsx, app/[locale]/page.tsx) — тур ищет их через
// document.querySelector, а не через рефы/контекст: элементы живут в
// разных, не связанных друг с другом компонентах (шапка и тело страницы),
// пробрасывать туда рефы через пропсы было бы куда более инвазивным
// изменением ради того же результата.
interface TourStep {
  target: string;
  titleEn: string;
  titleRu: string;
  bodyEn: string;
  bodyRu: string;
}

const STEPS: TourStep[] = [
  {
    target: "nav-tools",
    titleEn: "All the tools", titleRu: "Все инструменты",
    bodyEn: "Every formatter, converter and generator lives here, grouped by category.",
    bodyRu: "Все форматтеры, конвертеры и генераторы — здесь, сгруппированы по категориям.",
  },
  {
    target: "nav-workbench",
    titleEn: "Workbench", titleRu: "Рабочий стол",
    bodyEn: "Pin the tools you use often onto your own page, arrange them however you like.",
    bodyRu: "Закрепи инструменты, которыми пользуешься чаще всего, на своей странице — расставь как удобно.",
  },
  {
    target: "nav-learn",
    titleEn: "Learn", titleRu: "Обучение",
    bodyEn: "Challenges, a code trainer, a salary calculator, a knowledge base and more — everything that's not a bare tool lives under this menu.",
    bodyRu: "Челленджи, тренажёр кода, калькулятор зарплат, база знаний и другое — всё, что не голый инструмент, спрятано в этом меню.",
  },
  {
    target: "challenges",
    titleEn: "Daily challenges", titleRu: "Ежедневные задачи",
    bodyEn: "A short QA/frontend/backend problem every day — good for staying sharp or prepping for interviews.",
    bodyRu: "Короткая QA/frontend/backend задача каждый день — чтобы не терять форму или готовиться к собеседованиям.",
  },
  {
    target: "account",
    titleEn: "Your profile", titleRu: "Твой профиль",
    bodyEn: "Your public profile, Wrench Score, settings and API tokens are all here.",
    bodyRu: "Публичный профиль, Wrench Score, настройки и API-токены — всё здесь.",
  },
];

type Phase = "idle" | "consent" | "touring";

export function ProductTour() {
  const router   = useRouter();
  const pathname = usePathname() ?? "/";
  const { locale } = useDict();
  const isRu = locale === "ru";

  const [phase, setPhase]         = useState<Phase>("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect]           = useState<DOMRect | null>(null);
  // Ref, а не просто локальная переменная — нужен актуальный phase
  // внутри resize/scroll-слушателей без пересоздания их при каждом рендере.
  const phaseRef = useRef<Phase>("idle");
  phaseRef.current = phase;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tour") === "1") setPhase("consent");
  }, []);

  // Убираем ?tour=1 из адресной строки сразу по ответу на модалку —
  // без этого обновление страницы посреди/после тура показало бы
  // модалку заново.
  function clearTourParam() {
    const params = new URLSearchParams(window.location.search);
    params.delete("tour");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function accept() {
    clearTourParam();
    setStepIndex(0);
    setPhase("touring");
  }
  function declineOrEnd() {
    clearTourParam();
    setPhase("idle");
  }

  // Ищем текущую цель и пересчитываем её прямоугольник — при заходе на
  // шаг, и при resize/scroll, чтобы подсветка не отставала от реального
  // положения элемента. Если цель не найдена или нулевого размера
  // (например пункты навигации скрыты на узком экране — см. "hidden
  // lg:flex" в Header.tsx), молча переходим к следующему шагу, а не
  // показываем подсветку в углу экрана в никуда.
  useEffect(() => {
    if (phase !== "touring") { setRect(null); return; }

    function measure() {
      const step = STEPS[stepIndex];
      const el = step ? document.querySelector(`[data-tour="${step.target}"]`) : null;
      const r = el ? el.getBoundingClientRect() : null;
      if (!r || r.width === 0 || r.height === 0) return null;
      return r;
    }

    const r = measure();
    if (!r) {
      if (stepIndex + 1 < STEPS.length) setStepIndex((i) => i + 1);
      else declineOrEnd();
      return;
    }
    setRect(r);

    function onViewportChange() {
      if (phaseRef.current !== "touring") return;
      const next = measure();
      setRect(next);
    }
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);
    return () => {
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, stepIndex]);

  useEffect(() => {
    if (phase === "idle") return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") declineOrEnd(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (phase === "idle") return null;

  if (phase === "consent") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm animate-fade-in">
        <div className="w-full max-w-sm rounded-xl border border-border bg-canvas p-6 text-center shadow-2xl">
          <h2 className="text-base font-semibold text-text-primary">
            {isRu ? "Показать быструю экскурсию?" : "Want a quick tour?"}
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            {isRu
              ? "Полминуты — покажем, где инструменты, рабочий стол, обучение, задачи дня и профиль."
              : "Half a minute — we'll point out the tools, Workbench, Learn section, daily challenges and your profile."}
          </p>
          <div className="mt-5 flex gap-2">
            <button onClick={declineOrEnd}
              className="flex-1 rounded border border-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-hover">
              {isRu ? "Не сейчас" : "Not now"}
            </button>
            <button onClick={accept}
              className="flex-1 rounded bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90">
              {isRu ? "Начать" : "Start"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // touring, но цель ещё не измерена (первый рендер шага) — ничего не
  // рисуем в этом кадре, а не мигаем подсветкой в неверном месте.
  if (!rect) return null;

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const PAD = 6;
  // Тултип снизу от цели, если снизу достаточно места, иначе сверху —
  // тот же принцип "не выталкивать за пределы экрана", что и у обычных
  // выпадающих меню в Header.tsx.
  const spaceBelow = window.innerHeight - rect.bottom;
  const tooltipBelow = spaceBelow > 160;
  const tooltipTop = tooltipBelow ? rect.bottom + 12 : Math.max(12, rect.top - 12);

  return (
    <>
      {/* Подсветка — прозрачный прямоугольник по размеру цели с огромной
          box-shadow вокруг: сама цель остаётся не затемнённой, весь
          остальной экран — затемнён. Дешёвый, надёжный приём без canvas
          и SVG-масок. pointer-events: none — сама подсветка не должна
          перехватывать клики, весь тур закрывается кнопками/Esc. */}
      <div
        className="fixed z-[100] rounded-lg transition-all duration-300"
        style={{
          left: rect.left - PAD, top: rect.top - PAD,
          width: rect.width + PAD * 2, height: rect.height + PAD * 2,
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.65)",
          pointerEvents: "none",
        }}
      />
      <div
        className="fixed z-[101] w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-canvas p-4 shadow-2xl animate-fade-in"
        style={{
          top: tooltipTop,
          left: Math.min(Math.max(12, rect.left), window.innerWidth - 300),
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-text-primary">
            {isRu ? step.titleRu : step.titleEn}
          </p>
          <button onClick={declineOrEnd} aria-label={isRu ? "Закрыть" : "Close"}
            className="shrink-0 rounded p-0.5 text-text-muted transition-colors hover:text-text-primary">
            <CloseIcon size={13} />
          </button>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-text-muted">
          {isRu ? step.bodyRu : step.bodyEn}
        </p>
        <div className="mt-3.5 flex items-center justify-between">
          <span className="text-[11px] text-text-muted">{stepIndex + 1} / {STEPS.length}</span>
          <div className="flex gap-1.5">
            <button onClick={declineOrEnd}
              className="rounded px-2.5 py-1 text-xs text-text-muted transition-colors hover:text-text-secondary">
              {isRu ? "Пропустить" : "Skip"}
            </button>
            <button
              onClick={() => (isLast ? declineOrEnd() : setStepIndex((i) => i + 1))}
              className="rounded bg-accent px-3 py-1 text-xs font-medium text-accent-fg transition-opacity hover:opacity-90"
            >
              {isLast ? (isRu ? "Готово" : "Done") : (isRu ? "Далее" : "Next")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
