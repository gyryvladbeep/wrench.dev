import { test, expect } from "@playwright/test";
import * as yaml from "js-yaml";
import { JsonToYamlPage } from "./pages/JsonToYamlPage";

const SAMPLE_JSON = `{
  "name": "Ada Lovelace",
  "born": 1815,
  "skills": ["math", "programming"],
  "active": true
}`;

const SAMPLE_YAML = `name: Ada Lovelace
born: 1815
skills:
  - math
  - programming
active: true`;

test.describe("JSON ↔ YAML", () => {
  let tool: JsonToYamlPage;

  test.beforeEach(async ({ page }) => {
    tool = new JsonToYamlPage(page);
    await tool.goto();
  });

  test("по умолчанию JSON → YAML — конвертирует пример через js-yaml с теми же опциями", async () => {
    const expected = yaml.dump(JSON.parse(SAMPLE_JSON), { indent: 2, lineWidth: -1 });
    await expect(tool.output).toHaveValue(expected);
  });

  test("режим YAML → JSON конвертирует пример обратно", async () => {
    await tool.yamlToJsonButton.click();

    const expected = JSON.stringify(yaml.load(SAMPLE_YAML), null, 2);
    await expect(tool.output).toHaveValue(expected);
  });

  test("кнопка Swap переносит результат в поле ввода и переключает режим", async () => {
    const yamlResult = yaml.dump(JSON.parse(SAMPLE_JSON), { indent: 2, lineWidth: -1 });

    await tool.swapButton.click();

    await expect(tool.input).toHaveValue(yamlResult.trim());
    // Теперь режим YAML → JSON: результат — это исходный объект в JSON.
    const expected = JSON.stringify(JSON.parse(SAMPLE_JSON), null, 2);
    await expect(tool.output).toHaveValue(expected);
  });

  test("невалидный JSON в режиме JSON → YAML показывает ошибку", async () => {
    await tool.setInput("{ broken");
    await expect(tool.output).toHaveValue(/^Error: /);
  });

  test("невалидный YAML в режиме YAML → JSON показывает ошибку", async () => {
    await tool.yamlToJsonButton.click();
    await tool.setInput("key: [unclosed");

    await expect(tool.output).toHaveValue(/^Error: /);
  });
});
