"use client";
import { useState } from "react";
import { Dictionary } from "@/lib/i18n/dictionary-types";

type Severity = "critical" | "high" | "medium" | "info";

interface Finding {
  ruleId: string;
  severity: Severity;
  help: string;
  nodes: { html: string; target: string }[];
}

const SEVERITY_STYLE: Record<Severity, { color: string; bg: string; badge: string }> = {
  critical: { color: "text-red-400",    bg: "border-red-500/30 bg-red-500/5",       badge: "bg-red-500" },
  high:     { color: "text-orange-400", bg: "border-orange-500/30 bg-orange-500/5", badge: "bg-orange-500" },
  medium:   { color: "text-amber-400",  bg: "border-amber-500/30 bg-amber-500/5",   badge: "bg-amber-500" },
  info:     { color: "text-blue-400",   bg: "border-blue-500/30 bg-blue-500/5",     badge: "bg-blue-500" },
};

// axe-core reports its own "impact" scale — map it onto the same four-level
// severity used by the other checker tools (HTTP Security Headers, JWT) so
// the visual language stays consistent across the QA category.
const IMPACT_TO_SEVERITY: Record<string, Severity> = {
  critical: "critical",
  serious: "high",
  moderate: "medium",
  minor: "info",
};
const SEVERITY_ORDER: Severity[] = ["critical", "high", "medium", "info"];

const SAMPLE_HTML = `<div class="card">
  <img src="banner.jpg">
  <h1>Welcome</h1>
  <button style="background:#eeeeee;color:#cccccc;padding:6px 10px;border:none;">Submit</button>
  <input type="text" placeholder="Your email">
  <a href="#" style="color:#0000EE;">Click here</a>
</div>`;

// ═══════════════════════════════════════════════════════════════
// The pasted HTML is untrusted input. Before it ever touches a real,
// connected DOM node (needed so axe-core can compute real layout and
// color-contrast — a detached DOMParser tree can't), strip everything
// that could execute: <script>, inline "on*" handlers, javascript:
// URLs, and anything that could load nested content (iframe/object/
// embed) or navigate the page (meta refresh, <base>). <style> is left
// alone — it can't execute anything and color-contrast needs it.
// ═══════════════════════════════════════════════════════════════
function sanitize(doc: Document) {
  doc.querySelectorAll("script, iframe, object, embed, frame, frameset, meta, base, link").forEach((el) => el.remove());
  doc.querySelectorAll("*").forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      if (name.startsWith("on")) { el.removeAttribute(attr.name); return; }
      if ((name === "href" || name === "src" || name === "action" || name === "formaction") && /^\s*javascript:/i.test(attr.value)) {
        el.removeAttribute(attr.name);
      }
    });
  });
}

