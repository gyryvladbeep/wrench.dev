// Контент тренажёра — 12 отправных упражнений (lib/tools-registry.ts —
// такой же пример статического контента, курируемого разработчиком, а
// не пользователями: легко добавить ещё, просто дописав объект в этот
// массив, никакой миграции для этого не нужно).
//
// Формат намеренно простой и синхронный: пользователь пишет одну
// функцию с именем functionName, тренажёр вызывает её со скрытыми
// тестовыми аргументами и сравнивает результат с ожидаемым (см.
// lib/trainer/run-exercise.ts). Никакого async/таймеров внутри
// проверяемой функции — это заметно усложнило бы и раннер, и сам
// формат теста, а для отправной подборки упражнений на основы это не
// нужно.

export type TrainerCategory = "fundamentals" | "strings" | "arrays" | "qa-automation" | "project";
export type TrainerDifficulty = "easy" | "medium";

export interface TrainerTestCase {
  args: unknown[];
  expected: unknown;
}

export interface TrainerExercise {
  id: string;
  category: TrainerCategory;
  difficulty: TrainerDifficulty;
  title: string;
  titleRu: string;
  prompt: string;
  promptRu: string;
  functionName: string;
  starterCode: string;
  tests: TrainerTestCase[];
  hint?: string;
  hintRu?: string;
}

export const TRAINER_CATEGORIES: { id: TrainerCategory; label: string; labelRu: string }[] = [
  { id: "fundamentals",  label: "Fundamentals",   labelRu: "Основы" },
  { id: "strings",       label: "Strings",        labelRu: "Строки" },
  { id: "arrays",        label: "Arrays",         labelRu: "Массивы" },
  { id: "qa-automation", label: "QA Automation",  labelRu: "QA-автоматизация" },
  // roadmap item 17 — "в масштабе реального проекта": не отдельная функция,
  // а целое сломанное мини-приложение, см. lib/trainer/project-exercises.ts
  { id: "project",       label: "Real project",   labelRu: "Реальный проект" },
];

