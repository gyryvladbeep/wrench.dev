export type CorpusCategory = "markdown" | "links" | "mentions" | "injection" | "layout";

export interface CorpusCase {
  id: string;
  category: CorpusCategory;
  title: { en: string; ru: string };
  text: string;
  check: { en: string; ru: string };
}

export const CORPUS_CATEGORIES: { id: CorpusCategory; en: string; ru: string }[] = [
  { id: "markdown", en: "Formatting", ru: "Форматирование" },
  { id: "links", en: "Links", ru: "Ссылки" },
  { id: "mentions", en: "Mentions", ru: "Упоминания" },
  { id: "injection", en: "Injection", ru: "Инъекции" },
  { id: "layout", en: "Layout", ru: "Вёрстка" },
];

const c = (id: string, category: CorpusCategory, en: string, ru: string, text: string, checkEn: string, checkRu: string): CorpusCase =>
  ({ id, category, title: { en, ru }, text, check: { en: checkEn, ru: checkRu } });

export const CORPUS: CorpusCase[] = [
  // ── Форматирование ──
  c("md-basic", "markdown", "Bold, italic, strike, code", "Жирный, курсив, зачёркнутый, код", "**bold** _italic_ ~~strike~~ `code` ***bold italic***", "Each style renders once; no stray markers left.", "Каждый стиль применён один раз, лишних символов разметки не осталось."),
  c("md-nested", "markdown", "Nested styles", "Вложенные стили", "**bold _and italic_ together** and _italic **and bold**_", "Nesting is closed in the right order.", "Вложенность закрывается в правильном порядке."),
  c("md-unclosed", "markdown", "Unclosed markers", "Незакрытые маркеры", "**not closed and `also not closed and _nor this", "Text stays readable and the layout is not broken.", "Текст остаётся читаемым, вёрстка не ломается."),
  c("md-snake", "markdown", "Underscores inside words", "Подчёркивания внутри слов", "snake_case_name and file_name_final.txt and 2_000_000", "Underscores inside identifiers are not turned into italic.", "Подчёркивания внутри идентификаторов не превращаются в курсив."),
  c("md-asterisks", "markdown", "Math with asterisks", "Математика со звёздочками", "2 * 3 * 4 = 24 and a*b*c", "Multiplication signs do not start italic text.", "Знаки умножения не запускают курсив."),
  c("md-escape", "markdown", "Escaped markers", "Экранированные маркеры", "\\*not bold\\* \\_not italic\\_ \\`not code\\`", "Backslash escapes show the literal characters.", "Экранирование обратным слэшем показывает символы как есть."),
  c("md-fence", "markdown", "Code block with markers inside", "Блок кода с разметкой внутри", "```js\nconst a = \"**not bold**\" + '@everyone';\n```", "Content stays literal; no mentions or links inside code.", "Содержимое остаётся буквальным; внутри кода нет упоминаний и ссылок."),
  c("md-fence-open", "markdown", "Unclosed code block", "Незакрытый блок кода", "```\ncode that never ends\nnext line", "An unclosed fence does not swallow the rest of the chat.", "Незакрытый блок не поглощает остальную ленту."),
  c("md-list", "markdown", "Lists and numbering", "Списки и нумерация", "- one\n- two\n  - nested\n1. first\n2. second\n10. tenth", "Indentation, bullets and numbers render correctly.", "Отступы, маркеры и номера отображаются верно."),
  c("md-quote", "markdown", "Quote and multiline quote", "Цитата и многострочная цитата", "> single quote\n>> nested quote\n> line one\n> line two", "Quote bars are stacked correctly.", "Полосы цитат отображаются корректно."),
  c("md-heading", "markdown", "Hash at the start of a line", "Решётка в начале строки", "# not a task heading\n#1 issue number\n#channel-name", "Know whether headings are supported; channel links are not broken.", "Понимайте, поддерживаются ли заголовки; ссылки на каналы не ломаются."),
  c("md-emoji-code", "markdown", "Emoji shortcodes", "Шорткоды эмодзи", ":smile: :+1: :not_an_emoji: 12:30:45 a:b:c", "Real shortcodes are replaced; times and ratios are not.", "Настоящие шорткоды заменяются; время и соотношения нет."),
  // ── Ссылки ──
  c("link-md", "links", "Markdown link with parentheses", "Markdown-ссылка со скобками", "[wiki](https://en.wikipedia.org/wiki/Function_(mathematics)) and (see https://example.com/a_(b))", "The closing parenthesis stays part of the URL when it is balanced.", "Закрывающая скобка остаётся частью URL, если скобки парные."),
  c("link-punct", "links", "Trailing punctuation", "Знаки препинания после ссылки", "Open https://example.com/path, then https://example.com/x. Or (https://example.com/y)! Really? https://example.com/z?", "Trailing punctuation is not part of the link.", "Знаки препинания в конце не входят в ссылку."),
  c("link-idn", "links", "Unicode domain", "Юникод-домен", "https://пример.рф/страница and https://münchen.de/straße", "Link works, display and href are consistent.", "Ссылка работает, отображение и href согласованы."),
  c("link-userinfo", "links", "Link with credentials", "Ссылка с логином и паролем", "https://trusted.com@evil.example/login", "A warning or the real host is shown, not only the trusted-looking part.", "Показывается предупреждение или настоящий хост, а не только похожая на доверенную часть."),
  c("link-scheme", "links", "Dangerous schemes", "Опасные схемы", "javascript:alert(1) data:text/html,hello vbscript:x file:///etc/passwd", "None of these become clickable links.", "Ни одна из них не становится кликабельной ссылкой."),
  c("link-text-mismatch", "links", "Link text differs from target", "Текст ссылки не совпадает с адресом", "[https://bank.example](https://evil.example)", "Mismatch is visible to the user (tooltip, confirmation).", "Расхождение видно пользователю (подсказка, подтверждение)."),
  c("link-long", "links", "Very long URL", "Очень длинный URL", "https://example.com/" + "segment/".repeat(40) + "?a=1&b=2", "The URL wraps or truncates without overflowing the bubble.", "URL переносится или обрезается и не вылезает за пузырь."),
  c("link-email", "links", "Email and phone", "Email и телефон", "write to team@example.com or +374 10 123456, not a@b or 12.34.56", "Email and phone are detected; lookalikes are not.", "Email и телефон распознаны; похожие строки нет."),
  c("link-ports", "links", "Localhost, IP and ports", "Localhost, IP и порты", "http://localhost:3000/app http://192.168.0.1:8080 http://[::1]:5173/", "Local and IPv6 addresses are handled predictably.", "Локальные адреса и IPv6 обрабатываются предсказуемо."),
  // ── Упоминания ──
  c("men-user", "mentions", "User mention in a sentence", "Упоминание пользователя в предложении", "Thanks @alex, @alex.smith! and (@alex) and @alex's idea", "Punctuation does not break the mention; the apostrophe case is handled.", "Знаки препинания не ломают упоминание; случай с апострофом обработан."),
  c("men-email", "mentions", "Mention inside an email", "Упоминание внутри email", "contact name@example.com not @example.com", "An email is not turned into a mention.", "Email не превращается в упоминание."),
  c("men-broadcast", "mentions", "Broadcast mentions", "Массовые упоминания", "@channel @here @everyone", "Broadcast mentions respect permissions and show a confirmation.", "Массовые упоминания учитывают права и показывают подтверждение."),
  c("men-code", "mentions", "Mention inside code", "Упоминание внутри кода", "`@alex` and ```\n@here\n```", "No notification is sent for mentions inside code.", "Уведомление для упоминаний внутри кода не отправляется."),
  c("men-case", "mentions", "Case and similar names", "Регистр и похожие имена", "@Alex @ALEX @alex @alexander @alex_", "The right user is matched; prefixes do not match longer names.", "Находится нужный пользователь; префикс не совпадает с более длинным именем."),
  c("men-unicode", "mentions", "Mention with non-Latin name", "Упоминание с нелатинским именем", "@Иван @李雷 @محمد @user-name @user.name", "Non-Latin names and separators are matched.", "Нелатинские имена и разделители распознаются."),
  c("men-hash", "mentions", "Channel references", "Ссылки на каналы", "#general #random-1 #канал #not a channel", "Channel links are limited to the name; spaces end them.", "Ссылка на канал ограничена именем, пробел завершает её."),
  // ── Инъекции ──
  c("inj-script", "injection", "Script tag", "Тег script", "<script>window.__xss=1</script>", "Shown as plain text; window.__xss stays undefined.", "Показывается как обычный текст; window.__xss остаётся undefined."),
  c("inj-img", "injection", "Image with an error handler", "Картинка с обработчиком ошибки", "<img src=x onerror=\"window.__xss=1\">", "No broken image, handler never runs.", "Нет битой картинки, обработчик не выполняется."),
  c("inj-svg", "injection", "SVG with onload", "SVG с onload", "<svg onload=\"window.__xss=1\"></svg>", "Rendered as text; nothing executes.", "Отображается как текст; ничего не выполняется."),
  c("inj-href", "injection", "Anchor with javascript URL", "Ссылка с javascript в href", "<a href=\"javascript:window.__xss=1\">click</a> and [click](javascript:window.__xss=1)", "Neither becomes a working link.", "Ни одна не становится рабочей ссылкой."),
  c("inj-attr", "injection", "Attribute breakout", "Выход из атрибута", "\"><b>bold</b> '><i>italic</i> `><u>underline</u>", "Quotes do not break out of attributes; no formatting appears.", "Кавычки не выходят из атрибутов; форматирования нет."),
  c("inj-entities", "injection", "HTML entities", "HTML-сущности", "&lt;b&gt;text&lt;/b&gt; &amp;lt; &#60;script&#62;", "Shown literally, not decoded twice.", "Показываются буквально и не декодируются дважды."),
  c("inj-iframe", "injection", "Iframe and style", "Iframe и style", "<iframe srcdoc=\"<p>x</p>\"></iframe><style>body{display:none}</style>", "Neither embeds content nor changes page styles.", "Ни встраивает содержимое, ни меняет стили страницы."),
  c("inj-template", "injection", "Template syntax", "Шаблонный синтаксис", "{{7*7}} ${7*7} #{7*7} <%= 7*7 %>", "No expression is evaluated: 49 never appears.", "Выражения не вычисляются: 49 нигде не появляется."),
  c("inj-null", "injection", "Control characters", "Управляющие символы", "before\u0000after\u0008end\u001B[31mred", "Control characters are stripped or escaped, the message still saves.", "Управляющие символы удаляются или экранируются, сообщение сохраняется."),
  // ── Вёрстка ──
  c("lay-word", "layout", "One very long word", "Одно очень длинное слово", "A".repeat(200), "Wraps inside the bubble; no horizontal scroll.", "Переносится внутри пузыря; горизонтальной прокрутки нет."),
  c("lay-newlines", "layout", "Many empty lines", "Много пустых строк", "top" + "\n".repeat(30) + "bottom", "Empty lines are collapsed or the message is foldable.", "Пустые строки схлопываются или сообщение сворачивается."),
  c("lay-single-emoji", "layout", "Emoji-only messages", "Сообщения только из эмодзи", "😀\n😀😀😀\n" + "😀".repeat(30), "Large emoji for one to three, normal size for many.", "Крупные эмодзи для одного-трёх, обычный размер для многих."),
  c("lay-tall", "layout", "Tall narrow content", "Высокое узкое содержимое", "W\nW\nW\nW\nW\nW\nW\nW\nW\nW\nW\nW\nW\nW\nW", "Bubble keeps the minimum width; layout stays stable.", "Пузырь сохраняет минимальную ширину; вёрстка стабильна."),
  c("lay-rtl", "layout", "RTL line in a LTR chat", "Строка RTL в LTR-чате", "مرحبا Hello שלום 123", "Alignment and bidi order are correct; neighbours are unaffected.", "Выравнивание и порядок bidi корректны; соседние сообщения не затронуты."),
];

export function casesIn(category: CorpusCategory): CorpusCase[] {
  return CORPUS.filter((x) => x.category === category);
}