export function A11yCheckerTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.common.copy === "Скопировать";
  const [input, setInput] = useState(SAMPLE_HTML);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const [passCount, setPassCount] = useState(0);

  async function run() {
    setLoading(true);
    setError(null);
    setFindings(null);

    let container: HTMLDivElement | null = null;
    try {
      const doc = new DOMParser().parseFromString(input, "text/html");
      sanitize(doc);
      const styles = Array.from(doc.head.querySelectorAll("style"));

      // Rendered in normal document flow, appended after everything else on
      // the page — NOT hidden with position:fixed/absolute + an off-screen
      // offset, display:none or visibility:hidden. axe-core's own
      // visibility heuristics treat exactly that off-canvas pattern as the
      // classic "sr-only" hidden-content technique and skip most
      // visibility-dependent checks (color-contrast included) on anything
      // styled that way — which silently produced false negatives here.
      // A user would have to scroll to the very bottom of the page at the
      // instant this runs to ever see it, and it's removed in `finally`
      // right after. "all: initial" clears this app's own dark theme/
      // Tailwind cascade first, so contrast checks see a plain white-page
      // baseline like the snippet would actually render in an empty HTML
      // document, not this site's colors.
      container = document.createElement("div");
      container.style.cssText =
        "all: initial; display: block; width: 1024px; background: #ffffff; color: #000000; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.5;";
      styles.forEach((s) => container!.appendChild(s.cloneNode(true)));
      container.insertAdjacentHTML("beforeend", doc.body.innerHTML);
      document.body.appendChild(container);

      const axeModule: unknown = await import("axe-core");
      const axe = (axeModule as { default?: typeof import("axe-core") }).default ?? (axeModule as typeof import("axe-core"));

      const results = await axe.run(container, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
      });

      const list: Finding[] = results.violations.map((v) => ({
        ruleId: v.id,
        severity: IMPACT_TO_SEVERITY[v.impact ?? "minor"] ?? "info",
        help: v.help,
        nodes: v.nodes.slice(0, 3).map((n) => ({ html: n.html, target: n.target.join(" ") })),
      }));
      list.sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));

      setFindings(list);
      setPassCount(results.passes.length);
    } catch {
      setError(isRu ? "Не удалось разобрать или проверить этот HTML." : "Couldn't parse or check this HTML.");
    } finally {
      if (container) container.remove();
      setLoading(false);
    }
  }

  function severityLabel(s: Severity): string {
    if (s === "critical") return isRu ? "Критично" : "Critical";
    if (s === "high") return isRu ? "Серьёзно" : "Serious";
    if (s === "medium") return isRu ? "Средне" : "Moderate";
    return isRu ? "Незначительно" : "Minor";
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="input-label mb-0">{isRu ? "HTML для проверки" : "HTML to check"}</label>
          <button onClick={() => setInput(SAMPLE_HTML)} className="text-xs text-text-muted hover:text-text-primary transition-colors">
            {isRu ? "Пример" : "Example"}
          </button>
        </div>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={9} spellCheck={false}
          placeholder={isRu ? "Вставьте HTML-разметку (фрагмент или целую страницу)..." : "Paste HTML markup (a snippet or a whole page)..."}
          className="code-surface w-full rounded-lg p-3 font-mono text-sm text-text-primary outline-none" />
        <p className="mt-1 text-[11px] text-text-muted">
          {isRu
            ? "Скрипты, обработчики событий и вложенный контент (iframe и т.п.) удаляются перед проверкой — ничего из вставленного HTML не выполняется."
            : "Scripts, event handlers and nested content (iframes etc.) are stripped before checking — nothing from the pasted HTML ever executes."}
        </p>
      </div>

      <button onClick={run} disabled={loading}
        className="rounded bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg hover:bg-amber-400 transition-colors disabled:opacity-50">
        {loading ? (isRu ? "Проверяю..." : "Checking...") : (isRu ? "Проверить" : "Check")}
      </button>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {findings !== null && !error && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-4 text-xs text-text-muted">
            <span>{findings.length} {isRu ? "нарушений" : "violations"}</span>
            <span>{passCount} {isRu ? "проверок пройдено" : "checks passed"}</span>
          </div>

          {findings.length === 0 ? (
            <p className="rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-muted">
              {isRu ? "Нарушений WCAG A/AA не найдено." : "No WCAG A/AA violations found."}
            </p>
          ) : (
            <div className="space-y-2">
              {findings.map((f, i) => {
                const style = SEVERITY_STYLE[f.severity];
                return (
                  <div key={`${f.ruleId}-${i}`} className={`rounded-lg border px-3 py-2.5 ${style.bg}`}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`rounded px-1.5 py-px text-[9px] font-bold text-white ${style.badge}`}>
                        {severityLabel(f.severity)}
                      </span>
                      <span className="font-mono text-[11px] text-text-muted">{f.ruleId}</span>
                    </div>
                    <p className={`mt-1 text-xs ${style.color}`}>{f.help}</p>
                    {f.nodes.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {f.nodes.map((n, j) => (
                          <code key={j} className="block truncate rounded bg-canvas px-2 py-1 font-mono text-[10px] text-text-muted">
                            {n.html}
                          </code>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-[11px] text-text-muted">
            {isRu
              ? "Проверка выполняется через axe-core (Deque) по правилам WCAG 2.0/2.1 A и AA, полностью в браузере. Описания правил — на английском, это язык самой библиотеки axe-core."
              : "Checked with axe-core (Deque) against WCAG 2.0/2.1 A and AA rules, entirely in your browser. Rule descriptions are in English — that's axe-core's own output."}
          </p>
        </div>
      )}
    </div>
  );
}
