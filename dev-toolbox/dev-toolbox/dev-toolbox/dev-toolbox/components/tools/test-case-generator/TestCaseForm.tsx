"use client";

import { Button } from "@/components/ui/button";

export type TestType = "Functional"|"Regression"|"Smoke"|"Negative"|"Boundary Value"|"API"|"E2E / UI"|"Security"|"Accessibility";
export type OutputFormat = "Markdown"|"Gherkin"|"JSON"|"Table";

export interface FormValues {
  description:        string;
  testType:           TestType;
  outputFormat:       OutputFormat;
  count:              number;
  includeEdgeCases:   boolean;
  includePriority:    boolean;
  includePreconditions: boolean;
}

const TEST_TYPES: TestType[] = ["Functional","Regression","Smoke","Negative","Boundary Value","API","E2E / UI","Security","Accessibility"];
const OUTPUT_FORMATS: OutputFormat[] = ["Markdown","Gherkin","JSON","Table"];

const EXAMPLES = [
  {
    label: "Login form (EN)",
    value: `User Story: As a registered user, I want to log in with email and password so that I can access my account.

Acceptance Criteria:
- Login form has email and password fields
- Email must be valid format
- Password minimum 8 characters
- After 5 failed attempts, account is locked for 15 minutes
- Successful login redirects to dashboard
- "Remember me" checkbox keeps session for 30 days`,
  },
  {
    label: "Форма авторизации (RU)",
    value: `User Story: Как зарегистрированный пользователь, я хочу войти по email и паролю, чтобы получить доступ к аккаунту.

Критерии приёмки:
- Форма содержит поля email и пароль
- Email должен быть в корректном формате
- Пароль — минимум 8 символов
- После 5 неудачных попыток аккаунт блокируется на 15 минут
- Успешный вход перенаправляет на дашборд
- Чекбокс "Запомнить меня" сохраняет сессию на 30 дней`,
  },
  {
    label: "REST API (EN)",
    value: `API Endpoint: POST /api/v1/users
Description: Create a new user account.

Request body: { "email": string, "password": string, "name": string, "role": "admin"|"user" }

Business rules:
- Email must be unique in the system
- Password: min 8 chars, at least 1 uppercase, 1 digit, 1 special char
- Name: 2-50 characters
- Role defaults to "user" if not provided
- Returns 201 with user object on success
- Admin role requires additional authorization header X-Admin-Key`,
  },
];

interface Props {
  values: FormValues;
  onChange: (v: Partial<FormValues>) => void;
  onSubmit: () => void;
  onClear:  () => void;
  loading:  boolean;
  isRu:     boolean;
}

export function TestCaseForm({ values, onChange, onSubmit, onClear, loading, isRu }: Props) {
  return (
    <div className="space-y-5">
      {/* Description */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="tc-desc" className="input-label">
            {isRu ? "Описание фичи / User Story / Acceptance Criteria" : "Feature description / User Story / Acceptance Criteria"}
          </label>
          <div className="flex gap-1.5">
            {EXAMPLES.map((ex) => (
              <button key={ex.label} type="button" onClick={() => onChange({ description: ex.value })}
                className="rounded border border-border bg-surface px-2 py-0.5 text-[10px] text-text-muted hover:border-accent/30 hover:text-text-primary transition-colors">
                {ex.label}
              </button>
            ))}
          </div>
        </div>
        <textarea id="tc-desc" value={values.description} onChange={(e) => onChange({ description: e.target.value })}
          rows={8} spellCheck={false} disabled={loading}
          placeholder={isRu
            ? "Опишите функциональность, требования или user story…\n\nЧем подробнее — тем точнее тест-кейсы."
            : "Describe the feature, requirements or user story…\n\nThe more detail you provide, the better the test cases."}
          className="code-surface w-full rounded-[10px] p-3 text-sm text-text-primary outline-none disabled:opacity-60 resize-y min-h-[12rem]" />
      </div>

      {/* Options row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="tc-type" className="input-label">{isRu ? "Тип тестирования" : "Test type"}</label>
          <select id="tc-type" value={values.testType} onChange={(e) => onChange({ testType: e.target.value as TestType })}
            disabled={loading}
            className="code-surface w-full rounded-[10px] px-3 py-2 text-sm text-text-primary outline-none disabled:opacity-60">
            {TEST_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="tc-format" className="input-label">{isRu ? "Формат вывода" : "Output format"}</label>
          <select id="tc-format" value={values.outputFormat} onChange={(e) => onChange({ outputFormat: e.target.value as OutputFormat })}
            disabled={loading}
            className="code-surface w-full rounded-[10px] px-3 py-2 text-sm text-text-primary outline-none disabled:opacity-60">
            {OUTPUT_FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="tc-count" className="input-label">{isRu ? "Количество тест-кейсов" : "Number of test cases"}</label>
          <input id="tc-count" type="number" min={5} max={40} value={values.count}
            onChange={(e) => onChange({ count: Math.min(40, Math.max(5, Number(e.target.value))) })}
            disabled={loading}
            className="code-surface w-full rounded-[10px] px-3 py-2 text-sm text-text-primary outline-none disabled:opacity-60" />
        </div>
      </div>

      {/* Checkboxes */}
      <div className="flex flex-wrap gap-5">
        {[
          { key: "includeEdgeCases",    label: isRu ? "Включить негативные и edge-case сценарии" : "Include negative & edge cases" },
          { key: "includePriority",     label: isRu ? "Добавить Priority и Severity" : "Add Priority & Severity" },
          { key: "includePreconditions",label: isRu ? "Добавить Preconditions и Test Data" : "Add Preconditions & Test Data" },
        ].map(({ key, label }) => (
          <label key={key} className="flex cursor-pointer items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors">
            <input type="checkbox" checked={values[key as keyof FormValues] as boolean}
              onChange={(e) => onChange({ [key]: e.target.checked })}
              disabled={loading} className="accent-accent h-3.5 w-3.5" />
            {label}
          </label>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button onClick={onSubmit} disabled={loading || !values.description.trim()} size="md">
          {loading
            ? (isRu ? "Генерирую…" : "Generating…")
            : (isRu ? "Сгенерировать тест-кейсы" : "Generate Test Cases")}
        </Button>
        <Button variant="ghost" size="md" onClick={onClear} disabled={loading}>
          {isRu ? "Очистить" : "Clear"}
        </Button>
        {loading && (
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span className="h-3 w-3 rounded-full border-2 border-accent border-t-transparent animate-spin inline-block" />
            {isRu ? "AI генерирует тест-кейсы…" : "AI is generating test cases…"}
          </div>
        )}
      </div>
    </div>
  );
}
