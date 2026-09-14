import { TrainerTestCase } from "./exercises";

// ═══════════════════════════════════════════════════════
// Почему через Web Worker, а не как в Playground
// ═══════════════════════════════════════════════════════
// components/playground/PlaygroundClient.tsx исполняет код пользователя
// через new Function(code)() прямо в главном потоке — нормально для
// вольной песочницы, которую человек запускает сам и в любой момент
// может перезагрузить вкладку. Здесь код запускается автоматически при
// каждом "Run tests", и тренажёр рассчитан на новичков — а значит,
// случайный `while(true){}` не редкость, а вопрос времени. В главном
// потоке такой код вешает всю вкладку намертво и ничего, кроме
// перезагрузки страницы, уже не спасает. Воркер решает это:
// исполняется в отдельном потоке, и если он не ответил за timeoutMs —
// просто terminate() его, страница остаётся живой.
//
// Сам воркер создаётся из Blob на лету (без отдельного статического
// файла в public/) — это единственный способ дать воркеру
// самодостаточный код без сборки отдельного бандла под него.

export interface TrainerTestResult {
  pass: boolean;
  actual?: unknown;
  error?: string;
}

export interface TrainerRunResult {
  ok: boolean;
  results: TrainerTestResult[];
  buildError?: string;
  timedOut?: boolean;
}

const WORKER_SOURCE = `
function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (typeof a !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
    return true;
  }
  var aKeys = Object.keys(a), bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (var k = 0; k < aKeys.length; k++) {
    var key = aKeys[k];
    if (!Object.prototype.hasOwnProperty.call(b, key) || !deepEqual(a[key], b[key])) return false;
  }
  return true;
}

self.onmessage = function (e) {
  var code = e.data.code;
  var functionName = e.data.functionName;
  var tests = e.data.tests;
  var fn;
  try {
    fn = new Function(code + "\\nreturn typeof " + functionName + " !== 'undefined' ? " + functionName + " : undefined;")();
  } catch (err) {
    self.postMessage({ ok: false, buildError: String(err && err.message || err), results: [] });
    return;
  }
  if (typeof fn !== "function") {
    self.postMessage({ ok: false, buildError: "Function '" + functionName + "' is not defined.", results: [] });
    return;
  }
  var results = [];
  for (var t = 0; t < tests.length; t++) {
    try {
      var actual = fn.apply(null, tests[t].args);
      results.push({ pass: deepEqual(actual, tests[t].expected), actual: actual });
    } catch (err) {
      results.push({ pass: false, error: String(err && err.message || err) });
    }
  }
  var allPass = results.length > 0;
  for (var r = 0; r < results.length; r++) if (!results[r].pass) allPass = false;
  self.postMessage({ ok: allPass, results: results });
};
`;

let cachedWorkerUrl: string | null = null;
function getWorkerUrl(): string {
  if (!cachedWorkerUrl) {
    const blob = new Blob([WORKER_SOURCE], { type: "application/javascript" });
    cachedWorkerUrl = URL.createObjectURL(blob);
  }
  return cachedWorkerUrl;
}

export function runExercise(
  code: string,
  functionName: string,
  tests: TrainerTestCase[],
  timeoutMs = 2000
): Promise<TrainerRunResult> {
  return new Promise((resolve) => {
    let settled = false;
    const worker = new Worker(getWorkerUrl());

    const finish = (result: TrainerRunResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      resolve(result);
    };

    const timer = setTimeout(() => {
      finish({ ok: false, results: [], timedOut: true });
    }, timeoutMs);

    worker.onmessage = (e: MessageEvent<TrainerRunResult>) => finish(e.data);
    worker.onerror = (e: ErrorEvent) => finish({ ok: false, results: [], buildError: e.message });

    worker.postMessage({ code, functionName, tests });
  });
}
