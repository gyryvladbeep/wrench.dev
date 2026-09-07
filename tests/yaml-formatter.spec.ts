import { test, expect } from "@playwright/test";
import { YamlFormatterPage } from "./pages/YamlFormatterPage";

// Точная копия parseYaml()/objToYaml() из components/tools/YamlFormatterTool.tsx
// (после фикса бага потери элементов списка — см. коммент в самом источнике).
// Это САМОДЕЛЬНЫЙ мини-парсер YAML (не спецификация), поэтому единственный
// надёжный способ проверить "ожидаемое" — воспроизвести ровно ту же логику.
function coerceScalar(val: string): unknown {
  const trimmed = val.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null" || trimmed === "~") return null;
  if (trimmed !== "" && !isNaN(Number(trimmed))) return Number(trimmed);
  return trimmed.replace(/^["']|["']$/g, "");
}

function parseYaml(text: string): unknown {
  const lines = text.split("\n");
  const root: Record<string, unknown> = {};
  type Frame = {
    obj: Record<string, unknown>;
    indent: number;
    parent?: Record<string, unknown>;
    key?: string;
    arr?: unknown[];
  };
  const stack: Frame[] = [{ obj: root, indent: -1 }];

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const indent = line.search(/\S/);
    const content = line.trim();

    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) stack.pop();
    const top = stack[stack.length - 1];

    if (content === "-" || content.startsWith("- ")) {
      const itemText = content === "-" ? "" : content.slice(2).trim();
      if (!top.arr) {
        const arr: unknown[] = [];
        top.arr = arr;
        if (top.parent && top.key !== undefined) top.parent[top.key] = arr;
      }
      top.arr.push(coerceScalar(itemText));
      continue;
    }

    const current = top.obj;
    if (content.includes(":")) {
      const colonIdx = content.indexOf(":");
      const key = content.slice(0, colonIdx).trim();
      const val = content.slice(colonIdx + 1).trim();

      if (!val) {
        const child: Record<string, unknown> = {};
        current[key] = child;
        stack.push({ obj: child, indent, parent: current, key });
      } else {
        current[key] = coerceScalar(val);
      }
    }
  }
  return root;
}

function objToYaml(obj: unknown, indent = 0): string {
  const pad = "  ".repeat(indent);
  if (obj === null) return "null";
  if (typeof obj === "boolean") return obj.toString();
  if (typeof obj === "number") return obj.toString();
  if (typeof obj === "string") {
    if (obj.includes(":") || obj.includes("#") || obj.includes("'") || obj.includes('"')) return `"${obj.replace(/"/g, '\\"')}"`;
    return obj;
  }
  if (Array.isArray(obj)) {
    if (obj.length === 0) return "[]";
    return obj.map((v) => `${pad}- ${objToYaml(v, indent + 1)}`).join("\n");
  }
  if (typeof obj === "object") {
    const entries = Object.entries(obj as Record<string, unknown>);
    if (entries.length === 0) return "{}";
    return entries.map(([k, v]) => {
      if (typeof v === "object" && v !== null && !Array.isArray(v)) {
        return `${pad}${k}:\n${objToYaml(v, indent + 1)}`;
      }
      if (Array.isArray(v)) {
        return `${pad}${k}:\n${objToYaml(v, indent + 1)}`;
      }
      return `${pad}${k}: ${objToYaml(v, 0)}`;
    }).join("\n");
  }
  return String(obj);
}

const SAMPLE = `# Server configuration
server:
  host: localhost
  port: 3000
  debug: true

database:
  url: postgres://localhost/myapp
  pool_size: 10
  timeout: 30

features:
  auth: true
  analytics: false
  rate_limit: 100`;

function computeStats(input: string) {
  const lines = input.split("\n").filter((l) => l.trim() && !l.trim().startsWith("#")).length;
  const keys = (input.match(/^\s*\w+:/gm) ?? []).length;
  return { lines, keys };
}

test.describe("YAML Formatter", () => {
  let tool: YamlFormatterPage;

  test.beforeEach(async ({ page }) => {
    tool = new YamlFormatterPage(page);
    await tool.goto();
  });

  test("по умолчанию режим Format переформатирует пример YAML", async () => {
    const expected = objToYaml(parseYaml(SAMPLE));
    await expect(tool.output).toHaveValue(expected);

    const stats = computeStats(SAMPLE);
    await expect(tool.statsText).toHaveText(`${stats.lines} lines · ${stats.keys} keys`);
  });

  test("режим To JSON конвертирует пример в JSON того же дерева", async () => {
    await tool.jsonModeButton.click();

    const expected = JSON.stringify(parseYaml(SAMPLE), null, 2);
    await expect(tool.output).toHaveValue(expected);
  });

  test("плоский YAML с разными типами значений (bool/number/string) парсится корректно", async () => {
    const flat = "name: Ada\nage: 30\nactive: true\nretired: false\nnote: hello world";
    await tool.setInput(flat);
    await tool.jsonModeButton.click();

    const expected = JSON.stringify(parseYaml(flat), null, 2);
    await expect(tool.output).toHaveValue(expected);
    // Явно убеждаемся, что типы распознаны (не всё превратилось в строки).
    expect(expected).toContain('"age": 30');
    expect(expected).toContain('"active": true');
    expect(expected).toContain('"retired": false');
  });

  test("пустой ввод — плейсхолдер вместо результата", async () => {
    await tool.setInput("");
    await expect(tool.output).toBeHidden();
  });

  test("РЕГРЕСС на исправленный баг: элементы YAML-списка ('- item') теперь корректно сохраняются", async () => {
    // Раньше parseYaml() для любой строки "- ..." просто перезаписывал
    // current["_list"] новым пустым массивом, теряя значения "a"/"b" —
    // items превращался в {_list: []}. После фикса items — настоящий
    // массив ["a","b"].
    const withList = "items:\n  - a\n  - b";
    await tool.setInput(withList);
    await tool.jsonModeButton.click();

    const expected = JSON.stringify(parseYaml(withList), null, 2);
    await expect(tool.output).toHaveValue(expected);
    await expect(tool.output).toHaveValue(JSON.stringify({ items: ["a", "b"] }, null, 2));
  });

  test("список с типизированными значениями (числа/булевы) — каждый элемент коэрцится как скаляр", async () => {
    const withTypedList = "ports:\n  - 80\n  - 443\nflags:\n  - true\n  - false";
    await tool.setInput(withTypedList);
    await tool.jsonModeButton.click();

    const expected = JSON.stringify(parseYaml(withTypedList), null, 2);
    await expect(tool.output).toHaveValue(expected);
    await expect(tool.output).toHaveValue(
      JSON.stringify({ ports: [80, 443], flags: [true, false] }, null, 2)
    );
  });

  test("список внутри режима Format сериализуется обратно через '- ' с сохранением значений", async () => {
    const withList = "items:\n  - a\n  - b";
    await tool.setInput(withList);

    const expected = objToYaml(parseYaml(withList));
    await expect(tool.output).toHaveValue(expected);
    await expect(tool.output).toHaveValue(/items:\n {2}- a\n {2}- b/);
  });
});
