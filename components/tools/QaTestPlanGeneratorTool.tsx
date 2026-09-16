"use client";
import { useMemo, useState } from "react";
import { CopyButton } from "@/components/CopyButton";
import { Dictionary } from "@/lib/i18n/dictionary-types";

type ProjectType = "web" | "api" | "mobile";

interface ChecklistItem {
  en: string;
  ru: string;
}

interface ChecklistCategory {
  id: string;
  label: string;
  labelRu: string;
  items: ChecklistItem[];
}

// Формулировки — не общие фразы вроде "проверить безопасность", а конкретные,
// проверяемые пункты (что именно смотреть и по какому признаку понять, что
// тест не пройден) — тот же принцип, что уже используется для faqs/howToSteps
// в реестре инструментов: полезность приходит от конкретики, а не от объёма.
const CHECKLISTS: Record<ProjectType, ChecklistCategory[]> = {
  web: [
    {
      id: "functional", label: "Functional", labelRu: "Функциональность",
      items: [
        { en: "Every primary user flow (signup, login, checkout, core action) completes successfully with valid input", ru: "Каждый основной пользовательский сценарий (регистрация, вход, оформление заказа, ключевое действие) успешно завершается с валидными данными" },
        { en: "Each flow is retested after any change to its dependencies (API, DB schema, third-party service)", ru: "Каждый сценарий перепроверяется после изменения его зависимостей (API, схема БД, сторонний сервис)" },
        { en: "Edge cases are covered: empty state, first-time user, returning user with existing data", ru: "Покрыты граничные состояния: пустое состояние, первый заход, возврат пользователя с уже существующими данными" },
        { en: "Pagination, sorting and filtering return correct, stable results across page reloads", ru: "Пагинация, сортировка и фильтрация возвращают корректные, стабильные результаты при перезагрузке страницы" },
        { en: "Data persists correctly after a page refresh and after logging out and back in", ru: "Данные корректно сохраняются после обновления страницы и после выхода и повторного входа" },
      ],
    },
    {
      id: "forms-validation", label: "Forms & validation", labelRu: "Формы и валидация",
      items: [
        { en: "Required fields block submission with a clear inline error, not just a disabled submit button", ru: "Обязательные поля блокируют отправку понятной инлайн-ошибкой, а не просто неактивной кнопкой" },
        { en: "Client-side validation matches server-side validation — nothing the client accepts gets silently rejected by the server, or vice versa", ru: "Клиентская валидация совпадает с серверной — ничего из того, что принял клиент, не отклоняется сервером молча, и наоборот" },
        { en: "Boundary values (min/max length, min/max number) are tested at the boundary, one below, and one above", ru: "Граничные значения (мин/макс длина, мин/макс число) проверены ровно на границе, на единицу ниже и на единицу выше" },
        { en: "Special characters, emoji and very long strings don't break the layout or get silently truncated", ru: "Спецсимволы, эмодзи и очень длинные строки не ломают вёрстку и не обрезаются молча" },
        { en: "Browser autofill and pasted values are handled the same as typed input", ru: "Автозаполнение браузера и вставленные значения обрабатываются так же, как введённые вручную" },
      ],
    },
    {
      id: "cross-browser-responsive", label: "Cross-browser & responsive", labelRu: "Кроссбраузерность и адаптивность",
      items: [
        { en: "Core flows verified in Chrome, Firefox, Safari, and at least one real mobile browser", ru: "Основные сценарии проверены в Chrome, Firefox, Safari и хотя бы одном реальном мобильном браузере" },
        { en: "Layout holds at common breakpoints (320px, 768px, 1024px, 1440px+) with no overlapping or clipped content", ru: "Вёрстка держится на типовых брейкпоинтах (320px, 768px, 1024px, 1440px+) без наложений и обрезанного контента" },
        { en: "Touch targets are large enough and usable on an actual mobile device, not just a resized desktop window", ru: "Тач-таргеты достаточно большие и удобные на реальном мобильном устройстве, а не только на суженном окне десктопа" },
      ],
    },
    {
      id: "accessibility", label: "Accessibility", labelRu: "Доступность",
      items: [
        { en: "Every interactive element is reachable and operable by keyboard alone (Tab, Enter, Space, Esc)", ru: "Каждый интерактивный элемент доступен и управляем только с клавиатуры (Tab, Enter, Space, Esc)" },
        { en: "Focus order is logical and the focused element is always visibly indicated", ru: "Порядок фокуса логичен, а элемент в фокусе всегда визуально выделен" },
        { en: "Images have meaningful alt text; purely decorative images have empty alt", ru: "У изображений есть осмысленный alt-текст; у чисто декоративных изображений alt пустой" },
        { en: "Text and UI control colors meet WCAG AA contrast requirements", ru: "Цвета текста и элементов интерфейса соответствуют контрасту WCAG AA" },
        { en: "Every form input has an associated label, not just placeholder text", ru: "У каждого поля формы есть связанный label, а не только placeholder" },
      ],
    },
    {
      id: "performance", label: "Performance", labelRu: "Производительность",
      items: [
        { en: "Page load and time-to-interactive are measured on a throttled connection, not just localhost", ru: "Загрузка страницы и время до интерактивности измерены на замедленном соединении, а не только на localhost" },
        { en: "No visible layout shift as images, ads or late content load in", ru: "Нет заметного сдвига вёрстки при подгрузке изображений, рекламы или отложенного контента" },
        { en: "Long lists are paginated or virtualized instead of rendering thousands of DOM nodes at once", ru: "Длинные списки пагинируются или виртуализируются вместо рендера тысяч DOM-узлов разом" },
      ],
    },
    {
      id: "security", label: "Security", labelRu: "Безопасность",
      items: [
        { en: "Auth-gated pages and API calls actually reject an unauthenticated or wrong-role request server-side, not just hide the UI", ru: "Страницы и API-вызовы за авторизацией реально отклоняют неавторизованный запрос или запрос не той роли на сервере, а не просто прячут UI" },
        { en: "User-supplied content is escaped on output — no reflected or stored XSS", ru: "Пользовательский контент экранируется при выводе — нет отражённого или хранимого XSS" },
        { en: "Tokens and passwords never appear in the URL, browser history, or client-side logs", ru: "Токены и пароли никогда не попадают в URL, историю браузера или клиентские логи" },
        { en: "Sessions actually expire and require re-authentication after logout or token expiry", ru: "Сессии реально истекают и требуют повторной авторизации после логаута или истечения токена" },
      ],
    },
    {
      id: "error-handling", label: "Error handling", labelRu: "Обработка ошибок",
      items: [
        { en: "A failed network request shows a real error state, not an infinite spinner or a blank screen", ru: "Неудачный сетевой запрос показывает реальное состояние ошибки, а не бесконечный спиннер или пустой экран" },
        { en: "404 and 500 responses are handled gracefully with a way back, not a raw stack trace", ru: "Ответы 404 и 500 обрабатываются аккуратно с путём назад, а не сырым стектрейсом" },
        { en: "Client-side errors are actually caught and logged (error boundary / monitoring), not silently swallowed", ru: "Клиентские ошибки реально перехватываются и логируются (error boundary / мониторинг), а не проглатываются молча" },
      ],
    },
  ],
  api: [
    {
      id: "functional", label: "Functional", labelRu: "Функциональность",
      items: [
        { en: "Every endpoint returns the documented status code and response shape for a valid request", ru: "Каждый эндпоинт возвращает задокументированный статус-код и форму ответа на валидный запрос" },
        { en: "What you create with POST is exactly what a subsequent GET returns", ru: "То, что создано через POST, — это ровно то, что возвращает последующий GET" },
        { en: "Idempotent methods (GET, PUT, DELETE) really are idempotent — repeating the call has no extra side effect", ru: "Идемпотентные методы (GET, PUT, DELETE) действительно идемпотентны — повтор вызова не даёт лишнего побочного эффекта" },
      ],
    },
    {
      id: "validation", label: "Validation & error handling", labelRu: "Валидация и обработка ошибок",
      items: [
        { en: "Missing required fields return a clear 4xx with a field-level error, not a generic 500", ru: "Отсутствие обязательных полей возвращает понятный 4xx с ошибкой по конкретному полю, а не общий 500" },
        { en: "Wrong data types (a string where a number is expected) are rejected, not silently coerced", ru: "Неверные типы данных (строка вместо числа) отклоняются, а не молча приводятся к нужному типу" },
        { en: "Boundary and edge values — 0, negative numbers, empty arrays, empty strings — are tested explicitly", ru: "Граничные и краевые значения — 0, отрицательные числа, пустые массивы, пустые строки — проверены явно" },
        { en: "A malformed JSON body returns 400, not a crash or a hung request", ru: "Некорректный JSON в теле запроса возвращает 400, а не падение или зависший запрос" },
      ],
    },
    {
      id: "auth", label: "Auth & authorization", labelRu: "Авторизация и аутентификация",
      items: [
        { en: "Every protected endpoint rejects a missing or invalid token with 401", ru: "Каждый защищённый эндпоинт отклоняет отсутствующий или невалидный токен с 401" },
        { en: "A valid token for the wrong role or user is rejected with 403, not silently scoped down", ru: "Валидный токен не той роли или не того пользователя отклоняется с 403, а не молча урезается по правам" },
        { en: "Token expiry and refresh actually work end-to-end, not just on paper", ru: "Истечение и обновление токена реально работают end-to-end, а не только на бумаге" },
      ],
    },
    {
      id: "performance-reliability", label: "Performance & reliability", labelRu: "Производительность и надёжность",
      items: [
        { en: "Response time is measured under a realistic payload size and concurrency, not a single empty request", ru: "Время ответа измерено при реалистичном размере payload и параллельной нагрузке, а не на одном пустом запросе" },
        { en: "Any endpoint that can return unbounded results enforces pagination with a maximum page size", ru: "На любом эндпоинте с потенциально неограниченным результатом принудительна пагинация с максимальным размером страницы" },
        { en: "Retried requests after a timeout or network blip don't create duplicate resources", ru: "Повторные запросы после таймаута или сетевого сбоя не создают дублирующиеся ресурсы" },
      ],
    },
    {
      id: "security", label: "Security", labelRu: "Безопасность",
      items: [
        { en: "Rate limiting actually returns 429 under load, not just documented in the README", ru: "Rate limiting реально возвращает 429 под нагрузкой, а не просто задокументирован в README" },
        { en: "Injection attempts (SQL, NoSQL, command) in every input field are rejected, not just the obvious ones", ru: "Попытки инъекций (SQL, NoSQL, command) в каждом поле ввода отклоняются, а не только в очевидных" },
        { en: "CORS headers only allow the origins that should be allowed — verified with a real cross-origin request, not assumed", ru: "CORS-заголовки разрешают только нужные origin — проверено реальным кросс-доменным запросом, а не предположением" },
      ],
    },
    {
      id: "versioning", label: "Versioning", labelRu: "Версионирование",
      items: [
        { en: "A breaking change ships as a new API version; clients on the previous version keep working unchanged", ru: "Breaking change выходит как новая версия API; клиенты на предыдущей версии продолжают работать без изменений" },
        { en: "Deprecated fields still appear in the response until the announced deprecation window actually ends", ru: "Устаревшие поля всё ещё возвращаются в ответе до фактического окончания заявленного периода депрекации" },
      ],
    },
    {
      id: "documentation", label: "Documentation", labelRu: "Документация",
      items: [
        { en: "Every documented example request and response actually works against the live API, not a stale draft", ru: "Каждый задокументированный пример запроса и ответа реально работает на живом API, а не является устаревшим черновиком" },
        { en: "Error response shapes are documented, not just the happy path", ru: "Формы ответов с ошибками задокументированы, а не только happy path" },
      ],
    },
  ],
  mobile: [
    {
      id: "functional", label: "Functional", labelRu: "Функциональность",
      items: [
        { en: "Core flows complete successfully on both a fresh install and an upgrade from the previous version", ru: "Основные сценарии успешно проходят и на чистой установке, и на обновлении с предыдущей версии" },
        { en: "In-progress app state (cart, draft, form) survives being backgrounded and returned to", ru: "Незавершённое состояние приложения (корзина, черновик, форма) сохраняется при сворачивании и возврате" },
        { en: "Deep links and push notification taps open the correct in-app screen with the right data", ru: "Диплинки и тапы по пуш-уведомлениям открывают нужный экран внутри приложения с правильными данными" },
      ],
    },
    {
      id: "device-os", label: "Device & OS coverage", labelRu: "Устройства и ОС",
      items: [
        { en: "Verified on both a low-end and a recent device, not only the simulator/emulator", ru: "Проверено и на слабом, и на современном устройстве, а не только в симуляторе/эмуляторе" },
        { en: "Verified on both the oldest officially supported OS version and the latest", ru: "Проверено и на самой старой официально поддерживаемой версии ОС, и на самой новой" },
        { en: "Different screen sizes, notches and safe areas don't clip content or controls", ru: "Разные размеры экранов, вырезы и safe area не обрезают контент и элементы управления" },
      ],
    },
    {
      id: "network-offline", label: "Network & offline", labelRu: "Сеть и офлайн",
      items: [
        { en: "The app behaves sensibly with no connection at all — a clear offline state, not an endless spinner", ru: "Приложение адекватно ведёт себя при полном отсутствии связи — понятное офлайн-состояние, а не бесконечный спиннер" },
        { en: "Recovers gracefully when the connection returns, with auto-retry or a clear manual retry", ru: "Корректно восстанавливается при возврате связи — автоповтор или явная кнопка повтора" },
        { en: "Core flows are also checked on a slow, high-latency connection, not just office Wi-Fi", ru: "Основные сценарии дополнительно проверены на медленном соединении с высокой задержкой, а не только на офисном Wi-Fi" },
      ],
    },
    {
      id: "permissions", label: "Permissions", labelRu: "Разрешения",
      items: [
        { en: "Every permission request (camera, location, notifications) has a working denied path, not just a granted one", ru: "У каждого запроса разрешения (камера, геолокация, уведомления) есть рабочий сценарий отказа, а не только выдачи" },
        { en: "Re-requesting a previously denied permission behaves the way the OS expects, with no repeated silent failure", ru: "Повторный запрос ранее отклонённого разрешения ведёт себя так, как ожидает ОС, без повторяющегося тихого отказа" },
      ],
    },
    {
      id: "performance-battery", label: "Performance & battery", labelRu: "Производительность и батарея",
      items: [
        { en: "App launch time and screen-transition times are measured on a real device", ru: "Время запуска приложения и переходов между экранами измерено на реальном устройстве" },
        { en: "No excessive battery drain from background location, polling, or wake locks", ru: "Нет чрезмерного расхода батареи из-за фоновой геолокации, поллинга или wake lock" },
        { en: "Memory usage stays stable over an extended session — no leak that eventually forces a crash", ru: "Потребление памяти стабильно на протяжении долгой сессии — нет утечки, приводящей к падению" },
      ],
    },
    {
      id: "push-notifications", label: "Push notifications", labelRu: "Пуш-уведомления",
      items: [
        { en: "Notifications are received and handled correctly with the app in foreground, background, and fully killed", ru: "Уведомления корректно приходят и обрабатываются и при активном приложении, и в фоне, и при полностью закрытом" },
        { en: "Opting out actually stops notifications, and opting back in resumes them", ru: "Отписка реально останавливает уведомления, а повторная подписка их возобновляет" },
      ],
    },
    {
      id: "store-compliance", label: "Store compliance & release", labelRu: "Соответствие требованиям сторов",
      items: [
        { en: "Store metadata, screenshots and privacy labels match the app's actual current behavior", ru: "Метаданные в сторе, скриншоты и privacy-лейблы соответствуют реальному текущему поведению приложения" },
        { en: "Crash-free rate and category-relevant store review guidelines are checked before submission", ru: "Crash-free rate и актуальные для категории приложения гайдлайны сторов проверены перед отправкой на ревью" },
      ],
    },
  ],
};

