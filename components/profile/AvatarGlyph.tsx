"use client";
import { useEffect, useState } from "react";
import { getAvatarEmblem } from "@/lib/profile-emblems";

interface AvatarGlyphProps {
  color:    string;
  emblemId: string | null | undefined;
  initials: string;
  // Контролирует размер и размер шрифта самого кружка, например
  // "h-20 w-20 text-3xl" — единый пропс вместо трёх, чтобы вызывающему
  // коду не нужно было синхронизировать три класса руками на каждом
  // из мест использования (шапка настроек, публичный профиль, ...).
  sizeClass: string;
  // Размер картинки-эмблемы ВНУТРИ кружка относительно самого кружка —
  // по умолчанию чуть меньше половины, чтобы вокруг оставался отступ
  // (так же, как инициал никогда не занимает кружок целиком).
  emblemSizeClass?: string;
  className?: string;
}

// Общий рендер аватарки — переиспользуется и в /profile (свои настройки),
// и в публичном профиле /u/[username], чтобы оба места одинаково
// обрабатывали случай "эмблема выбрана, но картинка ещё не появилась в
// /public/avatars/emblems/" (пока весь набор не сгенерирован через
// Nano Banana 2 — см. переданный пользователю файл с промтами) — тогда
// тихо показываем инициал, как и раньше, а не сломанную иконку.
export function AvatarGlyph({
  color, emblemId, initials, sizeClass, emblemSizeClass = "h-[46%] w-[46%]", className = "",
}: AvatarGlyphProps) {
  const emblem = getAvatarEmblem(emblemId);
  // null = "ещё не проверяли" (или проверка идёт), true/false — результат
  // предзагрузки. Намеренно НЕ рендерим <img src={emblem.src}> сразу и
  // не полагаемся на его onError: страница рендерится на сервере, и
  // из отданного HTML браузер начинает грузить картинку ДО того, как
  // React вообще успевает гидрироваться и повесить обработчики —
  // на "битый" src (пресет ещё не сгенерирован и лежит 404) нативная
  // ошибка загрузки успевает проскочить мимо ещё не подключённого
  // синтетического onError, и сломанная иконка так и остаётся
  // навсегда, ничем не отличаясь по виду от настоящей эмблемы, пока
  // не приглядишься. new Image() в эффекте — целиком клиентская,
  // всегда ПОСЛЕ гидрации, проверка без этой гонки.
  const [loaded, setLoaded] = useState<boolean | null>(null);

  useEffect(() => {
    if (!emblem) { setLoaded(null); return; }
    let cancelled = false;
    setLoaded(null);
    const img = new window.Image();
    img.onload  = () => { if (!cancelled) setLoaded(true); };
    img.onerror = () => { if (!cancelled) setLoaded(false); };
    img.src = emblem.src;
    return () => { cancelled = true; };
  }, [emblem]);

  const showEmblem = emblem && loaded;

  return (
    <div
      className={`relative flex items-center justify-center rounded-full font-bold text-white shadow-lg ${sizeClass} ${className}`}
      style={{ background: color }}
    >
      {showEmblem ? (
        <>
          {/* Нейтральная подложка под эмблемой — без неё светлый силуэт
              эмблемы (все 16 текущих пресетов светлые, см.
              lib/profile-emblems.ts) сливается с фоном на светлых
              цветах аватарки (особенно "Белый") и теряет контраст на
              цветах, близких к акцентным деталям самой эмблемы
              (например зелёные эмблемы на зелёной аватарке). Подложка
              фиксированная тёмная, а не подстраивающаяся под цвет
              аватарки — так контраст гарантирован при любом из 10
              цветов, ничего не считаем на лету. */}
          <div className="absolute z-0 h-[64%] w-[64%] rounded-full bg-canvas/90 shadow-inner ring-1 ring-black/20" />
          <img src={emblem!.src} alt="" className={`relative z-10 ${emblemSizeClass} object-contain`} />
        </>
      ) : (
        initials
      )}
    </div>
  );
}
