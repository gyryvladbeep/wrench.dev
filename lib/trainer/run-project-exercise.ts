import { ProjectCheck } from "./project-exercises";

// ═══════════════════════════════════════════════════════════════
// Почему iframe, а не Worker (как в run-exercise.ts)
// ═══════════════════════════════════════════════════════════════
// Проектные упражнения — это целый HTML-документ с DOM и событиями
// (клики, ввод в поле), а не одна вызываемая функция — Worker не видит
// DOM в принципе, он для этого не подходит. Вместо этого — скрытый
// iframe с sandbox="allow-scripts" (без allow-same-origin, поэтому у
// него непрозрачный origin и он не может ничего прочитать/сломать за
// пределами себя самого) и постоянный интерпретатор-харнесс
// (HARNESS_SOURCE), который дописывается в конец документа пользователя
// и общается с родительским окном через postMessage — единственный
// канал, который работает даже с непрозрачным origin.
//
// ═══════════════════════════════════════════════════════════════
// Почему один iframe НА КАЖДУЮ проверку, а не один iframe на все
// проверки упражнения сразу
// ═══════════════════════════════════════════════════════════════
// Первая версия прогоняла все checks одного упражнения по очереди в
// ОДНОМ и том же iframe — и это оказалось реальным багом, а не просто
// потенциальным: у упражнения "корзина" первая проверка кликает по
// "добавить" дважды, вторая проверка НИЧЕГО не сбрасывает и тоже кликает
// дважды — так как DOM/переменные скрипта общие на весь iframe, вторая
// проверка стартовала не с чистого состояния, а с уже "накрученным"
// total от первой проверки, и даже ПОСЛЕ исправления бага пользователем
// тест всё равно не проходил (поймано вручную headless-браузером перед
// поставкой, не в проде). Каждая проверка теперь получает полностью
// свежий iframe — то есть код пользователя стартует с нуля перед каждой
// проверкой, ровно как при обычной перезагрузке страницы.

export interface ProjectCheckResult {
  id: string;
  pass: boolean;
  error?: string;
}

export interface ProjectRunResult {
  ok: boolean;
  results: ProjectCheckResult[];
}

// Чистая логика подсчёта итога — без DOM, тестируется без {page} (см.
// tests/project-exercises.spec.ts). Вынесена отдельно, а не инлайн в
// runProjectExercise(), ровно по той же причине, что и isNewAccount() —
// не полагаться на ручной клик в браузере, чтобы проверить правило "все
// проверки пройдены = ok".
export function summarizeProjectResults(results: ProjectCheckResult[]): {
  ok: boolean;
  passedCount: number;
  totalCount: number;
} {
  const passedCount = results.filter((r) => r.pass).length;
  return { ok: results.length > 0 && passedCount === results.length, passedCount, totalCount: results.length };
}

const READY_MSG  = "wrench-trainer-project-ready";
const RUN_MSG    = "wrench-trainer-project-run";
const RESULT_MSG = "wrench-trainer-project-result";

// Интерпретирует ОДНУ проверку (actions + assertion) как данные —
// общий для всех упражнений, ничего не знает о конкретном сценарии.
const HARNESS_SOURCE = `
(function () {
  function byTestId(id) { return document.querySelector('[data-testid="' + id + '"]'); }

  function runAction(action) {
    var el = byTestId(action.testId);
    if (!el) throw new Error('Element with data-testid="' + action.testId + '" not found');
    if (action.type === "click") {
      el.click();
    } else if (action.type === "type") {
      el.value = action.value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  function isHidden(el) {
    var style = window.getComputedStyle(el);
    return style.display === "none" || style.visibility === "hidden" || el.hidden === true;
  }

  function runAssertion(assertion) {
    var el = byTestId(assertion.testId);
    if (!el) throw new Error('Element with data-testid="' + assertion.testId + '" not found');
    if (assertion.type === "text-equals") {
      var actual = el.textContent.trim();
      if (actual !== assertion.value) throw new Error('expected text "' + assertion.value + '", got "' + actual + '"');
    } else if (assertion.type === "text-includes") {
      var actual2 = el.textContent.trim();
      if (actual2.indexOf(assertion.value) === -1) throw new Error('expected text to include "' + assertion.value + '", got "' + actual2 + '"');
    } else if (assertion.type === "visible") {
      if (isHidden(el)) throw new Error("expected element to be visible");
    } else if (assertion.type === "hidden") {
      if (!isHidden(el)) throw new Error("expected element to be hidden");
    }
  }

  window.addEventListener("message", function (e) {
    if (!e.data || e.data.source !== "${RUN_MSG}") return;
    var check = e.data.check;
    try {
      for (var a = 0; a < check.actions.length; a++) runAction(check.actions[a]);
      runAssertion(check.assertion);
      window.parent.postMessage({ source: "${RESULT_MSG}", id: check.id, pass: true }, "*");
    } catch (err) {
      window.parent.postMessage({ source: "${RESULT_MSG}", id: check.id, pass: false, error: String((err && err.message) || err) }, "*");
    }
  });

  window.parent.postMessage({ source: "${READY_MSG}" }, "*");
})();
`;

function runSingleCheck(html: string, check: ProjectCheck, timeoutMs: number): Promise<ProjectCheckResult> {
  return new Promise((resolve) => {
    let settled = false;
    const iframe = document.createElement("iframe");
    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.style.position = "fixed";
    iframe.style.left = "-9999px";
    iframe.style.top = "-9999px";
    iframe.style.width = "1px";
    iframe.style.height = "1px";
    document.body.appendChild(iframe);

    const timer = setTimeout(
      () => finish({ id: check.id, pass: false, error: "timed out (possible infinite loop)" }),
      timeoutMs
    );

    function finish(result: ProjectCheckResult) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      iframe.remove();
      resolve(result);
    }

    function onMessage(e: MessageEvent) {
      if (e.source !== iframe.contentWindow || !e.data) return;
      if (e.data.source === READY_MSG) {
        iframe.contentWindow?.postMessage({ source: RUN_MSG, check }, "*");
      } else if (e.data.source === RESULT_MSG) {
        finish({ id: e.data.id, pass: e.data.pass, error: e.data.error });
      }
    }
    window.addEventListener("message", onMessage);

    const withHarness = `<script>${HARNESS_SOURCE}<\/script>`;
    iframe.srcdoc = html.includes("</body>")
      ? html.replace("</body>", `${withHarness}</body>`)
      : html + withHarness;
  });
}

// Проверки одного упражнения идут ПОСЛЕДОВАТЕЛЬНО (не Promise.all) — на
// 2-3 проверки это несущественная разница по времени (доли секунды
// каждая), а результаты остаются в исходном порядке checks без сортировки.
export async function runProjectExercise(html: string, checks: ProjectCheck[], timeoutMs = 4000): Promise<ProjectRunResult> {
  const results: ProjectCheckResult[] = [];
  for (const check of checks) {
    results.push(await runSingleCheck(html, check, timeoutMs));
  }
  return { ok: summarizeProjectResults(results).ok, results };
}
