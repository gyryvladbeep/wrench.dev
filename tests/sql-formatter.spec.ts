import { test, expect } from "@playwright/test";
import { SqlFormatterPage } from "./pages/SqlFormatterPage";

// Точная копия formatSql()/minifySql() из components/tools/SqlFormatterTool.tsx —
// самодельный форматтер (не спецификация SQL), поэтому единственный надёжный
// способ проверить "ожидаемое" — воспроизвести ровно ту же логику.
const KEYWORDS = [
  "SELECT", "FROM", "WHERE", "AND", "OR", "NOT", "IN", "EXISTS",
  "INSERT", "INTO", "VALUES", "UPDATE", "SET", "DELETE",
  "CREATE", "TABLE", "ALTER", "DROP", "INDEX", "VIEW",
  "JOIN", "LEFT", "RIGHT", "INNER", "OUTER", "FULL", "CROSS",
  "ON", "AS", "DISTINCT", "ORDER", "BY", "GROUP", "HAVING",
  "LIMIT", "OFFSET", "UNION", "ALL", "EXCEPT", "INTERSECT",
  "CASE", "WHEN", "THEN", "ELSE", "END",
  "PRIMARY", "KEY", "FOREIGN", "REFERENCES", "UNIQUE", "NULL",
  "DEFAULT", "NOT NULL", "AUTO_INCREMENT", "AUTOINCREMENT",
  "BEGIN", "COMMIT", "ROLLBACK", "TRANSACTION",
  "RETURNING", "WITH", "CTE", "RECURSIVE",
];

const BREAK_BEFORE = new Set([
  "SELECT", "FROM", "WHERE", "AND", "OR", "JOIN", "LEFT", "RIGHT",
  "INNER", "OUTER", "FULL", "CROSS", "ON", "ORDER", "GROUP",
  "HAVING", "LIMIT", "OFFSET", "UNION", "EXCEPT", "INTERSECT",
  "INSERT", "INTO", "VALUES", "UPDATE", "SET", "DELETE",
  "CREATE", "ALTER", "DROP",
]);

function formatSql(sql: string, indent = "  "): string {
  const tokens: string[] = [];
  let i = 0;
  while (i < sql.length) {
    if (sql[i] === "'" || sql[i] === '"' || sql[i] === "`") {
      const q = sql[i];
      let j = i + 1;
      while (j < sql.length && !(sql[j] === q && sql[j - 1] !== "\\")) j++;
      tokens.push(sql.slice(i, j + 1));
      i = j + 1;
    } else if (sql.slice(i, i + 2) === "--") {
      let j = i;
      while (j < sql.length && sql[j] !== "\n") j++;
      tokens.push(sql.slice(i, j));
      i = j;
    } else if (sql.slice(i, i + 2) === "/*") {
      let j = i + 2;
      while (j < sql.length && sql.slice(j, j + 2) !== "*/") j++;
      tokens.push(sql.slice(i, j + 2));
      i = j + 2;
    } else if (/\s/.test(sql[i])) {
      i++;
    } else if (/[(),;]/.test(sql[i])) {
      tokens.push(sql[i]);
      i++;
    } else {
      let j = i;
      while (j < sql.length && !/[\s(),;'"`]/.test(sql[j])) j++;
      tokens.push(sql.slice(i, j));
      i = j;
    }
  }

  const lines: string[] = [];
  let depth = 0;
  let currentLine = "";

  function flush() {
    if (currentLine.trim()) lines.push(indent.repeat(depth) + currentLine.trim());
    currentLine = "";
  }

  for (const token of tokens) {
    const upper = token.toUpperCase();
    const isKeyword = KEYWORDS.includes(upper);

    if (token === "(") {
      currentLine += "(";
      depth++;
    } else if (token === ")") {
      depth = Math.max(0, depth - 1);
      flush();
      currentLine = ")";
    } else if (token === ",") {
      currentLine += ",";
      flush();
    } else if (token === ";") {
      flush();
      lines.push(";");
      lines.push("");
    } else if (isKeyword && BREAK_BEFORE.has(upper)) {
      flush();
      currentLine = token.toUpperCase();
    } else if (isKeyword) {
      currentLine += (currentLine ? " " : "") + token.toUpperCase();
    } else {
      currentLine += (currentLine ? " " : "") + token;
    }
  }
  flush();

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function minifySql(sql: string): string {
  return sql
    .replace(/--[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const SAMPLE = "select u.id, u.name, u.email, o.total from users u left join orders o on u.id = o.user_id where u.active = 1 and o.total > 100 order by o.total desc limit 20;";

test.describe("SQL Formatter", () => {
  let tool: SqlFormatterPage;

  test.beforeEach(async ({ page }) => {
    tool = new SqlFormatterPage(page);
    await tool.goto();
  });

  test("по умолчанию режим Format — вывод соответствует formatSql(SAMPLE)", async () => {
    const expected = formatSql(SAMPLE);
    await expect(tool.output).toHaveValue(expected);
    await expect(tool.output).toHaveValue(/^SELECT/);
  });

  test("режим Minify схлопывает запрос в одну строку без комментариев", async () => {
    await tool.minifyButton.click();
    const expected = minifySql(SAMPLE);
    await expect(tool.output).toHaveValue(expected);
    expect(expected).not.toContain("\n");
  });

  test("пустой ввод — output пустой (не показывает ошибку)", async () => {
    await tool.setInput("");
    await expect(tool.output).toHaveValue("");
  });

  test("SQL-комментарий (--) сохраняется как отдельная строка в Format, но вырезается в Minify", async () => {
    const withComment = "-- get active users\nSELECT * FROM users WHERE active = 1;";
    await tool.setInput(withComment);

    const expectedFormat = formatSql(withComment);
    await expect(tool.output).toHaveValue(expectedFormat);
    expect(expectedFormat).toContain("-- get active users");

    await tool.minifyButton.click();
    const expectedMinify = minifySql(withComment);
    await expect(tool.output).toHaveValue(expectedMinify);
    expect(expectedMinify).not.toContain("--");
  });

  test("точка с запятой внутри строкового литерала не разрывает Minify как разделитель операторов", async () => {
    const withSemicolonInString = "SELECT 'a;b' FROM t;";
    await tool.setInput(withSemicolonInString);
    await tool.minifyButton.click();

    const expected = minifySql(withSemicolonInString);
    await expect(tool.output).toHaveValue(expected);
    await expect(tool.output).toHaveValue(/'a;b'/);
  });

  test("кнопка Download запускает скачивание formatted.sql", async () => {
    const [download] = await Promise.all([
      tool.page.waitForEvent("download"),
      tool.downloadButton.click(),
    ]);
    expect(download.suggestedFilename()).toBe("formatted.sql");
  });
});
