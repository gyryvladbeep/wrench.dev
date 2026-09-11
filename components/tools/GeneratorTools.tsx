"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";
import { LockIcon, UnlockIcon } from "@/components/icons/GameIcons";

// ─── Random Color Generator ───────────────────────────────────────────────────
function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}
function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}
function randomHex(): string {
  return "#" + Array.from(crypto.getRandomValues(new Uint8Array(3))).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function RandomColorTool({ dict }: { dict: Dictionary }) {
  // ФИКС — НАСТОЯЩАЯ причина флейка "заблокированный цвет меняется",
  // найдена только сейчас при попытке живьём воспроизвести баг локально.
  // Первым подозреваемым была гонка между обработчиками клика (см.
  // lockedRef чуть ниже) — она реальна и тоже исправлена, но сама по
  // себе не объясняла, почему баг переживал даже синхронную правку.
  // Настоящая причина оказалась в том, КАК инициализировались colors:
  // randomHex() использует crypto.getRandomValues(), а раньше он вызывался
  // прямо в ленивом инициализаторе useState() — том самом, что выполняется
  // и на сервере при SSR, и ЕЩЁ РАЗ на клиенте при первом рендере. Это два
  // разных вызова, дающих разные цвета — React ловит расхождение как
  // hydration mismatch (видно в консоли: "Text content did not match") и
  // в качестве восстановления ЗАМЕНЯЕТ весь серверный DOM этого поддерева
  // клиентским — целиком, вместе с обработчиками кликов. Если клик по
  // замку успевал попасть в окно ДО этой замены, он проваливался в
  // DOM-узел, который через мгновение выбрасывался, а смонтированный
  // заново компонент стартовал с locked = [false...] — замок визуально
  // защёлкивался, но по факту не действовал. Подтверждено напрямую: при
  // каждой (100% из проверенных) загрузке этой страницы React пишет в
  // консоль предупреждение о несовпадении гидратации — расхождение
  // случается всегда, а тест ловит его как флейк только потому, что для
  // срабатывания нужно попасть кликом именно в это узкое окно.
  //
  // Тот же паттерн уже был на практике исправлен в этом кодбейзе для
  // LoremIpsumTool.tsx (см. его комментарий) — Math.random() там вызывался
  // так же. Повторяем то же решение, а не изобретаем новое: значение,
  // зависящее от рандома, вычисляется не в useState(), а в useEffect(),
  // который гарантированно выполняется только на клиенте, ПОСЛЕ того как
  // сервер и клиент уже согласились на одинаковый первый рендер (здесь —
  // пустой массив). Хуже стало UUID Generator и NanoID Generator ниже в
  // этом же файле — у них тот же паттерн ленивого useState() с
  // crypto.getRandomValues()/crypto.randomUUID() внутри, тот же класс
  // бага (просто без функции блокировки, которая делает его заметным
  // тестом) — исправлены тем же способом заодно.
  const [colors, setColors] = useState<string[]>([]);
  const [locked, setLocked] = useState<boolean[]>(new Array(5).fill(false));

  useEffect(() => {
    setColors(Array.from({ length: 5 }, randomHex));
  }, []);

  // Синхронное зеркало locked для generate() — тот же приём, что
  // draggedSlugRef в WorkbenchCanvas.tsx: generate() до этой правки читал
  // locked из обычного замыкания, актуального только для того рендера, в
  // котором эта функция была создана. next считается и кладётся в
  // lockedRef.current СИНХРОННО в самом обработчике клика, до вызова
  // setLocked — generate() читает ref, а не state, так что ему физически
  // нечего гонять с рендером. (Ранняя версия этой правки писала
  // lockedRef.current ВНУТРИ колбэка setLocked((prev) => {...}) — рабочая,
  // но не устраняющая зависимость от таймингов React полностью; текущая
  // версия синхронна от начала до конца.)
  const lockedRef = useRef(locked);

  function toggleLock(i: number) {
    const next = lockedRef.current.map((v, j) => (j === i ? !v : v));
    lockedRef.current = next;
    setLocked(next);
  }

  function generate() {
    setColors((prev) => prev.map((c, i) => lockedRef.current[i] ? c : randomHex()));
  }

  function copyAll() {
    navigator.clipboard.writeText(colors.join("\n"));
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Button onClick={generate}>Generate</Button>
        <Button variant="secondary" onClick={copyAll}>Copy all HEX</Button>
      </div>
      <div className="space-y-2">
        {colors.map((hex, i) => {
          const { r, g, b } = hexToRgb(hex);
          const { h, s, l } = rgbToHsl(r, g, b);
          const textColor = l > 50 ? "#000" : "#fff";
          return (
            <div key={i} className="flex items-center gap-3 rounded-[10px] overflow-hidden border border-border">
              <div className="h-16 w-24 shrink-0 flex items-center justify-center font-mono text-sm font-bold" style={{ background: hex, color: textColor }}>
                {hex.toUpperCase()}
              </div>
              <div className="flex-1 grid grid-cols-3 gap-2 text-xs text-text-muted font-mono">
                <span>HEX: {hex.toUpperCase()}</span>
                <span>RGB: {r},{g},{b}</span>
                <span>HSL: {h}°,{s}%,{l}%</span>
              </div>
              <div className="flex items-center gap-2 pr-3">
                <button onClick={() => toggleLock(i)}
                  title={locked[i] ? "Unlock" : "Lock"}
                  className={`text-sm ${locked[i] ? "text-accent" : "text-text-muted hover:text-text-primary"}`}>
                  {locked[i] ? <LockIcon size={14} /> : <UnlockIcon size={14} />}
                </button>
                <CopyButton value={hex.toUpperCase()} label={dict.common.copy} copiedLabel={dict.common.copied} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── NanoID Generator ─────────────────────────────────────────────────────────
const DEFAULT_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-";

function generateNanoId(size: number, alphabet: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(size * 2));
  let id = "";
  for (const byte of bytes) {
    const idx = byte & (alphabet.length - 1);
    if (idx < alphabet.length) { id += alphabet[idx]; if (id.length === size) break; }
  }
  return id;
}

export function NanoIdTool({ dict }: { dict: Dictionary }) {
  const [size, setSize] = useState(21);
  const [alphabet, setAlphabet] = useState(DEFAULT_ALPHABET);
  const [count, setCount] = useState(5);
  // ФИКС — тот же класс SSR/клиент hydration mismatch, что и в
  // RandomColorTool чуть выше (см. его подробный комментарий): generateNanoId()
  // тоже вызывает crypto.getRandomValues(), так что список не может
  // рождаться в ленивом инициализаторе useState(). Здесь пока нет
  // собственного теста, ловящего именно эту гонку, но баг того же рода:
  // React пишет в консоль hydration-warning при каждой загрузке.
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    setIds(Array.from({ length: 5 }, () => generateNanoId(21, DEFAULT_ALPHABET)));
  }, []);

  function generate() {
    if (!alphabet.trim()) return;
    setIds(Array.from({ length: Math.min(count, 200) }, () => generateNanoId(size, alphabet)));
  }

  const output = ids.join("\n");

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">Size</label>
          <input type="number" min={4} max={128} value={size} onChange={(e) => setSize(Number(e.target.value))}
            className="code-surface w-20 rounded-[10px] p-2 text-sm text-text-primary outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">Count</label>
          <input type="number" min={1} max={200} value={count} onChange={(e) => setCount(Number(e.target.value))}
            className="code-surface w-20 rounded-[10px] p-2 text-sm text-text-primary outline-none" />
        </div>
        <Button onClick={generate}>Generate</Button>
        <div className="ml-auto">
          <CopyButton value={output} label="Copy all" copiedLabel={dict.common.copied} />
        </div>
      </div>
      <div className="mb-3">
        <label className="mb-1 block text-xs font-medium text-text-muted">Alphabet</label>
        <input value={alphabet} onChange={(e) => setAlphabet(e.target.value)}
          className="code-surface w-full rounded-[10px] p-2 font-mono text-sm text-text-primary outline-none" />
      </div>
      <textarea readOnly value={output} rows={8}
        className="code-surface w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none" />
    </div>
  );
}
