-- Wrench Challenges — Fixed Seed Data

-- Insert challenges one by one to avoid issues with quotes
INSERT INTO challenges (role, difficulty, type, title, title_ru, description, description_ru, input_data, hint, hint_ru, correct_answer, answer_type, explanation, explanation_ru, points) VALUES
('qa', 'easy', 'find_bug', 
 'Find the JSON bug',
 'Найди баг в JSON',
 'This API response causes a 500 error. Find the syntax error.',
 'Этот API-ответ вызывает ошибку 500. Найди синтаксическую ошибку.',
 '{"user": {"id": 123, "name": "Alice", "roles": ["admin", "user",], "active": true}}',
 'Look carefully at the arrays and commas.',
 'Внимательно посмотри на массивы и запятые.',
 'trailing comma',
 'contains',
 'The array has a trailing comma before the closing bracket. JSON does not allow trailing commas.',
 'Массив содержит лишнюю запятую перед закрывающей скобкой. JSON не допускает trailing comma.',
 10);

INSERT INTO challenges (role, difficulty, type, title, title_ru, description, description_ru, input_data, hint, hint_ru, correct_answer, answer_type, explanation, explanation_ru, points) VALUES
('qa', 'medium', 'find_bug',
 'Broken JWT payload',
 'Сломанный JWT payload',
 'A user cannot access admin features despite having the admin role. Decode this JWT and find the issue.',
 'Пользователь не может получить доступ к функциям администратора. Декодируй JWT и найди проблему.',
 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsaWNlIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNjAwMDAwMDAwfQ.signature',
 'Check the expiration field in the payload.',
 'Проверь поле истечения срока в payload.',
 'expired',
 'contains',
 'The exp field is 1600000000 (September 2020). This JWT expired years ago. The user has the correct role, but the token is expired.',
 'Поле exp равно 1600000000 (сентябрь 2020). JWT давно истёк. У пользователя правильная роль, но токен недействителен.',
 20);

INSERT INTO challenges (role, difficulty, type, title, title_ru, description, description_ru, input_data, hint, hint_ru, correct_answer, answer_type, explanation, explanation_ru, points) VALUES
('qa', 'easy', 'write_regex',
 'Email validation regex',
 'Regex для валидации email',
 'Write a regex that matches valid email addresses. Must match: user@example.com, alice@company.org. Must NOT match: notanemail, @nodomain.com, user@',
 'Напиши regex для валидации email. Должен совпадать: user@example.com. Не должен: notanemail, @nodomain.com',
 'Test strings:' || chr(10) || 'valid: user@example.com' || chr(10) || 'valid: alice.bob@company.org' || chr(10) || 'invalid: notanemail' || chr(10) || 'invalid: @nodomain.com' || chr(10) || 'invalid: user@',
 'A valid email has local@domain.tld structure.',
 'Валидный email имеет структуру local@domain.tld.',
 '[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}',
 'contains',
 'The pattern [a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,} covers all required cases. Local part allows letters, numbers and special chars. Domain must have a dot with 2+ letter TLD.',
 'Паттерн [a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,} покрывает все случаи. Локальная часть допускает буквы, цифры и спецсимволы.',
 15);

INSERT INTO challenges (role, difficulty, type, title, title_ru, description, description_ru, input_data, hint, hint_ru, correct_answer, answer_type, explanation, explanation_ru, points) VALUES
('qa', 'easy', 'find_bug',
 'HTTP method mismatch',
 'Несоответствие HTTP-метода',
 'A developer says the delete endpoint is not working. Look at the API call and find the bug.',
 'Разработчик говорит что эндпоинт удаления не работает. Найди баг в API вызове.',
 'API Documentation:' || chr(10) || 'DELETE /api/users/{id} — Delete a user' || chr(10) || chr(10) || 'Frontend code:' || chr(10) || 'fetch("/api/users/123", {' || chr(10) || '  method: "POST",' || chr(10) || '  headers: { "Authorization": "Bearer token123" }' || chr(10) || '})',
 'Compare the HTTP method in the docs vs the code.',
 'Сравни HTTP-метод в документации и в коде.',
 'DELETE',
 'contains',
 'The API documentation specifies DELETE method, but the code uses POST. Change method: "POST" to method: "DELETE".',
 'API-документация указывает метод DELETE, но код использует POST. Нужно изменить method: "POST" на method: "DELETE".',
 10);

INSERT INTO challenges (role, difficulty, type, title, title_ru, description, description_ru, input_data, hint, hint_ru, correct_answer, answer_type, explanation, explanation_ru, points) VALUES
('qa', 'medium', 'write_regex',
 'UUID v4 regex',
 'Regex для UUID v4',
 'Write a regex that validates UUID v4 format. Example: 550e8400-e29b-41d4-a716-446655440000',
 'Напиши regex для валидации UUID v4. Пример: 550e8400-e29b-41d4-a716-446655440000',
 'Must match:' || chr(10) || '550e8400-e29b-41d4-a716-446655440000' || chr(10) || '6ba7b810-9dad-41d1-80b4-00c04fd430c8' || chr(10) || chr(10) || 'Must NOT match:' || chr(10) || 'not-a-uuid' || chr(10) || '550e8400e29b41d4a716446655440000',
 'UUID has 5 groups: 8-4-4-4-12 hex characters.',
 'UUID имеет 5 групп: 8-4-4-4-12 hex символов.',
 '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}',
 'contains',
 'UUID format: 8 hex - 4 hex - 4 hex - 4 hex - 12 hex. The pattern [0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12} covers case-insensitive matching.',
 'Формат UUID: 8 hex - 4 hex - 4 hex - 4 hex - 12 hex символов.',
 20);

