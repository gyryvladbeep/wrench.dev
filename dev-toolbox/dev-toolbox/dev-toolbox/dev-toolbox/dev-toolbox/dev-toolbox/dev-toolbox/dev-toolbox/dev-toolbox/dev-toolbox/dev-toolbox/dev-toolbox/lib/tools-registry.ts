import { CategoryMeta, Tool, ToolCategory } from "./types";

export const categories: CategoryMeta[] = [
  { slug: "formatting", name: "Formatting", description: "Format, validate and beautify JSON, XML, SQL and HTML." },
  { slug: "encoding",   name: "Encoding",   description: "Encode and decode Base64, URLs, HTML entities and more." },
  { slug: "text",       name: "Text",       description: "Manipulate text: diff, convert case, count words, sort lines." },
  { slug: "hash",       name: "Hash",       description: "Generate and verify MD5, SHA-1, SHA-256, SHA-512 hashes." },
  { slug: "generators", name: "Generators", description: "Generate UUIDs, passwords, colors, Lorem Ipsum and more." },
  { slug: "datetime",   name: "Date & Time", description: "Convert timestamps, calculate date differences and parse cron." },
  { slug: "web",        name: "Web",        description: "Parse URLs, inspect headers, generate QR codes." },
  { slug: "data",       name: "Data",       description: "Generate fake test data, convert formats, work with CSV." },
  { slug: "qa",         name: "QA",         description: "XPath, CSS selectors, API testing and QA utilities." },
  { slug: "api",        name: "API",        description: "Build curl commands, REST requests and inspect HTTP." },
];