const PROJECT_TYPES: { key: ProjectType; en: string; ru: string }[] = [
  { key: "web", en: "Web app", ru: "Веб-приложение" },
  { key: "api", en: "REST API", ru: "REST API" },
  { key: "mobile", en: "Mobile app", ru: "Мобильное приложение" },
];

export function QaTestPlanGeneratorTool({ dict }: { dict: Dictionary }) {
  const isRu = dict.isRu;
  const [projectType, setProjectType] = useState<ProjectType>("web");
  const [enabledCategories, setEnabledCategories] = useState<Set<string>>(
    () => new Set(CHECKLISTS.web.map((c) => c.id))
  );
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const categories = CHECKLISTS[projectType];

  function selectProjectType(type: ProjectType) {
    setProjectType(type);
    setEnabledCategories(new Set(CHECKLISTS[type].map((c) => c.id)));
  }

  function toggleCategory(id: string) {
    setEnabledCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleItem(itemId: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId); else next.add(itemId);
      return next;
    });
  }

  function resetChecked() {
    setChecked(new Set());
  }

  const visibleCategories = categories.filter((c) => enabledCategories.has(c.id));
  const totalItems = visibleCategories.reduce((sum, c) => sum + c.items.length, 0);
  const checkedCount = visibleCategories.reduce(
    (sum, c) => sum + c.items.filter((_, i) => checked.has(`${projectType}::${c.id}::${i}`)).length,
    0
  );
  const progressPct = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  const markdown = useMemo(() => {
    const typeLabel = PROJECT_TYPES.find((t) => t.key === projectType);
    const title = isRu ? `Тест-план — ${typeLabel?.ru}` : `Test plan — ${typeLabel?.en}`;
    const lines = [`# ${title}`, ""];
    for (const cat of visibleCategories) {
      lines.push(`## ${isRu ? cat.labelRu : cat.label}`, "");
      cat.items.forEach((item, i) => {
        const itemId = `${projectType}::${cat.id}::${i}`;
        const box = checked.has(itemId) ? "[x]" : "[ ]";
        lines.push(`- ${box} ${isRu ? item.ru : item.en}`);
      });
      lines.push("");
    }
    return lines.join("\n").trim();
  }, [visibleCategories, checked, projectType, isRu]);

  return (
    <div className="space-y-5">
      <div>
        <label className="input-label">{isRu ? "Тип проекта" : "Project type"}</label>
        <div className="flex flex-wrap gap-2">
          {PROJECT_TYPES.map((t) => (
            <button key={t.key} onClick={() => selectProjectType(t.key)}
              className={`rounded border px-3 py-1.5 text-xs transition-colors ${projectType === t.key ? "border-accent/40 bg-accent/10 text-accent" : "border-border bg-surface text-text-muted hover:bg-surface-hover"}`}>
              {isRu ? t.ru : t.en}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="input-label">{isRu ? "Разделы" : "Categories"}</label>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const on = enabledCategories.has(c.id);
            return (
              <button key={c.id} onClick={() => toggleCategory(c.id)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${on ? "border-accent/40 bg-accent/10 text-accent" : "border-border bg-canvas text-text-disabled hover:bg-surface-hover"}`}>
                {isRu ? c.labelRu : c.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="h-2 min-w-[160px] flex-1 overflow-hidden rounded-full bg-canvas">
          <div className="h-full rounded-full bg-accent transition-all duration-300" style={{ width: `${progressPct}%` }} />
        </div>
        <span className="shrink-0 font-mono text-xs text-text-muted">{checkedCount}/{totalItems}</span>
        <button onClick={resetChecked} className="shrink-0 text-xs text-text-muted transition-colors hover:text-text-primary">
          {isRu ? "Сбросить отметки" : "Reset checkmarks"}
        </button>
        <CopyButton value={markdown} label={isRu ? "Копировать как Markdown" : "Copy as Markdown"} />
      </div>

      <div className="space-y-5">
        {visibleCategories.length === 0 && (
          <p className="text-sm text-text-muted">{isRu ? "Выбери хотя бы один раздел." : "Pick at least one category."}</p>
        )}
        {visibleCategories.map((cat) => (
          <div key={cat.id}>
            <h3 className="mb-2 text-sm font-semibold text-text-primary">{isRu ? cat.labelRu : cat.label}</h3>
            <div className="space-y-1.5">
              {cat.items.map((item, i) => {
                const itemId = `${projectType}::${cat.id}::${i}`;
                const isChecked = checked.has(itemId);
                return (
                  <label key={itemId}
                    className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border bg-surface px-3 py-2 transition-colors hover:bg-surface-hover">
                    <input type="checkbox" checked={isChecked} onChange={() => toggleItem(itemId)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-accent" />
                    <span className={`text-sm leading-relaxed ${isChecked ? "text-text-disabled line-through" : "text-text-secondary"}`}>
                      {isRu ? item.ru : item.en}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
