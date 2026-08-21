"use client";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

const WORDS_EN = ["lorem","ipsum","dolor","sit","amet","consectetur","adipiscing","elit","sed","do","eiusmod","tempor","incididunt","ut","labore","et","dolore","magna","aliqua","enim","ad","minim","veniam","quis","nostrud","exercitation","ullamco","laboris","nisi","aliquip","ex","ea","commodo","consequat","duis","aute","irure","in","reprehenderit","voluptate","velit","esse","cillum","eu","fugiat","nulla","pariatur","excepteur","sint","occaecat","cupidatat","non","proident","sunt","culpa","qui","officia","deserunt","mollit","anim","id","est","laborum"];

const WORDS_RU = ["лорем","ипсум","долор","сит","амет","консектетур","адипискинг","элит","сед","до","эйусмод","темпор","инцididунт","ут","лаборе","эт","долоре","магна","аликва","эним","ад","миним","вениам","квис","ностrud","экзерситатион","улламко","лаборис","ниси","алликвип","экс","эа","коммодо","конsequат","дуис","ауте","иrure","ин","репрехендерит","волuptате","велит","ессе","чиллум","эу","фуgиат","нулла","pariatur","экzептеур","синт","оccaecат"];

function genWords(count: number, ru: boolean) {
  const words = ru ? WORDS_RU : WORDS_EN;
  return Array.from({ length: count }, () => words[Math.floor(Math.random() * words.length)]).join(" ");
}

function genSentence(ru: boolean) {
  const len = 8 + Math.floor(Math.random() * 12);
  const sentence = genWords(len, ru);
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".";
}

function genParagraph(ru: boolean) {
  const count = 4 + Math.floor(Math.random() * 4);
  return Array.from({ length: count }, () => genSentence(ru)).join(" ");
}

export function LoremIpsumTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.common.copy === "Копировать";
  const [type,   setType]   = useState<"words"|"sentences"|"paragraphs">("paragraphs");
  const [count,  setCount]  = useState(3);
  const [lang,   setLang]   = useState<"en"|"ru">("en");
  const [seed,   setSeed]   = useState(0);

  const output = useMemo(() => {
    void seed;
    const ru = lang === "ru";
    if (type === "words")      return genWords(count, ru);
    if (type === "sentences")  return Array.from({ length: count }, () => genSentence(ru)).join(" ");
    return Array.from({ length: count }, () => genParagraph(ru)).join("\n\n");
  }, [type, count, lang, seed]);

  const typeLabels: Record<string, [string, string]> = {
    words:      [isRu ? "Слова" : "Words", isRu ? "Слово" : "Word"],
    sentences:  [isRu ? "Предложения" : "Sentences", isRu ? "Предложение" : "Sentence"],
    paragraphs: [isRu ? "Абзацы" : "Paragraphs", isRu ? "Абзац" : "Paragraph"],
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="input-label">{isRu ? "Тип" : "Type"}</label>
          <div className="flex rounded border border-border overflow-hidden">
            {(["words","sentences","paragraphs"] as const).map(t => (
              <button key={t} onClick={() => setType(t)}
                className={`px-3 py-1.5 text-xs transition-colors ${type === t ? "bg-accent text-accent-fg" : "bg-surface text-text-muted hover:bg-surface-hover"}`}>
                {typeLabels[t][0]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="input-label">{typeLabels[type][1]}</label>
          <input type="number" value={count} min={1} max={50}
            onChange={e => setCount(Math.min(50, Math.max(1, Number(e.target.value))))}
            className="code-surface w-20 rounded-lg px-3 py-2 text-sm text-text-primary outline-none" />
        </div>

        <div className="flex rounded border border-border overflow-hidden">
          {(["en","ru"] as const).map(l => (
            <button key={l} onClick={() => setLang(l)}
              className={`px-3 py-1.5 text-xs transition-colors ${lang === l ? "bg-accent text-accent-fg" : "bg-surface text-text-muted hover:bg-surface-hover"}`}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        <button onClick={() => setSeed(s => s + 1)}
          className="rounded border border-border bg-surface px-3 py-2 text-xs text-text-muted hover:bg-surface-hover transition-colors">
          {isRu ? "Обновить" : "Refresh"}
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="input-label mb-0">
            {output.split(/\s+/).length} {isRu ? "слов" : "words"} · {output.length} {isRu ? "символов" : "chars"}
          </label>
          <CopyButton value={output} />
        </div>
        <textarea readOnly value={output} rows={type === "paragraphs" ? 12 : 6} spellCheck={false}
          className="code-surface w-full rounded-lg p-4 text-sm text-text-secondary leading-relaxed outline-none" />
      </div>
    </div>
  );
}