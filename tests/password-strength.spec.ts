import { test, expect } from "@playwright/test";
import { PasswordStrengthPage } from "./pages/PasswordStrengthPage";

// Точная копия analyzePassword() из components/tools/PasswordStrengthTool.tsx
// (только английские подписи, isRu=false — страница открывается на /en/).
interface Analysis {
  score: number;
  label: string;
  entropy: number;
  checks: { label: string; pass: boolean }[];
  suggestions: string[];
  crackTime: string;
}

function analyzePassword(pwd: string): Analysis {
  const checks = [
    { label: "At least 8 characters",        pass: pwd.length >= 8 },
    { label: "At least 12 characters",       pass: pwd.length >= 12 },
    { label: "Lowercase letters",            pass: /[a-z]/.test(pwd) },
    { label: "Uppercase letters",            pass: /[A-Z]/.test(pwd) },
    { label: "Numbers",                      pass: /[0-9]/.test(pwd) },
    { label: "Special characters (!@#$…)",   pass: /[^a-zA-Z0-9]/.test(pwd) },
    { label: "No repeated patterns",         pass: !/(.)\1{2,}/.test(pwd) },
    { label: "No common words",              pass: !/password|qwerty|123456|admin|login/i.test(pwd) },
  ];

  let charsetSize = 0;
  if (/[a-z]/.test(pwd)) charsetSize += 26;
  if (/[A-Z]/.test(pwd)) charsetSize += 26;
  if (/[0-9]/.test(pwd)) charsetSize += 10;
  if (/[^a-zA-Z0-9]/.test(pwd)) charsetSize += 32;
  const entropy = charsetSize > 0 ? Math.log2(Math.pow(charsetSize, pwd.length)) : 0;

  const passed = checks.filter((c) => c.pass).length;
  const score = Math.min(4, Math.floor(passed / 2));
  const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];

  const combinations = Math.pow(charsetSize || 1, pwd.length);
  const guessesPerSec = 1e10;
  const seconds = combinations / guessesPerSec;
  const crackTime = seconds < 1 ? "instantly"
    : seconds < 60 ? `${Math.round(seconds)}s`
    : seconds < 3600 ? `${Math.round(seconds / 60)}m`
    : seconds < 86400 ? `${Math.round(seconds / 3600)}h`
    : seconds < 31536000 ? `${Math.round(seconds / 86400)}d`
    : seconds < 3153600000 ? `${Math.round(seconds / 31536000)}y`
    : "centuries";

  const suggestions: string[] = [];
  if (!checks[0].pass) suggestions.push("Use at least 8 characters");
  if (!checks[3].pass) suggestions.push("Add uppercase letters");
  if (!checks[4].pass) suggestions.push("Add numbers");
  if (!checks[5].pass) suggestions.push("Add special characters");
  if (!checks[1].pass && checks[0].pass) suggestions.push("Increase length to 12+ characters");

  return { score, label: labels[score], entropy: Math.round(entropy), checks, suggestions, crackTime };
}

test.describe("Password Strength", () => {
  let tool: PasswordStrengthPage;

  test.beforeEach(async ({ page }) => {
    tool = new PasswordStrengthPage(page);
    await tool.goto();
  });

  test("пустой пароль — блок анализа не показывается", async () => {
    await expect(tool.strengthLabel).toBeHidden();
    await expect(tool.entropyText).toBeHidden();
  });

  test("слабый пароль 'abc' — верный score, энтропия и предложения", async () => {
    await tool.setPassword("abc");
    const expected = analyzePassword("abc");

    await expect(tool.strengthLabel).toHaveText(expected.label);
    await expect(tool.entropyText).toContainText(`${expected.entropy} bits entropy`);
    await expect(tool.crackTimeValue).toHaveText(expected.crackTime);
    for (const s of expected.suggestions) {
      await expect(tool.suggestionText(s)).toBeVisible();
    }
  });

  test("'Password123' проваливает проверку 'No common words' несмотря на длину и разнообразие символов", async () => {
    await tool.setPassword("Password123");
    const expected = analyzePassword("Password123");

    await expect(tool.checkIcon("No common words")).toHaveText("○");
    await expect(tool.checkIcon("Uppercase letters")).toHaveText("✓");
    await expect(tool.checkIcon("Numbers")).toHaveText("✓");
    await expect(tool.strengthLabel).toHaveText(expected.label);
  });

  test("сильный пароль без предложений и со всеми пройденными проверками", async () => {
    const strong = "Tr0ub4dor&3XyZ99!";
    await tool.setPassword(strong);
    const expected = analyzePassword(strong);

    await expect(tool.strengthLabel).toHaveText(expected.label);
    await expect(tool.strengthLabel).toHaveText("Strong");
    await expect(tool.entropyText).toContainText(`${expected.entropy} bits entropy`);
    await expect(tool.suggestionsHeading).toBeHidden();
  });

  test("кнопка Show/Hide переключает видимость введённого пароля", async () => {
    await tool.setPassword("secret123");
    await expect(tool.passwordInput).toHaveAttribute("type", "password");

    await tool.toggleShowButton.click();
    await expect(tool.passwordInput).toHaveAttribute("type", "text");

    await tool.toggleShowButton.click();
    await expect(tool.passwordInput).toHaveAttribute("type", "password");
  });
});