INSERT INTO challenges (role, difficulty, type, title, title_ru, description, description_ru, input_data, hint, hint_ru, correct_answer, answer_type, explanation, explanation_ru, points) VALUES
('frontend', 'easy', 'find_bug',
 'Fix the broken JSON config',
 'Исправь сломанный JSON конфиг',
 'This config file is throwing a parse error. Find the syntax error.',
 'Этот конфиг выдаёт ошибку парсинга. Найди синтаксическую ошибку.',
 '{' || chr(10) || '  "compilerOptions": {' || chr(10) || '    "target": "ES2017",' || chr(10) || '    "module": "commonjs"' || chr(10) || '    "strict": true,' || chr(10) || '    "outDir": "./dist"' || chr(10) || '  }' || chr(10) || '}',
 'Look at each line ending carefully.',
 'Внимательно посмотри на концы строк.',
 'missing comma',
 'contains',
 'After "module": "commonjs" there is a missing comma. JSON requires commas between all key-value pairs except the last one.',
 'После "module": "commonjs" пропущена запятая. JSON требует запятые между парами ключ-значение, кроме последней.',
 10);

INSERT INTO challenges (role, difficulty, type, title, title_ru, description, description_ru, input_data, hint, hint_ru, correct_answer, answer_type, explanation, explanation_ru, points) VALUES
('frontend', 'medium', 'decode',
 'Decode this Base64 token',
 'Декодируй Base64 токен',
 'A frontend app sends this in the Authorization header. What does it contain? Is there a security issue?',
 'Фронтенд отправляет это в заголовке Authorization. Что содержит? Есть ли проблема безопасности?',
 'Authorization: Basic YWRtaW46cGFzc3dvcmQxMjM=',
 'Basic auth uses base64 encoding, not encryption.',
 'Basic auth использует base64-кодирование, а не шифрование.',
 'admin:password123',
 'contains',
 'The value decodes to admin:password123. Basic Auth uses base64 which is trivially reversible — not encryption. Never use Basic Auth over plain HTTP.',
 'Значение декодируется в admin:password123. Basic Auth использует base64, который легко обратим. Никогда не использовать Basic Auth по HTTP.',
 20);

INSERT INTO challenges (role, difficulty, type, title, title_ru, description, description_ru, input_data, hint, hint_ru, correct_answer, answer_type, explanation, explanation_ru, points) VALUES
('frontend', 'easy', 'find_bug',
 'CSS Selector bug',
 'Баг в CSS-селекторе',
 'This CSS selector should select all error messages inside a form, but it is not working. Find the issue.',
 'Этот CSS-селектор должен выбирать все сообщения об ошибках внутри формы, но не работает. Найди проблему.',
 'Selector: form > .error-message' || chr(10) || chr(10) || 'HTML:' || chr(10) || '<form>' || chr(10) || '  <div class="field-wrapper">' || chr(10) || '    <span class="error-message">Email is required</span>' || chr(10) || '  </div>' || chr(10) || '</form>',
 'The > combinator means direct child only.',
 'Комбинатор > означает только прямого потомка.',
 'direct child',
 'contains',
 'The > combinator selects only direct children. The .error-message spans are inside .field-wrapper, not direct children of form. Use "form .error-message" instead.',
 'Комбинатор > выбирает только прямых потомков. Нужно использовать "form .error-message" вместо "form > .error-message".',
 10);

INSERT INTO challenges (role, difficulty, type, title, title_ru, description, description_ru, input_data, hint, hint_ru, correct_answer, answer_type, explanation, explanation_ru, points) VALUES
('frontend', 'hard', 'find_bug',
 'Find the XSS vulnerability',
 'Найди XSS-уязвимость',
 'This React component renders user content. Find the security vulnerability.',
 'Этот React-компонент рендерит пользовательский контент. Найди уязвимость безопасности.',
 'function UserComment({ comment }) {' || chr(10) || '  return (' || chr(10) || '    <div>' || chr(10) || '      <div dangerouslySetInnerHTML={{ __html: comment.text }} />' || chr(10) || '      <span>{comment.author}</span>' || chr(10) || '    </div>' || chr(10) || '  );' || chr(10) || '}',
 'What does dangerouslySetInnerHTML bypass in React?',
 'Что обходит dangerouslySetInnerHTML в React?',
 'dangerouslySetInnerHTML',
 'contains',
 'dangerouslySetInnerHTML bypasses React XSS protection. Malicious users can inject script tags. Fix: use DOMPurify to sanitize HTML before rendering.',
 'dangerouslySetInnerHTML обходит XSS-защиту React. Злоумышленники могут внедрить теги script. Исправление: использовать DOMPurify для санитизации HTML.',
 40);