export const tools: Tool[] = [

  // ═══════════════════════════════ FORMATTING ════════════════════════════════

  {
    slug: "json-formatter",
    name: "JSON Formatter",
    shortDescription: "Format, validate and minify JSON instantly.",
    longDescription: "Paste any JSON to pretty-print it with proper indentation, validate its syntax, or minify it to a single line. Runs entirely in your browser — nothing is uploaded.",
    metaDescription: "Free online JSON formatter and validator. Pretty-print, minify and validate JSON instantly in your browser. No signup required.",
    category: "formatting", isPopular: true, isImplemented: true, isFeatured: true,
    aliases: ["json beautify", "json pretty print", "json lint"],
    relatedSlugs: ["json-validator", "json-minify", "json-sort"],
    keywords: ["json formatter", "json validator", "json pretty print", "json beautifier"],
    howToSteps: ["Paste or type your JSON into the input panel.", "Click Format to pretty-print it, or Minify to collapse it.", "Copy the result or download it as a .json file."],
    faqs: [{ question: "Is my JSON data uploaded anywhere?", answer: "No. Formatting happens entirely in your browser — your data is never sent to a server." }, { question: "Why does it say 'Unexpected token'?", answer: "That means the JSON is syntactically invalid — usually a trailing comma, missing quote, or a comment (JSON doesn't support comments)." }],
  },
  {
    slug: "json-validator",
    name: "JSON Validator",
    shortDescription: "Validate JSON syntax and get clear error messages.",
    longDescription: "Quickly validate JSON syntax and get a clear error message with the exact line and column if it's invalid.",
    metaDescription: "Validate JSON online for free. Get instant, clear error messages for invalid JSON with line numbers. Runs fully in your browser.",
    category: "formatting", isPopular: true, isImplemented: true,
    aliases: ["json lint", "json check", "json syntax checker"],
    relatedSlugs: ["json-formatter", "json-minify"],
    keywords: ["json validator", "validate json online", "json syntax checker", "json lint"],
  },
  {
    slug: "json-minify",
    name: "JSON Minify",
    shortDescription: "Remove all whitespace from JSON to minimize size.",
    longDescription: "Compress JSON by removing all unnecessary whitespace, newlines and indentation. Perfect for reducing payload size in APIs.",
    metaDescription: "Minify JSON online — remove whitespace and compress JSON for smaller file sizes. Free, instant, runs in your browser.",
    category: "formatting", isImplemented: true,
    aliases: ["json compress", "json minifier", "json uglify"],
    relatedSlugs: ["json-formatter", "json-validator"],
    keywords: ["json minify", "json compress", "minify json online"],
  },
  {
    slug: "json-sort",
    name: "JSON Key Sorter",
    shortDescription: "Sort JSON keys alphabetically, recursively.",
    longDescription: "Sort all keys in a JSON object alphabetically, with optional recursive sorting of nested objects. Makes large JSON structures easier to diff and review.",
    metaDescription: "Sort JSON keys alphabetically online. Recursively sorts nested objects — free, instant, no data uploaded.",
    category: "formatting", isImplemented: true,
    aliases: ["json alphabetize", "sort json keys"],
    relatedSlugs: ["json-formatter", "json-compare"],
    keywords: ["json sort", "sort json keys", "json alphabetize"],
  },
  {
    slug: "json-compare",
    name: "JSON Compare",
    shortDescription: "Compare two JSON objects and highlight differences.",
    longDescription: "Paste two JSON documents and see exactly what changed — added, removed and modified keys are highlighted clearly.",
    metaDescription: "Compare two JSON objects online and see the diff. Highlights added, removed and changed keys. Free, runs in your browser.",
    category: "formatting", isImplemented: true, isFeatured: true,
    aliases: ["json diff", "json difference", "compare json"],
    relatedSlugs: ["json-formatter", "text-diff"],
    keywords: ["json compare", "json diff", "compare json objects"],
  },
  {
    slug: "json-escape",
    name: "JSON Escape / Unescape",
    shortDescription: "Escape JSON for embedding in strings, or unescape it.",
    longDescription: "Escape special characters in JSON for safe embedding in strings, or unescape an escaped JSON string back to readable format.",
    metaDescription: "Escape or unescape JSON strings online. Handles backslashes, quotes and special characters. Free, runs in your browser.",
    category: "formatting", isImplemented: true,
    aliases: ["json unescape", "json encode string", "json string escape"],
    relatedSlugs: ["json-formatter", "html-encode-decode"],
    keywords: ["json escape", "json unescape", "escape json string"],
  },
  {
    slug: "json-to-yaml",
    name: "JSON → YAML Converter",
    shortDescription: "Convert JSON to YAML and back instantly.",
    longDescription: "Convert between JSON and YAML formats. Supports complex nested structures, arrays and all YAML scalar types.",
    metaDescription: "Convert JSON to YAML or YAML to JSON online. Free, instant, handles all data types. Runs in your browser.",
    category: "formatting", isImplemented: true, isFeatured: true,
    aliases: ["yaml to json", "json yaml converter"],
    relatedSlugs: ["json-formatter", "xml-formatter"],
    keywords: ["json to yaml", "yaml to json", "json yaml converter"],
  },
  {
    slug: "xml-formatter",
    name: "XML Formatter",
    shortDescription: "Pretty-print and validate XML documents.",
    longDescription: "Format messy or minified XML into clean, indented, readable markup. Uses the browser's native XML parser for genuine validation.",
    metaDescription: "Free online XML formatter and validator. Pretty-print XML instantly in your browser with real validation.",
    category: "formatting", isImplemented: true,
    aliases: ["xml beautify", "xml pretty print", "xml indent"],
    relatedSlugs: ["json-formatter", "html-formatter", "xml-validate"],
    keywords: ["xml formatter", "xml beautifier", "xml validator"],
  },
  {
    slug: "xml-validate",
    name: "XML Validator",
    shortDescription: "Validate XML well-formedness and get clear errors.",
    longDescription: "Validate that your XML is well-formed. Get clear error messages with line and column numbers.",
    metaDescription: "Validate XML online. Check XML well-formedness with clear error messages. Free, runs in your browser.",
    category: "formatting", isImplemented: false,
    relatedSlugs: ["xml-formatter"],
    keywords: ["xml validator", "validate xml online", "xml lint"],
  },
  {
    slug: "xml-minify",
    name: "XML Minify",
    shortDescription: "Remove whitespace from XML to reduce file size.",
    longDescription: "Strip all unnecessary whitespace, newlines and indentation from XML documents.",
    metaDescription: "Minify XML online — strip whitespace and reduce file size. Free, instant, runs in your browser.",
    category: "formatting", isImplemented: false,
    relatedSlugs: ["xml-formatter", "json-minify"],
    keywords: ["xml minify", "xml compress", "minify xml"],
  },
  {
    slug: "sql-formatter",
    name: "SQL Formatter",
    shortDescription: "Format SQL queries for readability.",
    longDescription: "Turn dense, single-line SQL into clean, indented, readable queries. Supports SELECT, INSERT, UPDATE, DELETE, CREATE and more.",
    metaDescription: "Free online SQL formatter. Beautify SQL queries for MySQL, PostgreSQL, SQLite and more. Runs in your browser.",
    category: "formatting", isImplemented: true,
    aliases: ["sql beautify", "sql pretty print", "sql indent"],
    relatedSlugs: ["json-formatter", "rest-request-builder"],
    keywords: ["sql formatter", "sql beautifier", "format sql query"],
  },
  {
    slug: "html-formatter",
    name: "HTML Formatter",
    shortDescription: "Pretty-print and clean up HTML markup.",
    longDescription: "Format minified or messy HTML into clean, indented markup with proper nesting.",
    metaDescription: "Free online HTML formatter. Beautify and indent HTML markup instantly. Runs in your browser.",
    category: "formatting", isImplemented: true,
    aliases: ["html beautify", "html pretty print", "html indent"],
    relatedSlugs: ["xml-formatter", "css-selector-generator", "markdown-preview"],
    keywords: ["html formatter", "html beautifier", "format html"],
  },
  {
    slug: "yaml-formatter",
    name: "YAML Formatter",
    shortDescription: "Format and validate YAML documents.",
    longDescription: "Paste YAML to validate its syntax and reformat it with consistent indentation.",
    metaDescription: "Format and validate YAML online. Check YAML syntax and reformat documents. Free, runs in your browser.",
    category: "formatting", isImplemented: false,
    relatedSlugs: ["json-to-yaml", "json-formatter"],
    keywords: ["yaml formatter", "yaml validator", "yaml beautifier"],
  },

  // ═══════════════════════════════ ENCODING ══════════════════════════════════

  {
    slug: "base64-encode-decode",
    name: "Base64 Encode / Decode",
    shortDescription: "Encode text to Base64 or decode Base64 to text.",
    longDescription: "Convert text and UTF-8 strings to Base64, or decode Base64 back to readable text. Supports full UTF-8 including emoji.",
    metaDescription: "Free online Base64 encoder and decoder. Encode or decode Base64 strings instantly, with full UTF-8 support. Runs in your browser.",
    category: "encoding", isPopular: true, isImplemented: true,
    aliases: ["base64 converter", "base64 encoder", "base64 decoder"],
    relatedSlugs: ["url-encode-decode", "jwt-decoder"],
    keywords: ["base64 encode", "base64 decode", "base64 converter online"],
    howToSteps: ["Choose Encode or Decode.", "Paste your text or Base64 string.", "Copy the converted result."],
    faqs: [{ question: "Does this support UTF-8 / emoji?", answer: "Yes. It uses the browser's TextEncoder/TextDecoder APIs so multi-byte characters round-trip correctly." }],
  },
  {
    slug: "url-encode-decode",
    name: "URL Encode / Decode",
    shortDescription: "Percent-encode or decode URLs and query strings.",
    longDescription: "Encode special characters for safe use in URLs, or decode percent-encoded strings back to plain text.",
    metaDescription: "Free online URL encoder and decoder. Percent-encode or decode URLs and query parameters instantly.",
    category: "encoding", isImplemented: true,
    aliases: ["percent encode", "url encoding", "urlencode"],
    relatedSlugs: ["base64-encode-decode", "header-inspector"],
    keywords: ["url encode", "url decode", "percent encoding tool"],
  },
  {
    slug: "html-encode-decode",
    name: "HTML Encode / Decode",
    shortDescription: "Encode HTML entities or decode them back to text.",
    longDescription: "Convert characters like <, >, &, \" and ' to their HTML entity equivalents, or decode HTML entities back to readable text.",
    metaDescription: "Free HTML entity encoder and decoder. Convert special characters to HTML entities and back. Runs in your browser.",
    category: "encoding", isImplemented: true,
    aliases: ["html entities", "html escape", "html unescape"],
    relatedSlugs: ["url-encode-decode", "json-escape"],
    keywords: ["html encode", "html decode", "html entities encoder"],
  },
  {
    slug: "hex-encode-decode",
    name: "Hex Encoder / Decoder",
    shortDescription: "Convert text to hexadecimal and back.",
    longDescription: "Encode any text string to its hexadecimal representation, or decode hex back to readable text.",
    metaDescription: "Free hex encoder and decoder. Convert text to hexadecimal and hex to text. Runs in your browser.",
    category: "encoding", isImplemented: true,
    aliases: ["hex converter", "text to hex", "hex to text"],
    relatedSlugs: ["binary-converter", "base64-encode-decode"],
    keywords: ["hex encode", "hex decode", "text to hex converter"],
  },
  {
    slug: "binary-converter",
    name: "Binary Converter",
    shortDescription: "Convert text to binary and binary back to text.",
    longDescription: "Translate any text string into its binary (0s and 1s) representation, or decode binary back to readable text.",
    metaDescription: "Free binary converter. Convert text to binary and back. Runs entirely in your browser.",
    category: "encoding", isImplemented: true,
    aliases: ["text to binary", "binary to text", "binary translator"],
    relatedSlugs: ["hex-encode-decode", "base64-encode-decode"],
    keywords: ["binary converter", "text to binary", "binary to text"],
  },
  {
    slug: "rot13",
    name: "ROT13 Encoder",
    shortDescription: "Encode or decode text with the ROT13 cipher.",
    longDescription: "Apply ROT13 substitution cipher to encode or decode text. ROT13 is its own inverse — applying it twice returns the original.",
    metaDescription: "Free ROT13 encoder and decoder. Apply ROT13 cipher to text instantly. Runs in your browser.",
    category: "encoding", isImplemented: true,
    aliases: ["rot13 decoder", "rot 13", "caesar cipher 13"],
    relatedSlugs: ["base64-encode-decode", "hex-encode-decode"],
    keywords: ["rot13", "rot13 encoder", "rot13 decoder", "caesar cipher"],
  },
  {
    slug: "jwt-decoder",
    name: "JWT Decoder",
    shortDescription: "Decode and inspect JSON Web Tokens.",
    longDescription: "Paste a JWT to instantly see its decoded header and payload, including expiry status. Decoding only — no signature verification.",
    metaDescription: "Free online JWT decoder. Decode JSON Web Tokens and inspect the header and payload instantly in your browser.",
    category: "encoding", isPopular: true, isImplemented: true, isFeatured: true,
    aliases: ["jwt parser", "decode jwt", "json web token decoder"],
    relatedSlugs: ["base64-encode-decode", "header-inspector"],
    keywords: ["jwt decoder", "decode jwt online", "jwt parser"],
    howToSteps: ["Paste a JWT (header.payload.signature).", "View the decoded header and payload as formatted JSON.", "Check the expiry indicator to see if the token has expired."],
    faqs: [{ question: "Does this verify the JWT signature?", answer: "No — this tool only decodes the header and payload. It does not verify the signature." }],
  },

  // ═══════════════════════════════ TEXT ══════════════════════════════════════

  {
    slug: "text-diff",
    name: "Text Diff Checker",
    shortDescription: "Compare two texts line-by-line and highlight changes.",
    longDescription: "Paste two blocks of text to see exactly what changed — added, removed and modified lines are highlighted clearly.",
    metaDescription: "Free online text diff checker. Compare two texts side by side and highlight differences. Runs in your browser.",
    category: "text", isPopular: true, isImplemented: true, isFeatured: true,
    aliases: ["diff checker", "text compare", "text comparison"],
    relatedSlugs: ["json-compare", "sort-lines"],
    keywords: ["text diff", "diff checker", "compare text online"],
  },
  {
    slug: "word-counter",
    name: "Word & Character Counter",
    shortDescription: "Count words, characters, sentences and paragraphs.",
    longDescription: "Get instant statistics for your text: word count, character count (with and without spaces), sentence count, paragraph count, and estimated reading time.",
    metaDescription: "Free word and character counter. Count words, characters, sentences, paragraphs and get reading time estimates.",
    category: "text", isPopular: true, isImplemented: true,
    aliases: ["character counter", "word count", "text statistics"],
    relatedSlugs: ["case-converter", "sort-lines"],
    keywords: ["word counter", "character counter", "word count tool"],
  },
  {
    slug: "case-converter",
    name: "Case Converter",
    shortDescription: "Convert text between camelCase, snake_case, Title Case and more.",
    longDescription: "Convert text between camelCase, PascalCase, snake_case, kebab-case, UPPER_CASE, lower case and Title Case instantly.",
    metaDescription: "Free case converter. Convert text between camelCase, PascalCase, snake_case, kebab-case, UPPER_CASE and more.",
    category: "text", isPopular: true, isImplemented: true, isFeatured: true,
    aliases: ["text case converter", "camelcase converter", "snake case converter"],
    relatedSlugs: ["slug-generator", "word-counter"],
    keywords: ["case converter", "camelcase converter", "snake case to camel case"],
  },
  {
    slug: "slug-generator",
    name: "Slug Generator",
    shortDescription: "Convert text to a URL-friendly slug.",
    longDescription: "Turn any text into a clean, URL-safe slug by lowercasing, removing special characters and replacing spaces with hyphens.",
    metaDescription: "Free slug generator. Convert text to URL-friendly slugs for web pages, blog posts and APIs.",
    category: "text", isImplemented: true,
    aliases: ["url slug", "slug converter", "permalink generator"],
    relatedSlugs: ["case-converter", "url-encode-decode"],
    keywords: ["slug generator", "url slug generator", "text to slug"],
  },
  {
    slug: "sort-lines",
    name: "Sort Lines",
    shortDescription: "Sort lines alphabetically, numerically or by length.",
    longDescription: "Sort lines of text alphabetically (A-Z or Z-A), numerically, or by line length. Optionally case-insensitive.",
    metaDescription: "Sort lines of text online — alphabetically, numerically or by length. Free, instant, runs in your browser.",
    category: "text", isImplemented: true,
    aliases: ["line sorter", "alphabetize lines", "sort text lines"],
    relatedSlugs: ["remove-duplicates", "remove-empty-lines"],
    keywords: ["sort lines", "line sorter", "alphabetize text"],
  },
  {
    slug: "remove-duplicates",
    name: "Remove Duplicate Lines",
    shortDescription: "Remove duplicate lines from text, keeping unique lines only.",
    longDescription: "Paste text and remove all duplicate lines, keeping only the first occurrence of each line. Optionally case-insensitive.",
    metaDescription: "Remove duplicate lines from text online. Keep unique lines and eliminate repetition. Free, runs in your browser.",
    category: "text", isImplemented: true,
    aliases: ["deduplicate lines", "unique lines", "remove duplicates"],
    relatedSlugs: ["sort-lines", "remove-empty-lines"],
    keywords: ["remove duplicate lines", "deduplicate text", "unique lines tool"],
  },
  {
    slug: "remove-empty-lines",
    name: "Remove Empty Lines",
    shortDescription: "Strip blank lines from text instantly.",
    longDescription: "Remove all empty or whitespace-only lines from a block of text, cleaning it up for further processing.",
    metaDescription: "Remove empty lines from text online. Strip blank lines instantly. Free, runs in your browser.",
    category: "text", isImplemented: true,
    aliases: ["strip blank lines", "clean text", "remove blank lines"],
    relatedSlugs: ["sort-lines", "remove-duplicates"],
    keywords: ["remove empty lines", "remove blank lines", "strip whitespace lines"],
  },
  {
    slug: "markdown-preview",
    name: "Markdown Preview",
    shortDescription: "Live-preview Markdown as rendered HTML.",
    longDescription: "Write or paste Markdown on the left and see the rendered HTML preview on the right in real time. Supports GitHub Flavored Markdown.",
    metaDescription: "Free online Markdown editor and preview. See rendered HTML alongside your Markdown in real time. Supports GFM.",
    category: "text", isPopular: true, isImplemented: true, isFeatured: true,
    aliases: ["markdown editor", "markdown renderer", "markdown to html"],
    relatedSlugs: ["html-formatter", "word-counter"],
    keywords: ["markdown preview", "markdown editor", "markdown renderer online"],
  },

  // ═══════════════════════════════ HASH ══════════════════════════════════════

  {
    slug: "hash-generator",
    name: "Hash Generator",
    shortDescription: "Generate MD5, SHA-1, SHA-256 and SHA-512 hashes.",
    longDescription: "Calculate cryptographic hashes for any text using MD5, SHA-1, SHA-256 and SHA-512 algorithms. All computation happens locally in your browser.",
    metaDescription: "Free hash generator. Calculate MD5, SHA-1, SHA-256 and SHA-512 hashes for any text. Runs in your browser.",
    category: "hash", isPopular: true, isImplemented: true, isFeatured: true,
    aliases: ["md5 generator", "sha256 generator", "checksum calculator"],
    relatedSlugs: ["base64-encode-decode", "hex-encode-decode"],
    keywords: ["hash generator", "md5 generator", "sha256 generator", "sha512 hash"],
    faqs: [{ question: "Is my data sent to a server?", answer: "No. All hashing is done client-side using the Web Crypto API and a pure-JS MD5 implementation." }],
  },

  // ═══════════════════════════════ GENERATORS ════════════════════════════════

  {
    slug: "uuid-generator",
    name: "UUID Generator",
    shortDescription: "Generate random v4 UUIDs in bulk.",
    longDescription: "Generate one or many cryptographically random version-4 UUIDs, with optional uppercase and hyphen formatting.",
    metaDescription: "Free online UUID generator. Generate random v4 UUIDs in bulk, instantly, in your browser.",
    category: "generators", isPopular: true, isImplemented: true,
    aliases: ["guid generator", "uuid v4", "random uuid"],
    relatedSlugs: ["nanoid-generator", "random-password-generator"],
    keywords: ["uuid generator", "guid generator", "random uuid online"],
    faqs: [{ question: "Are these UUIDs cryptographically random?", answer: "Yes — they use the browser's crypto.randomUUID() API." }],
  },
  {
    slug: "nanoid-generator",
    name: "NanoID Generator",
    shortDescription: "Generate compact, URL-safe unique IDs.",
    longDescription: "Generate NanoIDs — short, URL-safe, unique string identifiers. Configurable length and character set.",
    metaDescription: "Free NanoID generator. Generate compact, URL-safe unique IDs with configurable length. Runs in your browser.",
    category: "generators", isImplemented: true,
    aliases: ["nano id", "short id generator", "unique id generator"],
    relatedSlugs: ["uuid-generator", "random-password-generator"],
    keywords: ["nanoid generator", "nano id", "short unique id"],
  },
  {
    slug: "random-password-generator",
    name: "Password Generator",
    shortDescription: "Generate strong, random passwords instantly.",
    longDescription: "Generate strong random passwords with configurable length and character sets (lowercase, uppercase, digits, symbols).",
    metaDescription: "Free random password generator. Create strong, secure passwords with configurable complexity. Runs in your browser.",
    category: "generators", isPopular: true, isImplemented: true,
    aliases: ["secure password generator", "strong password", "random password"],
    relatedSlugs: ["uuid-generator", "random-string-generator"],
    keywords: ["password generator", "random password", "strong password generator"],
  },
  {
    slug: "random-string-generator",
    name: "Random String Generator",
    shortDescription: "Generate random strings with custom character sets.",
    longDescription: "Generate random strings of any length with a fully customizable character set — letters, digits, symbols or your own characters.",
    metaDescription: "Free random string generator. Generate random strings with custom length and character sets. Runs in your browser.",
    category: "generators", isImplemented: false,
    relatedSlugs: ["random-password-generator", "uuid-generator"],
    keywords: ["random string generator", "random text generator"],
  },
  {
    slug: "lorem-ipsum-generator",
    name: "Lorem Ipsum Generator",
    shortDescription: "Generate Lorem Ipsum placeholder text in any amount.",
    longDescription: "Generate Lorem Ipsum placeholder text by words, sentences or paragraphs. Classic Lorem Ipsum or randomized variants.",
    metaDescription: "Free Lorem Ipsum generator. Generate placeholder text by word, sentence or paragraph count. Instant.",
    category: "generators", isImplemented: true,
    aliases: ["placeholder text", "dummy text generator", "lorem ipsum"],
    relatedSlugs: ["fake-test-data-generator", "word-counter"],
    keywords: ["lorem ipsum generator", "placeholder text", "dummy text"],
  },
  {
    slug: "random-color-generator",
    name: "Random Color Generator",
    shortDescription: "Generate random colors in HEX, RGB and HSL.",
    longDescription: "Generate random colors in HEX, RGB and HSL formats. Generate palettes, lock specific colors and copy values instantly.",
    metaDescription: "Free random color generator. Generate colors in HEX, RGB and HSL. Generate palettes and copy values.",
    category: "generators", isImplemented: true,
    aliases: ["color picker", "color palette generator", "hex color generator"],
    relatedSlugs: ["uuid-generator"],
    keywords: ["random color generator", "color generator", "hex color picker"],
  },
  {
    slug: "fake-test-data-generator",
    name: "Fake Data Generator",
    shortDescription: "Generate realistic fake names, emails and addresses.",
    longDescription: "Generate batches of realistic-looking fake data — names, emails, addresses, phone numbers — for populating test environments.",
    metaDescription: "Free fake test data generator. Generate realistic fake names, emails, addresses and more for testing.",
    category: "generators", isPopular: true, isImplemented: true,
    aliases: ["mock data generator", "test data generator", "fake user generator"],
    relatedSlugs: ["uuid-generator", "api-request-builder"],
    keywords: ["fake data generator", "test data generator", "mock data generator"],
  },

  // ═══════════════════════════════ DATE & TIME ════════════════════════════════

  {
    slug: "timestamp-converter",
    name: "Unix Timestamp Converter",
    shortDescription: "Convert between Unix timestamps and human-readable dates.",
    longDescription: "Convert Unix timestamps (seconds or milliseconds) to human-readable dates and back, with timezone support.",
    metaDescription: "Free online Unix timestamp converter. Convert epoch time to human-readable dates and back, instantly.",
    category: "datetime", isPopular: true, isImplemented: true,
    aliases: ["epoch converter", "unix time converter", "timestamp to date"],
    relatedSlugs: ["date-difference", "age-calculator"],
    keywords: ["unix timestamp converter", "epoch converter", "timestamp to date"],
    faqs: [{ question: "Seconds or milliseconds?", answer: "The tool auto-detects based on digit count (10 digits ≈ seconds, 13 digits ≈ milliseconds)." }],
  },
  {
    slug: "date-difference",
    name: "Date Difference Calculator",
    shortDescription: "Calculate the difference between two dates.",
    longDescription: "Calculate the exact difference between two dates in years, months, weeks, days, hours, minutes and seconds.",
    metaDescription: "Free date difference calculator. Calculate the exact difference between two dates in years, months, days and more.",
    category: "datetime", isImplemented: true,
    aliases: ["days between dates", "date calculator", "date diff"],
    relatedSlugs: ["timestamp-converter", "age-calculator"],
    keywords: ["date difference calculator", "days between dates", "date diff tool"],
  },
  {
    slug: "age-calculator",
    name: "Age Calculator",
    shortDescription: "Calculate exact age from a birth date.",
    longDescription: "Calculate someone's exact age in years, months and days from their date of birth. Also shows the next birthday countdown.",
    metaDescription: "Free age calculator. Calculate exact age from any birth date. Shows years, months, days and next birthday.",
    category: "datetime", isImplemented: true,
    aliases: ["birthday calculator", "how old am i", "age finder"],
    relatedSlugs: ["date-difference", "timestamp-converter"],
    keywords: ["age calculator", "birthday calculator", "how old am i"],
  },
  {
    slug: "cron-expression",
    name: "Cron Expression Parser",
    shortDescription: "Parse and explain cron expressions in plain English.",
    longDescription: "Paste a cron expression to see it explained in plain English with the next execution times. Also build expressions visually.",
    metaDescription: "Free cron expression parser and generator. Understand cron syntax, see next run times and build expressions visually.",
    category: "datetime", isImplemented: true,
    aliases: ["cron parser", "cron generator", "cron builder", "cron job"],
    relatedSlugs: ["timestamp-converter"],
    keywords: ["cron expression", "cron parser", "cron generator", "cron job builder"],
  },

  // ═══════════════════════════════ WEB ════════════════════════════════════════

  {
    slug: "qr-code-generator",
    name: "QR Code Generator",
    shortDescription: "Generate QR codes for URLs, text and more.",
    longDescription: "Generate QR codes for any text, URL, email or phone number. Download as PNG or SVG.",
    metaDescription: "Free QR code generator. Create QR codes for URLs, text, email and more. Download as PNG or SVG.",
    category: "web", isPopular: true, isImplemented: true, isFeatured: true,
    aliases: ["qr generator", "qr code maker", "qrcode generator"],
    relatedSlugs: ["url-encode-decode", "header-inspector"],
    keywords: ["qr code generator", "qr generator", "create qr code"],
  },
  {
    slug: "header-inspector",
    name: "HTTP Header Inspector",
    shortDescription: "Inspect HTTP response headers for any URL.",
    longDescription: "Check the HTTP response headers returned by any public URL — useful for debugging caching, CORS and security headers.",
    metaDescription: "Free HTTP header inspector. Check response headers for any URL — caching, CORS, security headers and more.",
    category: "web", isImplemented: true,
    aliases: ["http headers", "response headers", "check headers"],
    relatedSlugs: ["curl-generator", "url-encode-decode"],
    keywords: ["http header checker", "response header inspector"],
  },
  {
    slug: "url-parser",
    name: "URL Parser",
    shortDescription: "Parse URLs into protocol, host, path, query and fragment.",
    longDescription: "Break down any URL into its component parts: protocol, hostname, port, path, query parameters and fragment.",
    metaDescription: "Free URL parser. Break down URLs into protocol, host, path, query params and fragment. Runs in your browser.",
    category: "web", isImplemented: false,
    aliases: ["url analyzer", "url breakdown", "parse url"],
    relatedSlugs: ["url-encode-decode", "header-inspector"],
    keywords: ["url parser", "url analyzer", "parse url online"],
  },
  {
    slug: "http-status-codes",
    name: "HTTP Status Codes",
    shortDescription: "Look up HTTP status codes and their meanings.",
    longDescription: "Reference guide for all HTTP status codes — 1xx, 2xx, 3xx, 4xx, 5xx — with descriptions and usage examples.",
    metaDescription: "HTTP status code reference. Look up any HTTP status code and learn what it means. Complete guide.",
    category: "web", isImplemented: false,
    aliases: ["http codes", "status codes", "http error codes"],
    relatedSlugs: ["header-inspector", "rest-request-builder"],
    keywords: ["http status codes", "http error codes", "http 404 meaning"],
  },

  // ═══════════════════════════════ DATA / EXISTING ════════════════════════════

  {
    slug: "fake-test-data-generator-alias", // merged above
    name: "Fake Test Data Generator",
    shortDescription: "Generate realistic fake data for testing.",
    longDescription: "Generate realistic fake data for testing.",
    metaDescription: "Generate fake test data.",
    category: "data", isImplemented: false,
    keywords: ["fake data"],
  },

  // ═══════════════════════════════ QA ═════════════════════════════════════════

  {
    slug: "regex-tester",
    name: "Regex Tester",
    shortDescription: "Test regular expressions with live match highlighting.",
    longDescription: "Write a regex pattern and test it against a string in real time. See all matches highlighted with group details.",
    metaDescription: "Free regex tester. Test regular expressions live with match highlighting and capture group details.",
    category: "qa", isPopular: true, isImplemented: true, isFeatured: true,
    aliases: ["regular expression tester", "regex checker", "regex debugger"],
    relatedSlugs: ["xpath-generator", "css-selector-generator"],
    keywords: ["regex tester", "regular expression tester", "regex checker online"],
  },
  {
    slug: "xpath-generator",
    name: "XPath Generator",
    shortDescription: "Generate XPath selectors from HTML.",
    longDescription: "Paste an HTML snippet and generate robust XPath selectors for test automation.",
    metaDescription: "Free XPath generator for test automation. Generate XPath selectors from HTML instantly.",
    category: "qa", isImplemented: true,
    aliases: ["xpath finder", "selenium xpath", "xpath builder"],
    relatedSlugs: ["css-selector-generator", "api-request-builder"],
    keywords: ["xpath generator", "xpath finder", "selenium xpath tool"],
  },
  {
    slug: "css-selector-generator",
    name: "CSS Selector Generator",
    shortDescription: "Generate CSS selectors from HTML for automation.",
    longDescription: "Paste an HTML snippet and generate precise CSS selectors for use in test automation or scraping.",
    metaDescription: "Free CSS selector generator. Generate precise CSS selectors from HTML for test automation.",
    category: "qa", isImplemented: true,
    aliases: ["css selector finder", "css path", "playwright selector"],
    relatedSlugs: ["xpath-generator", "html-formatter"],
    keywords: ["css selector generator", "css selector finder"],
  },
  {
    slug: "api-request-builder",
    name: "API Request Builder",
    shortDescription: "Build and send HTTP requests with a visual UI.",
    longDescription: "Compose headers, params and body for an HTTP request and preview exactly what will be sent.",
    metaDescription: "Free online API request builder. Compose and preview HTTP requests without leaving your browser.",
    category: "qa", isImplemented: true,
    aliases: ["http client", "rest client", "api tester"],
    relatedSlugs: ["curl-generator", "header-inspector", "rest-request-builder"],
    keywords: ["api request builder", "http request tool", "online rest client"],
  },
  {
    slug: "test-case-generator",
    name: "Test Case Generator",
    shortDescription: "Generate test cases from feature descriptions (AI-powered, coming soon).",
    longDescription: "Describe a feature or requirement and get structured test cases generated automatically.",
    metaDescription: "AI-powered test case generator. Generate test cases from feature descriptions. Coming soon.",
    category: "qa", isImplemented: false, isPremiumAI: true,
    keywords: ["test case generator", "qa automation", "test case ai"],
  },
  {
    slug: "boundary-value-generator",
    name: "Boundary Value Generator",
    shortDescription: "Generate boundary value test cases for input validation.",
    longDescription: "Enter a range and get boundary value analysis test cases: minimum, maximum, just inside and just outside values.",
    metaDescription: "Free boundary value analysis tool. Generate test cases for input validation boundaries.",
    category: "qa", isImplemented: false,
    keywords: ["boundary value analysis", "bva testing", "input boundary testing"],
  },
  {
    slug: "pairwise-testing",
    name: "Pairwise Testing Generator",
    shortDescription: "Generate pairwise (all-pairs) test combinations.",
    longDescription: "Enter your test parameters and values to generate an optimal pairwise test suite that covers all parameter pairs.",
    metaDescription: "Free pairwise testing generator. Generate all-pairs test combinations to maximize coverage with fewer tests.",
    category: "qa", isImplemented: false,
    keywords: ["pairwise testing", "all pairs testing", "combinatorial testing"],
  },

  // ═══════════════════════════════ API ════════════════════════════════════════

  {
    slug: "curl-generator",
    name: "Curl Generator",
    shortDescription: "Build curl commands from a visual request builder.",
    longDescription: "Compose a request visually and get a ready-to-paste curl command.",
    metaDescription: "Free curl command generator. Build curl commands visually instead of memorizing flags.",
    category: "api", isImplemented: true,
    aliases: ["curl builder", "curl command builder"],
    relatedSlugs: ["api-request-builder", "header-inspector"],
    keywords: ["curl generator", "curl command builder"],
  },
  {
    slug: "rest-request-builder",
    name: "REST Request Builder",
    shortDescription: "Compose and inspect REST API requests.",
    longDescription: "A lightweight REST client for quickly composing and inspecting API requests in the browser.",
    metaDescription: "Free online REST request builder. Compose and test REST API requests in your browser.",
    category: "api", isImplemented: true,
    aliases: ["rest client", "api client", "http tester"],
    relatedSlugs: ["api-request-builder", "curl-generator"],
    keywords: ["rest client online", "rest request builder", "api tester"],
  },
];