export const TRAINER_EXERCISES: TrainerExercise[] = [
  {
    id: "sum-two-numbers",
    category: "fundamentals",
    difficulty: "easy",
    title: "Sum two numbers",
    titleRu: "Сумма двух чисел",
    prompt: "Write a function `solve(a, b)` that returns the sum of `a` and `b`.",
    promptRu: "Напиши функцию `solve(a, b)`, которая возвращает сумму `a` и `b`.",
    functionName: "solve",
    starterCode: "function solve(a, b) {\n  \n}",
    tests: [
      { args: [2, 3], expected: 5 },
      { args: [-1, 1], expected: 0 },
      { args: [0, 0], expected: 0 },
      { args: [10, -25], expected: -15 },
    ],
  },
  {
    id: "fizzbuzz",
    category: "fundamentals",
    difficulty: "easy",
    title: "FizzBuzz",
    titleRu: "FizzBuzz",
    prompt: "Write `solve(n)`: return \"Fizz\" if n is divisible by 3, \"Buzz\" if divisible by 5, \"FizzBuzz\" if divisible by both, otherwise the number itself as a string.",
    promptRu: "Напиши `solve(n)`: верни \"Fizz\", если n делится на 3, \"Buzz\" — если на 5, \"FizzBuzz\" — если на оба, иначе само число строкой.",
    functionName: "solve",
    starterCode: "function solve(n) {\n  \n}",
    tests: [
      { args: [3], expected: "Fizz" },
      { args: [5], expected: "Buzz" },
      { args: [15], expected: "FizzBuzz" },
      { args: [7], expected: "7" },
    ],
  },
  {
    id: "reverse-string",
    category: "strings",
    difficulty: "easy",
    title: "Reverse a string",
    titleRu: "Разворот строки",
    prompt: "Write `solve(str)` that returns the string reversed.",
    promptRu: "Напиши `solve(str)`, которая возвращает строку задом наперёд.",
    functionName: "solve",
    starterCode: "function solve(str) {\n  \n}",
    tests: [
      { args: ["hello"], expected: "olleh" },
      { args: [""], expected: "" },
      { args: ["a"], expected: "a" },
      { args: ["QA rocks"], expected: "skcor AQ" },
    ],
  },
  {
    id: "is-palindrome",
    category: "strings",
    difficulty: "easy",
    title: "Palindrome check",
    titleRu: "Проверка на палиндром",
    prompt: "Write `solve(str)` that returns true if str reads the same forwards and backwards (case-sensitive, don't worry about spaces or punctuation), false otherwise.",
    promptRu: "Напиши `solve(str)`, которая возвращает true, если строка читается одинаково в обе стороны (с учётом регистра, пробелы и пунктуацию можно не обрабатывать), иначе false.",
    functionName: "solve",
    starterCode: "function solve(str) {\n  \n}",
    tests: [
      { args: ["level"], expected: true },
      { args: ["hello"], expected: false },
      { args: [""], expected: true },
      { args: ["a"], expected: true },
      { args: ["abba"], expected: true },
    ],
  },
  {
    id: "count-vowels",
    category: "strings",
    difficulty: "easy",
    title: "Count vowels",
    titleRu: "Подсчёт гласных",
    prompt: "Write `solve(str)` that returns the number of vowels (a, e, i, o, u — case-insensitive) in str.",
    promptRu: "Напиши `solve(str)`, которая возвращает количество гласных (a, e, i, o, u — без учёта регистра) в строке.",
    functionName: "solve",
    starterCode: "function solve(str) {\n  \n}",
    tests: [
      { args: ["hello"], expected: 2 },
      { args: ["QA"], expected: 1 },
      { args: ["xyz"], expected: 0 },
      { args: ["AEIOU"], expected: 5 },
    ],
    hint: "You can check each character against a string like \"aeiouAEIOU\" using includes().",
    hintRu: "Можно проверять каждый символ через includes() у строки \"aeiouAEIOU\".",
  },
  {
    id: "capitalize-words",
    category: "strings",
    difficulty: "easy",
    title: "Capitalize every word",
    titleRu: "Заглавные буквы у слов",
    prompt: "Write `solve(str)` that capitalizes the first letter of every word (words are separated by single spaces), e.g. \"hello world\" becomes \"Hello World\".",
    promptRu: "Напиши `solve(str)`, которая делает заглавной первую букву каждого слова (слова разделены одним пробелом), например \"hello world\" -> \"Hello World\".",
    functionName: "solve",
    starterCode: "function solve(str) {\n  \n}",
    tests: [
      { args: ["hello world"], expected: "Hello World" },
      { args: ["a"], expected: "A" },
      { args: ["qa engineer"], expected: "Qa Engineer" },
    ],
  },
  {
    id: "find-max",
    category: "arrays",
    difficulty: "easy",
    title: "Find the maximum",
    titleRu: "Найти максимум",
    prompt: "Write `solve(arr)` that returns the largest number in the array. Assume the array has at least one element.",
    promptRu: "Напиши `solve(arr)`, которая возвращает наибольшее число в массиве. Считай, что в массиве всегда есть хотя бы один элемент.",
    functionName: "solve",
    starterCode: "function solve(arr) {\n  \n}",
    tests: [
      { args: [[1, 5, 3]], expected: 5 },
      { args: [[-1, -5, -3]], expected: -1 },
      { args: [[42]], expected: 42 },
      { args: [[3, 3, 3]], expected: 3 },
    ],
  },
  {
    id: "remove-duplicates",
    category: "arrays",
    difficulty: "medium",
    title: "Remove duplicates",
    titleRu: "Удалить дубликаты",
    prompt: "Write `solve(arr)` that returns a new array with duplicate values removed, keeping the order of first occurrence.",
    promptRu: "Напиши `solve(arr)`, которая возвращает новый массив без повторяющихся значений, сохраняя порядок первого появления.",
    functionName: "solve",
    starterCode: "function solve(arr) {\n  \n}",
    tests: [
      { args: [[1, 2, 2, 3, 1]], expected: [1, 2, 3] },
      { args: [[]], expected: [] },
      { args: [["a", "a", "b"]], expected: ["a", "b"] },
    ],
    hint: "A Set remembers only unique values and preserves insertion order — [...new Set(arr)] might help.",
    hintRu: "Set хранит только уникальные значения и сохраняет порядок вставки — может пригодиться [...new Set(arr)].",
  },
  {
    id: "flatten-array",
    category: "arrays",
    difficulty: "medium",
    title: "Flatten one level",
    titleRu: "Развернуть на один уровень",
    prompt: "Write `solve(arr)` that flattens a one-level-nested array into a flat array, e.g. [1, [2, 3], [4]] becomes [1, 2, 3, 4]. Assume only one level of nesting.",
    promptRu: "Напиши `solve(arr)`, которая разворачивает массив, вложенный на один уровень, в плоский массив, например [1, [2, 3], [4]] -> [1, 2, 3, 4]. Считай, что вложенность всегда ровно одна.",
    functionName: "solve",
    starterCode: "function solve(arr) {\n  \n}",
    tests: [
      { args: [[1, [2, 3], [4]]], expected: [1, 2, 3, 4] },
      { args: [[[1], [2], [3]]], expected: [1, 2, 3] },
      { args: [[1, 2, 3]], expected: [1, 2, 3] },
    ],
  },
  {
    id: "group-by-property",
    category: "qa-automation",
    difficulty: "medium",
    title: "Group by property",
    titleRu: "Группировка по свойству",
    prompt: "Write `solve(items, key)` that groups an array of objects into a plain object keyed by each item's `item[key]` value — handy for grouping test results by status. Each group is an array of the matching items, in original order.",
    promptRu: "Напиши `solve(items, key)`, которая группирует массив объектов в обычный объект по значению `item[key]` — пригодится, например, чтобы сгруппировать результаты тестов по статусу. Каждая группа — массив подходящих элементов в исходном порядке.",
    functionName: "solve",
    starterCode: "function solve(items, key) {\n  \n}",
    tests: [
      {
        args: [[{ status: "pass" }, { status: "fail" }, { status: "pass" }], "status"],
        expected: { pass: [{ status: "pass" }, { status: "pass" }], fail: [{ status: "fail" }] },
      },
      { args: [[], "status"], expected: {} },
    ],
    hint: "Start with an empty object as the accumulator, and for each item push it into result[item[key]] (creating that array the first time you see the key).",
    hintRu: "Начни с пустого объекта-аккумулятора и для каждого элемента добавляй его в result[item[key]] (создавая массив при первой встрече ключа).",
  },
  {
    id: "parse-query-string",
    category: "qa-automation",
    difficulty: "medium",
    title: "Parse a query string",
    titleRu: "Разбор query-строки",
    prompt: "Write `solve(qs)` that parses a URL query string like \"a=1&b=2\" into a plain object like { a: \"1\", b: \"2\" }. Assume no leading \"?\" and no URL-encoded characters. An empty string should return an empty object.",
    promptRu: "Напиши `solve(qs)`, которая разбирает query-строку вида \"a=1&b=2\" в обычный объект { a: \"1\", b: \"2\" }. Считай, что ведущего \"?\" и URL-кодирования нет. Пустая строка должна вернуть пустой объект.",
    functionName: "solve",
    starterCode: "function solve(qs) {\n  \n}",
    tests: [
      { args: ["a=1&b=2"], expected: { a: "1", b: "2" } },
      { args: [""], expected: {} },
      { args: ["single=value"], expected: { single: "value" } },
    ],
  },
  {
    id: "is-valid-email",
    category: "qa-automation",
    difficulty: "medium",
    title: "Plausible email check",
    titleRu: "Похоже ли на email",
    prompt: "Write `solve(email)` that returns true if the string looks like a plausible email address (something@something.something), false otherwise. Keep it simple — catch obviously invalid strings, not every edge case of the email spec.",
    promptRu: "Напиши `solve(email)`, которая возвращает true, если строка похожа на email (что-то@что-то.что-то), иначе false. Не нужно покрывать весь спецификационный ад email-адресов — достаточно отсеять явно некорректные строки.",
    functionName: "solve",
    starterCode: "function solve(email) {\n  \n}",
    tests: [
      { args: ["test@example.com"], expected: true },
      { args: ["not-an-email"], expected: false },
      { args: ["a@b.co"], expected: true },
      { args: ["missing@domain"], expected: false },
      { args: ["@nouser.com"], expected: false },
    ],
    hint: "A regex like /^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/ covers this without going overboard.",
    hintRu: "Регулярка вроде /^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/ покрывает это, не залезая в дебри.",
  },
];
