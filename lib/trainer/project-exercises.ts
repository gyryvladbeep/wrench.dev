// ═══════════════════════════════════════════════════════════════
// Контент "проектных" упражнений тренажёра (roadmap item 17: помимо
// коротких JS-дрилов в lib/trainer/exercises.ts — более длинное "почини
// сломанное мини-приложение", мостик между Trainer и Playground).
//
// В отличие от TrainerExercise (пользователь пишет ОДНУ функцию, которая
// проверяется вызовом с готовыми аргументами — см. exercises.ts), здесь
// пользователь правит целый самодостаточный HTML-документ (разметка +
// стили + скрипт внутри одного <script>), а проверка — это симуляция
// пользовательских действий (клик, ввод текста) и проверка результата в
// DOM, — то есть ровно то, чем на практике занимается QA-автоматизация.
//
// Формат проверок — декларативный DSL (ProjectCheck), а не свободный JS,
// специально: так каждое упражнение можно провалидировать программно
// (см. validateProjectExercise() ниже и tests/project-exercises.spec.ts)
// — что все testId из checks реально существуют как data-testid в
// startCode, — вместо того чтобы обнаруживать опечатку в id только
// вручную кликая по упражнению в браузере. Сам интерпретатор этого DSL
// — HARNESS_SOURCE в lib/trainer/run-project-exercise.ts, он общий для
// всех упражнений и не входит в этот файл.

export type TrainerDifficulty = "easy" | "medium";

export type ProjectAction =
  | { type: "click"; testId: string }
  | { type: "type"; testId: string; value: string };

export type ProjectAssertion =
  | { type: "text-equals"; testId: string; value: string }
  | { type: "text-includes"; testId: string; value: string }
  | { type: "visible"; testId: string }
  | { type: "hidden"; testId: string };

export interface ProjectCheck {
  id: string;
  labelEn: string;
  labelRu: string;
  actions: ProjectAction[];
  assertion: ProjectAssertion;
}

export interface TrainerProjectExercise {
  id: string;
  difficulty: TrainerDifficulty;
  title: string;
  titleRu: string;
  /** Похоже на баг-репорт, а не на условие задачи — так это выглядит на реальном проекте. */
  prompt: string;
  promptRu: string;
  /** Полный самодостаточный HTML-документ со сломанной логикой. */
  startCode: string;
  checks: ProjectCheck[];
  hint?: string;
  hintRu?: string;
}

