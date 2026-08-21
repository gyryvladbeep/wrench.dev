"use client";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

// Simple ASCII font using a minimal built-in character map
const TINY: Record<string, string[]> = {
  A:["  #  "," # # ","#####","#   #","#   #"],B:["#### ","#   #","#### ","#   #","#### "],
  C:[" ####","#    ","#    ","#    "," ####"],D:["#### ","#   #","#   #","#   #","#### "],
  E:["#####","#    ","#### ","#    ","#####"],F:["#####","#    ","#### ","#    ","#    "],
  G:[" ####","#    ","# ###","#   #"," ### "],H:["#   #","#   #","#####","#   #","#   #"],
  I:[" ### ","  #  ","  #  ","  #  "," ### "],J:["  ###","   # ","   # ","#  # "," ##  "],
  K:["#   #","#  # ","###  ","#  # ","#   #"],L:["#    ","#    ","#    ","#    ","#####"],
  M:["#   #","## ##","# # #","#   #","#   #"],N:["#   #","##  #","# # #","#  ##","#   #"],
  O:[" ### ","#   #","#   #","#   #"," ### "],P:["#### ","#   #","#### ","#    ","#    "],
  Q:[" ### ","#   #","# # #","#  # "," ## #"],R:["#### ","#   #","#### ","#  # ","#   #"],
  S:[" ####","#    "," ### ","    #","#### "],T:["#####","  #  ","  #  ","  #  ","  #  "],
  U:["#   #","#   #","#   #","#   #"," ### "],V:["#   #","#   #","#   #"," # # ","  #  "],
  W:["#   #","#   #","# # #","## ##","#   #"],X:["#   #"," # # ","  #  "," # # ","#   #"],
  Y:["#   #"," # # ","  #  ","  #  ","  #  "],Z:["#####","   # ","  #  "," #   ","#####"],
  " ":["     ","     ","     ","     ","     "],"0":[" ### ","#  ##","# # #","##  #"," ### "],
  "1":["  #  "," ##  ","  #  ","  #  ","#####"],"2":[" ### ","#   #","  ## "," #   ","#####"],
  "3":["#### ","    #","  ## ","    #","#### "],"4":["#   #","#   #","#####","    #","    #"],
  "5":["#####","#    ","#### ","    #","#### "],"6":[" ### ","#    ","#### ","#   #"," ### "],
  "7":["#####","    #","   # ","  #  ","  #  "],"8":[" ### ","#   #"," ### ","#   #"," ### "],
  "9":[" ### ","#   #"," ### ","    #"," ### "],"!":[" # "," # "," # ","   "," # "],
  "?":[" ## ","   #","  # ","    "," #  "],".":[" ","  ","  ","  ","# "],
};

function toAsciiArt(text: string): string {
  const chars = text.toUpperCase().split("");
  const lines = [0,1,2,3,4].map(() => "");
  chars.forEach((c) => {
    const glyph = TINY[c] ?? TINY[" "];
    glyph.forEach((row, i) => { lines[i] += row + " "; });
  });
  return lines.join("\n");
}

export function AsciiArtTool({ dict }: { dict: Dictionary }) {
  const [input, setInput] = useState("WRENCH");
  const isRu = dict.common.copy === "Копировать";
  const output = useMemo(() => toAsciiArt(input.slice(0, 20)), [input]);

  return (
    <div className="space-y-4">
      <div>
        <label className="input-label">{isRu ? "Текст (макс. 20 символов)" : "Text (max 20 characters)"}</label>
        <input value={input} onChange={(e) => setInput(e.target.value.slice(0,20))} maxLength={20}
          placeholder="WRENCH"
          className="code-surface w-full rounded-[10px] px-3 py-2.5 text-sm text-text-primary outline-none" />
        <p className="mt-1 text-xs text-text-muted">{input.length}/20 · {isRu ? "Поддерживаются A-Z, 0-9" : "A-Z and 0-9 supported"}</p>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="input-label">ASCII Art</label>
          <CopyButton value={output} />
        </div>
        <pre className="code-surface rounded-[10px] p-4 font-mono text-sm text-accent overflow-auto whitespace-pre">
          {output || " "}
        </pre>
      </div>
      <p className="text-xs text-text-muted">
        {isRu ? "Отлично подходит для README-заголовков и баннеров терминала." : "Perfect for README headers and terminal banners."}
      </p>
    </div>
  );
}