INSERT INTO challenges (role, difficulty, type, title, title_ru, description, description_ru, input_data, hint, hint_ru, correct_answer, answer_type, explanation, explanation_ru, points) VALUES
('backend', 'easy', 'find_bug',
 'Fix the HTTP status code',
 'Исправь HTTP статус код',
 'This API endpoint returns the wrong HTTP status code for resource creation. What should it return?',
 'Этот API эндпоинт возвращает неправильный HTTP статус при создании ресурса. Какой должен вернуть?',
 'POST /api/users' || chr(10) || 'Request: { "email": "alice@example.com", "name": "Alice" }' || chr(10) || chr(10) || 'Response: HTTP 200 OK' || chr(10) || '{ "id": "uuid-123", "email": "alice@example.com" }',
 'What status code is designed for successful resource creation?',
 'Какой статус-код предназначен для успешного создания ресурса?',
 '201',
 'contains',
 'POST requests that create a new resource should return 201 Created, not 200 OK. The response should also include a Location header pointing to the new resource.',
 'POST-запросы, создающие новый ресурс, должны возвращать 201 Created, а не 200 OK. Ответ также должен содержать заголовок Location.',
 10);

INSERT INTO challenges (role, difficulty, type, title, title_ru, description, description_ru, input_data, hint, hint_ru, correct_answer, answer_type, explanation, explanation_ru, points) VALUES
('backend', 'hard', 'find_bug',
 'JWT none algorithm attack',
 'Атака JWT с алгоритмом none',
 'A security researcher found the API accepts modified JWTs. Decode the second token and explain the attack.',
 'Исследователь обнаружил что API принимает модифицированные JWT. Декодируй второй токен и объясни атаку.',
 'Original (HS256):' || chr(10) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJyb2xlIjoidXNlciJ9.signature' || chr(10) || chr(10) || 'Attacker modified:' || chr(10) || 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VySWQiOiIxMjMiLCJyb2xlIjoiYWRtaW4ifQ.',
 'Decode the header of the second token. What algorithm does it specify?',
 'Декодируй заголовок второго токена. Какой алгоритм он указывает?',
 'none',
 'contains',
 'This is the JWT alg:none attack. The attacker changed algorithm to none and role to admin. If the server accepts none algorithm, it skips signature verification. Fix: always explicitly validate the expected algorithm.',
 'Это атака JWT alg:none. Злоумышленник изменил алгоритм на none и роль на admin. Сервер пропускает проверку подписи. Исправление: явно указывать и проверять ожидаемый алгоритм.',
 50);

INSERT INTO challenges (role, difficulty, type, title, title_ru, description, description_ru, input_data, hint, hint_ru, correct_answer, answer_type, explanation, explanation_ru, points) VALUES
('backend', 'medium', 'sql_fix',
 'Find the SQL injection',
 'Найди SQL-инъекцию',
 'This backend code has a critical SQL injection vulnerability. Find it and explain the fix.',
 'Этот backend-код содержит критическую SQL-инъекцию. Найди её и объясни исправление.',
 'app.get("/api/products", (req, res) => {' || chr(10) || '  const category = req.query.category;' || chr(10) || '  const query = `SELECT * FROM products WHERE category = ''' || '${category}' || ''' AND active = true`;' || chr(10) || '  db.query(query, callback);' || chr(10) || '});' || chr(10) || chr(10) || '// Attacker: GET /api/products?category='' OR 1=1--',
 'What happens when attacker input is directly inserted into the SQL string?',
 'Что произойдёт если ввод злоумышленника вставить напрямую в SQL строку?',
 'parameterized',
 'contains',
 'String interpolation allows SQL injection. The attacker closes the string and adds OR 1=1 which returns all rows. Fix: use parameterized queries like db.query("SELECT * FROM products WHERE category = ?", [category])',
 'Интерполяция строк допускает SQL-инъекцию. Злоумышленник закрывает строку и добавляет OR 1=1. Исправление: использовать параметризованные запросы.',
 30);

-- Schedule daily challenges for today
INSERT INTO daily_challenges (challenge_id, role, scheduled_for)
SELECT id, 'qa', CURRENT_DATE FROM challenges WHERE role = 'qa' AND difficulty = 'easy' ORDER BY created_at LIMIT 1
ON CONFLICT (role, scheduled_for) DO NOTHING;

INSERT INTO daily_challenges (challenge_id, role, scheduled_for)
SELECT id, 'frontend', CURRENT_DATE FROM challenges WHERE role = 'frontend' AND difficulty = 'easy' ORDER BY created_at LIMIT 1
ON CONFLICT (role, scheduled_for) DO NOTHING;

INSERT INTO daily_challenges (challenge_id, role, scheduled_for)
SELECT id, 'backend', CURRENT_DATE FROM challenges WHERE role = 'backend' AND difficulty = 'easy' ORDER BY created_at LIMIT 1
ON CONFLICT (role, scheduled_for) DO NOTHING;
