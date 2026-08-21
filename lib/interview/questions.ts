export type InterviewRole = "qa" | "frontend" | "backend";
export type InterviewDifficulty = "junior" | "middle" | "senior";

export interface InterviewQuestion {
  id:          string;
  role:        InterviewRole;
  difficulty:  InterviewDifficulty;
  category:    string;
  question:    string;
  questionRu?: string;
  answer:      string;
  answerRu?:   string;
  tags:        string[];
}

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  { id:"qa-j-001", role:"qa", difficulty:"junior", category:"Basics",
    question:"What is the difference between verification and validation?",
    questionRu:"В чём разница между верификацией и валидацией?",
    answer:"Verification checks if we are building the product RIGHT (reviewing specs, code review). Validation checks if we are building the RIGHT product (testing against user needs). Verification is static, validation is dynamic.",
    answerRu:"Верификация проверяет строим ли мы продукт ПРАВИЛЬНО (ревью требований, код-ревью). Валидация проверяет строим ли мы ПРАВИЛЬНЫЙ продукт (тестирование соответствия нуждам пользователей).",
    tags:["fundamentals","sdlc"] },

  { id:"qa-j-002", role:"qa", difficulty:"junior", category:"Basics",
    question:"What is the difference between severity and priority?",
    questionRu:"В чём разница между severity и priority?",
    answer:"Severity: technical impact of the bug (Critical/Major/Minor/Trivial). Priority: business urgency to fix it. A cosmetic bug on the homepage might be low severity but high priority. A crash in a rarely-used feature could be high severity but low priority.",
    answerRu:"Severity: технический impact бага (Critical/Major/Minor/Trivial). Priority: бизнес-срочность исправления. Косметический баг на главной — низкий severity, высокий priority. Крэш в редко используемой фиче — высокий severity, низкий priority.",
    tags:["bug-reports","fundamentals"] },

  { id:"qa-j-003", role:"qa", difficulty:"junior", category:"Test Design",
    question:"What is boundary value analysis? Give an example.",
    questionRu:"Что такое анализ граничных значений? Приведи пример.",
    answer:"BVA tests values at the edges of input ranges. For a field accepting 1-100: test 0, 1, 2 (around min) and 99, 100, 101 (around max). Defects cluster at boundaries.",
    answerRu:"BVA тестирует значения на краях допустимых диапазонов. Для поля 1-100: тестируем 0, 1, 2 (вокруг минимума) и 99, 100, 101 (вокруг максимума). Дефекты чаще встречаются на границах.",
    tags:["test-design","bva"] },

  { id:"qa-j-004", role:"qa", difficulty:"junior", category:"Test Design",
    question:"What is equivalence partitioning?",
    questionRu:"Что такое разбиение на классы эквивалентности?",
    answer:"Dividing input data into groups where all values should behave the same way. Test one value from each partition. For age 18-65: valid (18-65), invalid low (<18), invalid high (>65).",
    answerRu:"Разделение входных данных на группы, где все значения ведут себя одинаково. Тестируем одно значение из каждой группы. Для возраста 18-65: валидный (18-65), невалидный низкий (<18), невалидный высокий (>65).",
    tags:["test-design","ep"] },

  { id:"qa-j-005", role:"qa", difficulty:"junior", category:"Basics",
    question:"What is the difference between black-box, white-box, and grey-box testing?",
    questionRu:"В чём разница между black-box, white-box и grey-box тестированием?",
    answer:"Black-box: no knowledge of internal code, tests based on requirements. White-box: knows the code, tests internal logic. Grey-box: partial knowledge — knows some internals (DB schema, APIs) but not full source code.",
    answerRu:"Black-box: нет знания кода, тестирует по требованиям. White-box: знает код, тестирует внутреннюю логику. Grey-box: частичное знание — знает схему БД, API, но не полный исходный код.",
    tags:["fundamentals","test-types"] },

  { id:"qa-j-006", role:"qa", difficulty:"junior", category:"Bug Reports",
    question:"What should a good bug report contain?",
    questionRu:"Что должен содержать хороший баг-репорт?",
    answer:"Title (clear and specific), Steps to reproduce (numbered), Expected result, Actual result, Environment (OS, browser, version), Severity/Priority, Attachments (screenshots, logs). Good bug reports are reproducible and unambiguous.",
    answerRu:"Заголовок, Шаги воспроизведения (нумерованные), Ожидаемый результат, Фактический результат, Окружение, Severity/Priority, Вложения. Хорошие баг-репорты воспроизводимы и однозначны.",
    tags:["bug-reports","documentation"] },

  { id:"qa-j-007", role:"qa", difficulty:"junior", category:"Basics",
    question:"What is regression testing and why is it important?",
    questionRu:"Что такое регрессионное тестирование и почему оно важно?",
    answer:"Testing that previously working functionality still works after code changes. New features or bug fixes can accidentally break existing functionality. Typically automated to run on every deployment.",
    answerRu:"Тестирование что ранее работавшая функциональность работает после изменений. Новые фичи или исправления могут сломать существующую функциональность. Обычно автоматизируется.",
    tags:["test-types","regression"] },

  { id:"qa-j-008", role:"qa", difficulty:"junior", category:"Basics",
    question:"What is the difference between a bug, defect, error, and failure?",
    questionRu:"В чём разница между bug, defect, error и failure?",
    answer:"Error: human mistake in code. Defect/Bug: flaw in software from an error (found before release). Failure: visible incorrect behavior when defect is executed by end user (found in production).",
    answerRu:"Error: ошибка человека. Defect/Bug: дефект в ПО (найден до релиза). Failure: видимое некорректное поведение у пользователя (продакшн).",
    tags:["fundamentals","bugs"] },

  { id:"qa-m-001", role:"qa", difficulty:"middle", category:"API Testing",
    question:"How do you approach API testing? What do you check?",
    questionRu:"Как подходишь к тестированию API? Что проверяешь?",
    answer:"Check: HTTP status codes, response body schema and types, required fields, error messages for invalid inputs, authentication, response time, rate limiting, pagination, idempotency of PUT/DELETE. Tools: Postman, REST Assured, k6.",
    answerRu:"Проверяю: HTTP статус-коды, схему ответа, обязательные поля, сообщения об ошибках, аутентификацию, время ответа, rate limiting, пагинацию, идемпотентность PUT/DELETE. Инструменты: Postman, REST Assured.",
    tags:["api","testing"] },

  { id:"qa-m-002", role:"qa", difficulty:"middle", category:"Automation",
    question:"What is the Page Object Model pattern and why use it?",
    questionRu:"Что такое паттерн Page Object Model и зачем его использовать?",
    answer:"POM separates page structure (locators) from test logic. Each page has a class with elements and methods. Benefits: maintainability (change locator in one place), readability, reusability.",
    answerRu:"POM отделяет структуру страницы от тестовой логики. Каждая страница — класс с элементами и методами. Преимущества: обслуживаемость, читаемость, переиспользование.",
    tags:["automation","patterns"] },

  { id:"qa-m-003", role:"qa", difficulty:"middle", category:"Test Strategy",
    question:"What is the test pyramid and how does it influence your strategy?",
    questionRu:"Что такое пирамида тестирования и как она влияет на стратегию?",
    answer:"Bottom (many): Unit tests — fast, cheap. Middle: Integration tests. Top (few): E2E/UI tests — slow, brittle. More unit tests = fast feedback. Fewer E2E = less maintenance cost. Inverted pyramid is an anti-pattern.",
    answerRu:"Основание (много): Unit тесты — быстрые. Середина: Integration. Вершина (мало): E2E/UI — медленные, хрупкие. Больше unit = быстрая обратная связь. Меньше E2E = меньше затрат на поддержку.",
    tags:["strategy","pyramid"] },

  { id:"qa-m-004", role:"qa", difficulty:"middle", category:"Automation",
    question:"How do you handle flaky tests?",
    questionRu:"Как работать с нестабильными (flaky) тестами?",
    answer:"1. Identify and track separately. 2. Quarantine from main CI. 3. Diagnose: timing issues, shared state, external dependencies. 4. Fix: explicit waits, isolate state, mock externals. 5. Monitor after fix.",
    answerRu:"1. Идентифицировать и отслеживать отдельно. 2. Изолировать от основного CI. 3. Диагностировать: тайминг, общее состояние, внешние зависимости. 4. Исправить. 5. Мониторинг.",
    tags:["automation","flaky-tests"] },

  { id:"qa-s-001", role:"qa", difficulty:"senior", category:"Strategy",
    question:"How would you build a QA process from scratch for a startup?",
    questionRu:"Как выстроить QA-процесс с нуля в стартапе?",
    answer:"Phase 1: Manual smoke testing, bug tracker, basic test cases. Phase 2: Regression suite for critical paths, CI integration. Phase 3: Automated regression, API tests, performance baseline. Phase 4: Metrics, shift-left testing. Start with highest ROI activities.",
    answerRu:"Фаза 1: Мануальное smoke тестирование, трекер багов. Фаза 2: Регрессия, CI. Фаза 3: Автоматизация, API тесты, перфоманс. Фаза 4: Метрики, shift-left. Начинать с наибольшего ROI.",
    tags:["strategy","leadership"] },

  { id:"qa-s-002", role:"qa", difficulty:"senior", category:"Metrics",
    question:"What QA metrics do you track and why?",
    questionRu:"Какие QA-метрики отслеживаешь и почему?",
    answer:"Defect density, Defect escape rate (bugs in prod vs total), Test coverage, Automation rate, MTTD, MTTR. Avoid vanity metrics like 'tests passed %'. Focus on metrics that drive decisions.",
    answerRu:"Плотность дефектов, Escape rate (баги в проде), Покрытие тестами, Процент автоматизации, MTTD, MTTR. Избегать метрик тщеславия. Фокус на метриках влияющих на решения.",
    tags:["metrics","leadership"] },

  { id:"fe-j-001", role:"frontend", difficulty:"junior", category:"JavaScript",
    question:"What is the difference between == and === in JavaScript?",
    questionRu:"В чём разница между == и === в JavaScript?",
    answer:"=== (strict equality) compares value AND type — no coercion. '5' === 5 is false. == does type coercion: '5' == 5 is true. Always prefer === to avoid unexpected bugs.",
    answerRu:"=== сравнивает значение И тип — без приведения. '5' === 5 это false. == делает приведение типов: '5' == 5 это true. Всегда предпочитай ===.",
    tags:["javascript","fundamentals"] },

  { id:"fe-j-002", role:"frontend", difficulty:"junior", category:"React",
    question:"What is the difference between state and props in React?",
    questionRu:"В чём разница между state и props в React?",
    answer:"Props: data passed from parent to child, read-only. State: internal component data that can change, managed by the component. Both trigger re-renders when they change.",
    answerRu:"Props: данные от родителя, только для чтения. State: внутренние данные компонента, могут изменяться. Оба вызывают ре-рендер при изменении.",
    tags:["react","fundamentals"] },

  { id:"fe-j-003", role:"frontend", difficulty:"junior", category:"JavaScript",
    question:"What are promises and how does async/await relate to them?",
    questionRu:"Что такое промисы и как async/await связан с ними?",
    answer:"Promise represents a future value — pending, fulfilled, or rejected. async/await is syntactic sugar over promises: async function returns a promise, await pauses until it resolves. Error handling: try/catch.",
    answerRu:"Promise — будущее значение (pending, fulfilled, rejected). async/await — синтаксический сахар: async возвращает промис, await ожидает выполнения. Обработка ошибок: try/catch.",
    tags:["javascript","async"] },

  { id:"fe-j-004", role:"frontend", difficulty:"junior", category:"CSS",
    question:"What is the CSS box model?",
    questionRu:"Что такое блочная модель CSS?",
    answer:"Every element is a box: Content, Padding (space inside border), Border, Margin (space outside). box-sizing: border-box includes padding and border in total width/height — usually preferred.",
    answerRu:"Каждый элемент — блок: Content, Padding (внутри границы), Border, Margin (снаружи). box-sizing: border-box включает padding и border в общую ширину — предпочтительнее.",
    tags:["css","fundamentals"] },

  { id:"fe-j-005", role:"frontend", difficulty:"junior", category:"HTML",
    question:"What is semantic HTML and why does it matter?",
    questionRu:"Что такое семантический HTML и почему он важен?",
    answer:"Using elements by their meaning: header, nav, main, article, footer instead of divs. Benefits: accessibility (screen readers), SEO (search engines understand structure), maintainability.",
    answerRu:"Использование элементов по смыслу: header, nav, main, article вместо div. Преимущества: доступность (скринридеры), SEO, читаемость кода.",
    tags:["html","accessibility","seo"] },

  { id:"fe-m-001", role:"frontend", difficulty:"middle", category:"React",
    question:"What are React hooks? Name the most commonly used ones.",
    questionRu:"Что такое хуки React? Назови самые используемые.",
    answer:"useState: local state. useEffect: side effects (fetch, subscriptions). useContext: consume context. useRef: mutable reference (DOM, timers). useMemo/useCallback: memoization to prevent unnecessary re-renders.",
    answerRu:"useState: локальное состояние. useEffect: побочные эффекты. useContext: контекст. useRef: DOM ссылки, таймеры. useMemo/useCallback: мемоизация для оптимизации.",
    tags:["react","hooks"] },

  { id:"fe-m-002", role:"frontend", difficulty:"middle", category:"Performance",
    question:"How do you optimize a slow-loading web page?",
    questionRu:"Как оптимизировать медленно загружающуюся страницу?",
    answer:"Measure first (Lighthouse). Then: code splitting, tree shaking, lazy loading, optimize images (WebP, lazy load), CDN, caching, reduce render-blocking resources, HTTP/2.",
    answerRu:"Сначала измерить (Lighthouse). Затем: code splitting, tree shaking, lazy loading, WebP изображения, CDN, кэширование, уменьшить render-blocking ресурсы, HTTP/2.",
    tags:["performance","optimization"] },

  { id:"fe-m-003", role:"frontend", difficulty:"middle", category:"Security",
    question:"What is XSS and how do you prevent it in React?",
    questionRu:"Что такое XSS и как предотвратить в React?",
    answer:"XSS: injecting malicious scripts. React escapes JSX by default — {userInput} is safe. Risks: dangerouslySetInnerHTML (use DOMPurify), href with javascript:. Prevention: sanitize HTML, use CSP headers.",
    answerRu:"XSS: внедрение вредоносных скриптов. React экранирует JSX по умолчанию. Риски: dangerouslySetInnerHTML (используй DOMPurify), javascript: в href. Защита: CSP заголовки.",
    tags:["security","xss","react"] },

  { id:"fe-s-001", role:"frontend", difficulty:"senior", category:"Architecture",
    question:"How do you approach state management in a large React application?",
    questionRu:"Как подходишь к управлению состоянием в большом React приложении?",
    answer:"Start minimal: useState + useContext. Scale: Zustand for medium apps, Redux Toolkit for complex with devtools. Server state (API): React Query or SWR — separate from UI state. URL state for shareable views.",
    answerRu:"Начинать минимально: useState + useContext. Масштабировать: Zustand для средних, Redux Toolkit для сложных. Серверное состояние: React Query или SWR. URL state для воспроизводимых представлений.",
    tags:["architecture","state-management"] },

  { id:"be-j-001", role:"backend", difficulty:"junior", category:"HTTP",
    question:"What are the main HTTP methods and when to use each?",
    questionRu:"Какие основные HTTP методы и когда использовать каждый?",
    answer:"GET: retrieve (safe, idempotent). POST: create (not idempotent). PUT: replace fully (idempotent). PATCH: partial update. DELETE: remove (idempotent). HEAD: like GET without body. OPTIONS: CORS preflight.",
    answerRu:"GET: получить (безопасный, идемпотентный). POST: создать. PUT: заменить полностью (идемпотентный). PATCH: частичное обновление. DELETE: удалить (идемпотентный).",
    tags:["http","rest"] },

  { id:"be-j-002", role:"backend", difficulty:"junior", category:"Security",
    question:"What is JWT and how does authentication with it work?",
    questionRu:"Что такое JWT и как работает аутентификация с ним?",
    answer:"JWT: encoded JSON with header.payload.signature. Flow: login → server creates signed JWT → client stores it → sends in Authorization header → server validates signature. Stateless. Risk: cannot invalidate before expiry.",
    answerRu:"JWT: закодированный JSON с header.payload.signature. Поток: логин → сервер создаёт подписанный JWT → клиент хранит → отправляет в Authorization → сервер проверяет подпись. Stateless. Риск: нельзя инвалидировать до истечения.",
    tags:["security","jwt","auth"] },

  { id:"be-j-003", role:"backend", difficulty:"junior", category:"Databases",
    question:"What is the difference between SQL and NoSQL? When to use each?",
    questionRu:"В чём разница между SQL и NoSQL? Когда использовать каждый?",
    answer:"SQL: structured data, ACID, complex JOINs, enforced schema (PostgreSQL). Use for financial data, complex relations. NoSQL: flexible schema, horizontal scaling. MongoDB for varying schemas, Redis for caching.",
    answerRu:"SQL: структурированные данные, ACID, JOIN, обязательная схема. Для финансовых данных, сложных связей. NoSQL: гибкая схема, горизонтальное масштабирование. MongoDB для переменных схем, Redis для кэша.",
    tags:["databases","sql","nosql"] },

  { id:"be-j-004", role:"backend", difficulty:"junior", category:"REST",
    question:"What makes an API RESTful?",
    questionRu:"Что делает API RESTful?",
    answer:"REST constraints: Stateless (no client state on server), Client-Server separation, Cacheable responses, Uniform interface (resource URIs, HTTP methods, status codes), Layered system. Use nouns for resources, HTTP methods for actions.",
    answerRu:"Ограничения REST: Stateless, Client-Server, кэшируемость, единообразный интерфейс (URI, HTTP методы, статус-коды). Существительные для ресурсов, HTTP методы для действий.",
    tags:["rest","api","architecture"] },

  { id:"be-m-001", role:"backend", difficulty:"middle", category:"Databases",
    question:"What is database indexing and when should you add an index?",
    questionRu:"Что такое индексирование и когда добавлять индекс?",
    answer:"Index is a data structure (B-tree) that speeds lookups at cost of write performance. Add for: WHERE, JOIN, ORDER BY columns. Don't over-index — each index slows writes. Use EXPLAIN to analyze queries.",
    answerRu:"Индекс — структура данных (B-tree) для ускорения поиска за счёт записи. Добавлять для: WHERE, JOIN, ORDER BY. Не переиндексировать. EXPLAIN для анализа запросов.",
    tags:["databases","indexing","performance"] },

  { id:"be-m-002", role:"backend", difficulty:"middle", category:"Security",
    question:"What are the most common web security vulnerabilities?",
    questionRu:"Какие самые распространённые уязвимости веб-безопасности?",
    answer:"OWASP Top: SQL Injection (use parameterized queries), Broken Auth (bcrypt, MFA), XSS (escape output, CSP), IDOR (check auth per request), Security Misconfiguration (disable debug, security headers), Vulnerable Dependencies (audit regularly).",
    answerRu:"OWASP: SQL Инъекции (параметризованные запросы), Сломанная аутентификация (bcrypt, MFA), XSS (экранирование, CSP), IDOR (авторизация на каждый запрос), Уязвимые зависимости.",
    tags:["security","owasp"] },

  { id:"be-m-003", role:"backend", difficulty:"middle", category:"Architecture",
    question:"What caching strategies exist?",
    questionRu:"Какие стратегии кэширования существуют?",
    answer:"Cache-aside: app checks cache, loads from DB on miss. Write-through: write to cache and DB simultaneously. Write-behind: write to cache, async to DB. Invalidation: TTL, event-based, manual purge.",
    answerRu:"Cache-aside: приложение проверяет кэш, загружает из БД при промахе. Write-through: запись в кэш и БД одновременно. Write-behind: в кэш, асинхронно в БД. Инвалидация: TTL, события.",
    tags:["caching","performance"] },

  { id:"be-s-001", role:"backend", difficulty:"senior", category:"Architecture",
    question:"When would you choose microservices over a monolith?",
    questionRu:"Когда выбрать микросервисы вместо монолита?",
    answer:"Start with monolith. Move to microservices when: team scaling (Conway's Law), independent deployment, different scaling needs per service. Cost: network latency, distributed complexity, operational overhead. Don't do microservices prematurely.",
    answerRu:"Начинать с монолита. Переходить на микросервисы когда: масштабирование команды, независимый деплой, разные потребности масштабирования. Цена: сетевая задержка, сложность. Не преждевременно.",
    tags:["architecture","microservices"] },

  { id:"be-s-002", role:"backend", difficulty:"senior", category:"Databases",
    question:"Explain ACID properties in database transactions.",
    questionRu:"Объясни свойства ACID в транзакциях БД.",
    answer:"Atomicity: all operations succeed or all fail. Consistency: DB moves between valid states, constraints maintained. Isolation: concurrent transactions don't interfere (isolation levels). Durability: committed data survives crashes.",
    answerRu:"Atomicity: все операции успешны или все отменяются. Consistency: БД в валидном состоянии. Isolation: конкурентные транзакции не мешают друг другу. Durability: данные переживают сбои.",
    tags:["databases","transactions","acid"] },
];

export const DIFFICULTY_LABELS: Record<InterviewDifficulty, { label: string; labelRu: string; colorClass: string }> = {
  junior: { label:"Junior", labelRu:"Junior", colorClass:"text-green-400 border-green-500/30 bg-green-500/10" },
  middle: { label:"Middle", labelRu:"Middle", colorClass:"text-amber-400 border-amber-500/30 bg-amber-500/10" },
  senior: { label:"Senior", labelRu:"Senior", colorClass:"text-red-400 border-red-500/30 bg-red-500/10"     },
};

export const ROLE_META: Record<InterviewRole, { label: string; labelRu: string }> = {
  qa:       { label:"QA Engineer",    labelRu:"QA-инженер" },
  frontend: { label:"Frontend Dev",  labelRu:"Frontend" },
  backend:  { label:"Backend Dev",   labelRu:"Backend" },
};
