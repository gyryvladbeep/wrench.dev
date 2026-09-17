// Технологический стек профиля — в отличие от role_tag (ровно одна роль
// на профиль, см. lib/profile-roles.ts), это МНОЖЕСТВЕННЫЙ выбор из
// готовых тегов: живой профиль почти всегда называет несколько
// технологий сразу ("React + TypeScript + Playwright"), а не одну.
// Фиксированный список id, а не свободный текст — тот же выбор, что уже
// сделан для role_tag: конечный справочник проще отрисовать чипами в
// Settings (app/[locale]/profile/page.tsx) и проще фильтровать в
// директории специалистов (lib/profile-directory.ts, /people), чем
// разбирать произвольные строки, которые каждый напишет по-своему
// ("JS" / "Javascript" / "js" — три профиля, три разных значения).
export interface StackTag {
  id: string;
  label: string;
  labelRu: string;
}

export const STACK_TAGS: StackTag[] = [
  { id: "javascript",  label: "JavaScript",  labelRu: "JavaScript" },
  { id: "typescript",  label: "TypeScript",  labelRu: "TypeScript" },
  { id: "react",       label: "React",       labelRu: "React" },
  { id: "nextjs",      label: "Next.js",     labelRu: "Next.js" },
  { id: "vue",         label: "Vue",         labelRu: "Vue" },
  { id: "angular",     label: "Angular",     labelRu: "Angular" },
  { id: "node",        label: "Node.js",     labelRu: "Node.js" },
  { id: "python",      label: "Python",      labelRu: "Python" },
  { id: "java",        label: "Java",        labelRu: "Java" },
  { id: "go",          label: "Go",          labelRu: "Go" },
  { id: "csharp",      label: "C#",          labelRu: "C#" },
  { id: "php",         label: "PHP",         labelRu: "PHP" },
  { id: "ruby",        label: "Ruby",        labelRu: "Ruby" },
  { id: "rust",        label: "Rust",        labelRu: "Rust" },
  { id: "sql",         label: "SQL",         labelRu: "SQL" },
  { id: "docker",      label: "Docker",      labelRu: "Docker" },
  { id: "kubernetes",  label: "Kubernetes",  labelRu: "Kubernetes" },
  { id: "aws",         label: "AWS",         labelRu: "AWS" },
  { id: "graphql",     label: "GraphQL",     labelRu: "GraphQL" },
  { id: "playwright",  label: "Playwright",  labelRu: "Playwright" },
  { id: "selenium",    label: "Selenium",    labelRu: "Selenium" },
  { id: "cypress",     label: "Cypress",     labelRu: "Cypress" },
  { id: "postman",     label: "Postman",     labelRu: "Postman" },
];

// Столько тегов стека можно выбрать на одном профиле — тот же принцип
// "конечная витрина, не резиновый список", что уже применён к
// MAX_PINNED (pinned_challenge_ids) в app/[locale]/profile/page.tsx:
// карточка в директории (components/PeopleDirectory.tsx) показывает
// стек одной строкой чипов, и ей нужен предсказуемый потолок, а не
// потенциально весь STACK_TAGS сразу.
export const MAX_STACK_TAGS = 8;

export function getStackTag(id: string): StackTag | undefined {
  return STACK_TAGS.find((t) => t.id === id);
}
