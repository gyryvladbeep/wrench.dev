"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

type Dialect = "sql" | "mysql" | "postgresql" | "sqlite" | "tsql";

const KEYWORDS = [
  "SELECT", "FROM", "WHERE", "AND", "OR", "NOT", "IN", "EXISTS",
  "INSERT", "INTO", "VALUES", "UPDATE", "SET", "DELETE",
  "CREATE", "TABLE", "ALTER", "DROP", "INDEX", "VIEW",
  "JOIN", "LEFT", "RIGHT", "INNER", "OUTER", "FULL", "CROSS",
  "ON", "AS", "DISTINCT", "ORDER", "BY", "GROUP", "HAVING",
  "LIMIT", "OFFSET", "UNION", "ALL", "EXCEPT", "INTERSECT",
  "CASE", "WHEN", "THEN", "ELSE", "END",
  "PRIMARY", "KEY", "FOREIGN", "REFERENCES", "UNIQUE", "NULL",
  "DEFAULT", "NOT NULL", "AUTO_INCREMENT", "AUTOINCREMENT",
  "BEGIN", "COMMIT", "ROLLBACK", "TRANSACTION",
  "RETURNING", "WITH", "CTE", "RECURSIVE",
];

const BREAK_BEFORE = new Set([
  "SELECT", "FROM", "WHERE", "AND", "OR", "JOIN", "LEFT", "RIGHT",
  "INNER", "OUTER", "FULL", "CROSS", "ON", "ORDER", "GROUP",
  "HAVING", "LIMIT", "OFFSET", "UNION", "EXCEPT", "INTERSECT",
  "INSERT", "INTO", "VALUES", "UPDATE", "SET", "DELETE",
  "CREATE", "ALTER", "DROP",
]);

/** Pure-JS SQL formatter — no external dependencies, handles most
 *  real-world SELECT / INSERT / UPDATE / DELETE / CREATE queries. */
function formatSql(sql: string, indent = "  "): string {
  // Tokenize: preserve string literals and comments intact
  const tokens: string[] = [];
  let i = 0;
  while (i < sql.length) {
    if (sql[i] === "'" || sql[i] === '"' || sql[i] === "`") {
      const q = sql[i];
      let j = i + 1;
      while (j < sql.length && !(sql[j] === q && sql[j - 1] !== "\\")) j++;
      tokens.push(sql.slice(i, j + 1));
      i = j + 1;
    } else if (sql.slice(i, i + 2) === "--") {
      let j = i;
      while (j < sql.length && sql[j] !== "\n") j++;
      tokens.push(sql.slice(i, j));
      i = j;
    } else if (sql.slice(i, i + 2) === "/*") {
      let j = i + 2;
      while (j < sql.length && sql.slice(j, j + 2) !== "*/") j++;
      tokens.push(sql.slice(i, j + 2));
      i = j + 2;
    } else if (/\s/.test(sql[i])) {
      i++;
    } else if (/[(),;]/.test(sql[i])) {
      tokens.push(sql[i]);
      i++;
    } else {
      let j = i;
      while (j < sql.length && !/[\s(),;'"`]/.test(sql[j])) j++;
      tokens.push(sql.slice(i, j));
      i = j;
    }
  }

  const lines: string[] = [];
  let depth = 0;
  let currentLine = "";

  function flush() {
    if (currentLine.trim()) lines.push(indent.repeat(depth) + currentLine.trim());
    currentLine = "";
  }

  for (const token of tokens) {
    const upper = token.toUpperCase();
    const isKeyword = KEYWORDS.includes(upper);

    if (token === "(") {
      currentLine += "(";
      depth++;
    } else if (token === ")") {
      depth = Math.max(0, depth - 1);
      flush();
      currentLine = ")";
    } else if (token === ",") {
      currentLine += ",";
      flush();
    } else if (token === ";") {
      flush();
      lines.push(";");
      lines.push("");
    } else if (isKeyword && BREAK_BEFORE.has(upper)) {
      flush();
      currentLine = token.toUpperCase();
    } else if (isKeyword) {
      currentLine += (currentLine ? " " : "") + token.toUpperCase();
    } else {
      currentLine += (currentLine ? " " : "") + token;
    }
  }
  flush();

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function minifySql(sql: string): string {
  return sql
    .replace(/--[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function SqlFormatterTool({ dict }: { dict: Dictionary }) {
  const [input, setInput] = useState(
    "select u.id, u.name, u.email, o.total from users u left join orders o on u.id = o.user_id where u.active = 1 and o.total > 100 order by o.total desc limit 20;"
  );
  const [mode, setMode] = useState<"format" | "minify">("format");
  const [dialect, setDialect] = useState<Dialect>("sql");
  const t = dict.tools.sqlFormatter;

  const result = useMemo(() => {
    if (!input.trim()) return { ok: true as const, value: "" };
    try {
      const value = mode === "minify" ? minifySql(input) : formatSql(input);
      return { ok: true as const, value };
    } catch (err) {
      return { ok: false as const, message: err instanceof Error ? err.message : "Error" };
    }
  }, [input, mode]);

  const dialects = Object.entries(t.dialects) as [Dialect, string][];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant={mode === "format" ? "primary" : "secondary"} onClick={() => setMode("format")}>
          {t.format}
        </Button>
        <Button variant={mode === "minify" ? "primary" : "secondary"} onClick={() => setMode("minify")}>
          {t.minify}
        </Button>
        <div className="ml-2 flex items-center gap-1 text-sm text-text-muted">
          <span>{t.dialectLabel}</span>
          <select
            value={dialect}
            onChange={(e) => setDialect(e.target.value as Dialect)}
            className="code-surface rounded-[10px] px-2 py-1 text-sm text-text-primary outline-none"
          >
            {dialects.map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div className="ml-auto flex gap-2">
          <CopyButton value={result.ok ? result.value : ""} label={dict.common.copy} copiedLabel={dict.common.copied} />
          <Button
            variant="secondary"
            disabled={!result.ok || !result.value}
            onClick={() => {
              const blob = new Blob([result.ok ? result.value : ""], { type: "text/plain" });
              const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
              a.download = "formatted.sql"; a.click();
            }}
          >
            {dict.common.download}
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="sql-input" className="mb-1 block text-xs font-medium text-text-muted">
            {dict.common.input}
          </label>
          <textarea
            id="sql-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            className="code-surface h-72 w-full rounded-[10px] p-3 font-mono text-sm text-text-primary outline-none"
            placeholder={t.placeholder}
          />
        </div>
        <div>
          <label htmlFor="sql-output" className="mb-1 block text-xs font-medium text-text-muted">
            {dict.common.output}
          </label>
          <textarea
            id="sql-output"
            readOnly
            value={result.ok ? result.value : `${t.invalidPrefix} ${result.message}`}
            spellCheck={false}
            className={`code-surface h-72 w-full rounded-[10px] p-3 font-mono text-sm outline-none ${
              result.ok ? "text-text-primary" : "text-red-400"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
