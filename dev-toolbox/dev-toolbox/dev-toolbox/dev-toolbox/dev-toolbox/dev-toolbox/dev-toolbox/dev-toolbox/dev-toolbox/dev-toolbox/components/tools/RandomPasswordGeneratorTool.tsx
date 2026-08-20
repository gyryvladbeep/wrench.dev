"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

const SETS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.<>?",
};

function generatePassword(length: number, opts: Record<keyof typeof SETS, boolean>): string {
  const pool = (Object.keys(opts) as (keyof typeof SETS)[])
    .filter((k) => opts[k])
    .map((k) => SETS[k])
    .join("");
  if (!pool) return "";
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => pool[b % pool.length]).join("");
}

function estimateStrength(
  length: number,
  opts: Record<keyof typeof SETS, boolean>,
  t: Dictionary["tools"]["password"]
): string {
  const poolSize = (Object.keys(opts) as (keyof typeof SETS)[])
    .filter((k) => opts[k])
    .reduce((sum, k) => sum + SETS[k].length, 0);
  const bits = poolSize > 0 ? Math.log2(poolSize) * length : 0;
  if (bits < 40) return t.weak;
  if (bits < 64) return t.fair;
  if (bits < 90) return t.strong;
  return t.veryStrong;
}

export function RandomPasswordGeneratorTool({ dict }: { dict: Dictionary }) {
  const [length, setLength] = useState(20);
  const [opts, setOpts] = useState({ lower: true, upper: true, digits: true, symbols: true });
  const [password, setPassword] = useState("");
  const t = dict.tools.password;

  // Regenerate live as the slider moves or character sets change — not just
  // on a button click — so the password on screen always matches the
  // length/options currently shown. The "Generate" button still works for
  // getting a fresh password without changing any setting.
  useEffect(() => {
    setPassword(generatePassword(length, opts));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [length, opts]);

  const strength = useMemo(() => estimateStrength(length, opts, t), [length, opts, t]);

  function regenerate() {
    setPassword(generatePassword(length, opts));
  }

  function toggle(key: keyof typeof SETS) {
    setOpts((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // Never allow all character sets to be turned off.
      if (!Object.values(next).some(Boolean)) return prev;
      return next;
    });
  }

  const setLabels: Record<keyof typeof SETS, string> = {
    lower: t.lower,
    upper: t.upper,
    digits: t.digits,
    symbols: t.symbols,
  };

  return (
    <div>
      <div className="code-surface flex items-center justify-between rounded-[10px] p-4">
        <span className="break-all font-mono text-lg text-text-primary">{password || "—"}</span>
        <CopyButton value={password} label={dict.common.copy} copiedLabel={dict.common.copied} />
      </div>
      <p className="mt-2 text-xs text-text-muted">
        {t.strengthPrefix} {strength}
      </p>

      <div className="mt-6 flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="pw-length" className="mb-1 block text-xs font-medium text-text-muted">
            {t.length} {length}
          </label>
          <input
            id="pw-length"
            type="range"
            min={6}
            max={64}
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="w-48"
          />
        </div>
        {(Object.keys(SETS) as (keyof typeof SETS)[]).map((key) => (
          <label key={key} className="flex items-center gap-2 text-sm text-text-muted">
            <input type="checkbox" checked={opts[key]} onChange={() => toggle(key)} />
            {setLabels[key]}
          </label>
        ))}
        <Button onClick={regenerate}>{t.generate}</Button>
      </div>
    </div>
  );
}