// Remove the duplicate/alias entry
const TOOL_INDEX = new Map<string, Tool>();
tools.forEach((t) => { if (!TOOL_INDEX.has(t.slug)) TOOL_INDEX.set(t.slug, t); });
const dedupedTools = Array.from(TOOL_INDEX.values()).filter(
  (t) => t.slug !== "fake-test-data-generator-alias"
);

export const allTools: Tool[] = dedupedTools;

export function getToolBySlug(slug: string): Tool | undefined {
  return allTools.find((t) => t.slug === slug);
}

export function getToolsByCategory(category: ToolCategory): Tool[] {
  return allTools.filter((t) => t.category === category);
}

export function getPopularTools(): Tool[] {
  return allTools.filter((t) => t.isPopular);
}

export function getFeaturedTools(): Tool[] {
  return allTools.filter((t) => t.isFeatured);
}

export function getImplementedTools(): Tool[] {
  return allTools.filter((t) => t.isImplemented);
}

export function getCategoryBySlug(slug: string): CategoryMeta | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getRelatedTools(tool: Tool): Tool[] {
  if (!tool.relatedSlugs) return [];
  return tool.relatedSlugs
    .map((s) => getToolBySlug(s))
    .filter((t): t is Tool => Boolean(t));
}

/** Full-text search across name, shortDescription, aliases and keywords. */
const RU_CATEGORY_NAMES: Record<string, string> = {
  formatting:  "форматирование форматтер",
  encoding:    "кодирование декодирование шифрование",
  text:        "текст текстовые",
  hash:        "хэш хэши шифрование контрольная сумма",
  generators:  "генератор генераторы",
  datetime:    "дата время время дата",
  web:         "веб сеть интернет",
  data:        "данные",
  qa:          "тестирование автоматизация",
  api:         "апи запросы",
};