export const TRAINER_PROJECT_EXERCISES: TrainerProjectExercise[] = [
  {
    id: "project-cart-total",
    difficulty: "easy",
    title: "Bug: cart total doesn't add up",
    titleRu: "Баг: сумма корзины считается неправильно",
    prompt:
      "A QA report says: \"After adding a $49 keyboard and a $25 mouse to the cart, the total shows $049 instead of $74.\" Find the bug in the script and fix it — the checks below simulate exactly this scenario.",
    promptRu:
      "Репорт от QA: \"После добавления клавиатуры за $49 и мыши за $25 сумма показывает $049 вместо $74\". Найди баг в скрипте и почини — проверки ниже воспроизводят ровно этот сценарий.",
    startCode: `<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: system-ui, sans-serif; padding: 16px; color: #1a1a1a; }
  .item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e2e2e2; }
  button { cursor: pointer; border: 1px solid #ccc; background: #fff; border-radius: 6px; padding: 4px 10px; }
  #total { font-weight: 600; margin-top: 12px; }
</style>
</head>
<body>
  <h2>Cart</h2>
  <div class="item">
    <span>Keyboard &mdash; $49</span>
    <button data-testid="add-1" onclick="addItem(49)">Add</button>
  </div>
  <div class="item">
    <span>Mouse &mdash; $25</span>
    <button data-testid="add-2" onclick="addItem(25)">Add</button>
  </div>
  <div id="total" data-testid="total">Total: $0</div>
  <div data-testid="count">Items: 0</div>

  <script>
    let total = "0"; // <-- bug is somewhere around here
    let count = 0;

    function addItem(price) {
      total += price;
      count += 1;
      document.querySelector('[data-testid="total"]').textContent = "Total: $" + total;
      document.querySelector('[data-testid="count"]').textContent = "Items: " + count;
    }
  </script>
</body>
</html>
`,
    checks: [
      {
        id: "count-after-two-adds",
        labelEn: 'After adding both items, the count shows "Items: 2"',
        labelRu: 'После добавления обоих товаров счётчик показывает "Items: 2"',
        actions: [{ type: "click", testId: "add-1" }, { type: "click", testId: "add-2" }],
        assertion: { type: "text-equals", testId: "count", value: "Items: 2" },
      },
      {
        id: "total-after-two-adds",
        labelEn: 'After adding a $49 and a $25 item, the total shows "Total: $74"',
        labelRu: 'После добавления товаров за $49 и $25 сумма показывает "Total: $74"',
        actions: [{ type: "click", testId: "add-1" }, { type: "click", testId: "add-2" }],
        assertion: { type: "text-equals", testId: "total", value: "Total: $74" },
      },
    ],
    hint: '`total` starts out as the string "0" — adding a number to a string concatenates them instead of summing.',
    hintRu: '`total` изначально строка "0" — сложение числа со строкой склеивает их, а не суммирует.',
  },
  {
    id: "project-search-filter",
    difficulty: "medium",
    title: "Bug: search filter misses matches",
    titleRu: "Баг: поиск не находит совпадения",
    prompt:
      'A QA report says: "Typing \\"apple\\" in lowercase in the search box hides Apple from the list, even though it should stay visible." Find the bug in the filter logic and fix it.',
    promptRu:
      'Репорт от QA: "При вводе \\"apple\\" строчными буквами в поиск Apple пропадает из списка, хотя должен оставаться видимым". Найди баг в логике фильтра и почини.',
    startCode: `<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: system-ui, sans-serif; padding: 16px; color: #1a1a1a; }
  input { width: 100%; box-sizing: border-box; padding: 8px 10px; border: 1px solid #ccc; border-radius: 6px; margin-bottom: 10px; }
  ul { list-style: none; padding: 0; margin: 0; }
  li { padding: 6px 0; border-bottom: 1px solid #e2e2e2; }
</style>
</head>
<body>
  <input data-testid="search" placeholder="Search fruits...">
  <ul>
    <li data-testid="item-apple">Apple</li>
    <li data-testid="item-banana">Banana</li>
    <li data-testid="item-cherry">Cherry</li>
    <li data-testid="item-mango">Mango</li>
  </ul>

  <script>
    const input = document.querySelector('[data-testid="search"]');
    const items = Array.from(document.querySelectorAll("li"));

    input.addEventListener("input", function () {
      const query = input.value; // <-- bug is somewhere around here
      items.forEach(function (li) {
        const match = li.textContent.includes(query);
        li.style.display = match ? "" : "none";
      });
    });
  </script>
</body>
</html>
`,
    checks: [
      {
        id: "apple-visible-after-search",
        labelEn: 'Typing "apple" (lowercase) keeps "Apple" visible',
        labelRu: 'При вводе "apple" (строчными) "Apple" остаётся видимым',
        actions: [{ type: "type", testId: "search", value: "apple" }],
        assertion: { type: "visible", testId: "item-apple" },
      },
      {
        id: "banana-hidden-after-search",
        labelEn: 'Typing "apple" hides "Banana"',
        labelRu: 'При вводе "apple" "Banana" скрывается',
        actions: [{ type: "type", testId: "search", value: "apple" }],
        assertion: { type: "hidden", testId: "item-banana" },
      },
    ],
    hint: "The comparison is case-sensitive on both sides — lowercase both the query and the item text before comparing (e.g. with `.toLowerCase()`).",
    hintRu: "Сравнение чувствительно к регистру с обеих сторон — приведи и запрос, и текст пункта к нижнему регистру перед сравнением (например, через `.toLowerCase()`).",
  },
];

// Чистая функция без DOM — может выполниться и в браузере, и в
// Node/Playwright без {page} (см. tests/project-exercises.spec.ts).
// Ловит ту же категорию ошибок, что tsc ловит для словарей i18n:
// опечатку в testId, из-за которой проверка молча всегда падает/висит,
// вместо падения прямо при написании упражнения.
export function validateProjectExercise(exercise: TrainerProjectExercise): string[] {
  const problems: string[] = [];
  const testIdPattern = /data-testid="([^"]+)"/g;
  const declaredIds = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = testIdPattern.exec(exercise.startCode)) !== null) {
    declaredIds.add(match[1]);
  }

  if (exercise.checks.length === 0) {
    problems.push(`exercise "${exercise.id}" has no checks`);
  }

  for (const check of exercise.checks) {
    const referencedIds = [
      ...check.actions.map((a) => a.testId),
      check.assertion.testId,
    ];
    for (const testId of referencedIds) {
      if (!declaredIds.has(testId)) {
        problems.push(`check "${check.id}" in exercise "${exercise.id}" references testId "${testId}", which is not present as data-testid in startCode`);
      }
    }
  }

  return problems;
}