export function searchTools(query: string, locale: "en" | "ru" = "en"): Tool[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  let ruContent: Record<string, { name?: string; shortDescription?: string; keywords?: string[] }> = {};
  if (locale === "ru") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { ruToolContent } = require("./i18n/ru-content");
      ruContent = ruToolContent;
    } catch {}
  }

  const scored: { tool: Tool; score: number }[] = [];

  for (const t of allTools) {
    const ru = ruContent[t.slug] ?? {};
    const name    = (locale === "ru" && ru.name ? ru.name : t.name).toLowerCase();
    const desc    = (locale === "ru" && ru.shortDescription ? ru.shortDescription : t.shortDescription).toLowerCase();
    const aliases  = (t.aliases ?? []).map((a) => a.toLowerCase());
    const keywords = [
      ...(t.keywords ?? []),
      ...(ru.keywords ?? []),
      locale === "ru" ? (RU_CATEGORY_NAMES[t.category] ?? "") : t.category,
    ].map((k) => k.toLowerCase());

    let score = 0;

    // Exact name match → highest
    if (name === q)               score += 100;
    else if (name.startsWith(q))  score += 60;
    else if (name.includes(q))    score += 40;

    // Alias match
    if (aliases.some((a) => a === q))              score += 50;
    else if (aliases.some((a) => a.startsWith(q))) score += 30;
    else if (aliases.some((a) => a.includes(q)))   score += 20;

    // Keyword match
    if (keywords.some((k) => k === q))             score += 30;
    else if (keywords.some((k) => k.startsWith(q))) score += 18;
    else if (keywords.some((k) => k.includes(q)))  score += 12;

    // Description match
    if (desc.includes(q)) score += 8;

    // Boosts
    if (t.isPopular  && score > 0) score += 10;
    if (t.isFeatured && score > 0) score += 5;
    if (!t.isImplemented)          score  = Math.max(0, score - 8);

    if (score > 0) scored.push({ tool: t, score });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .map((s) => s.tool)
    .slice(0, 12);
}


// allTools is the canonical export; tools is a const above — no re-export needed.

/** AI tools shown on the homepage Coming Soon section */
export const aiTools: { name: string; description: string }[] = [
  { name: "Explain JSON", description: "Get a plain-English walkthrough of any JSON structure." },
  { name: "Generate SQL Query", description: "Describe what you need in plain English, get a SQL query." },
  { name: "Generate Test Cases", description: "Generate QA test cases from an API spec or user story." },
  { name: "Explain API Response", description: "Understand any API response, including error codes." },
  { name: "Generate Regex", description: "Describe a pattern in plain English, get a working regex." },
  { name: "JSON to TypeScript", description: "Convert any JSON sample into TypeScript interfaces." },
];
