export interface WsMockFrame {
  delayMs: number;
  data: string;
}

export interface WsMockOptions {
  /** Шаблон адреса для page.routeWebSocket: строка с glob или регулярка в виде /.../. */
  pattern: string;
  mode: "mock" | "proxy";
  frames: WsMockFrame[];
  /** Через сколько мс после подключения закрыть соединение; 0 - не закрывать. */
  closeAfterMs: number;
  closeCode: number;
  closeReason: string;
}

export const DEFAULT_WS_MOCK: WsMockOptions = {
  pattern: "**/socket.io/**",
  mode: "mock",
  frames: [],
  closeAfterMs: 0,
  closeCode: 1001,
  closeReason: "server restart",
};

/** Строки вида "задержка_мс | кадр". Без задержки считается 0. */
export function parseFrames(text: string): { frames: WsMockFrame[]; errors: string[] } {
  const frames: WsMockFrame[] = [];
  const errors: string[] = [];
  text.split(/\r?\n/).forEach((line, i) => {
    if (!line.trim()) return;
    const m = line.match(/^\s*(\d+)\s*\|\s?([\s\S]*)$/);
    if (m) frames.push({ delayMs: Number(m[1]), data: m[2] });
    else if (/^\s*\d+\s*\|/.test(line)) errors.push(`Line ${i + 1}: empty frame.`);
    else frames.push({ delayMs: 0, data: line });
  });
  return { frames, errors };
}

function patternLiteral(p: string): string {
  const m = p.match(/^\/(.+)\/([a-z]*)$/);
  return m ? `new RegExp(${JSON.stringify(m[1])}, ${JSON.stringify(m[2])})` : JSON.stringify(p);
}

/** Собирает тест Playwright с подменой WebSocket. Нужен Playwright 1.48 или новее. */
export function generateWsMock(o: WsMockOptions): string {
  const lines: string[] = [];
  lines.push(`import { test, expect } from "@playwright/test";`);
  lines.push(``);
  lines.push(`test("realtime: scripted server frames", async ({ page }) => {`);
  lines.push(`  const received: string[] = [];`);
  lines.push(``);
  lines.push(`  await page.routeWebSocket(${patternLiteral(o.pattern)}, (ws) => {`);
  if (o.mode === "proxy") {
    lines.push(`    // Настоящий сервер остаётся: пересылаем всё в обе стороны и добавляем свои кадры.`);
    lines.push(`    const server = ws.connectToServer();`);
    lines.push(`    ws.onMessage((message) => {`);
    lines.push(`      received.push(String(message));`);
    lines.push(`      server.send(message);`);
    lines.push(`    });`);
    lines.push(`    server.onMessage((message) => ws.send(message));`);
  } else {
    lines.push(`    // Настоящий сервер не нужен: страница общается только с этим сценарием.`);
    lines.push(`    ws.onMessage((message) => {`);
    lines.push(`      received.push(String(message));`);
    lines.push(`    });`);
  }
  let at = 0;
  for (const f of o.frames) {
    at += f.delayMs;
    lines.push(`    setTimeout(() => ws.send(${JSON.stringify(f.data)}), ${at});`);
  }
  if (o.closeAfterMs > 0) {
    lines.push(`    setTimeout(() => ws.close({ code: ${Math.floor(o.closeCode)}, reason: ${JSON.stringify(o.closeReason)} }), ${Math.max(at, o.closeAfterMs)});`);
  }
  lines.push(`  });`);
  lines.push(``);
  lines.push(`  await page.goto("/");`);
  lines.push(``);
  lines.push(`  // Здесь проверьте интерфейс: новое сообщение, индикатор набора, баннер переподключения.`);
  lines.push(`  // expect(page.getByText("...")).toBeVisible();`);
  lines.push(`  expect(received).toBeDefined();`);
  lines.push(`});`);
  lines.push(``);
  return lines.join("\n");
}

export const SAMPLE_WS_FRAMES = `0 | 0{"sid":"mock1","upgrades":[],"pingInterval":25000,"pingTimeout":20000}
50 | 40
500 | 42["message",{"id":"m1","channel":"general","text":"Hello from the mock"}]
1500 | 42["typing",{"user":"anna","channel":"general"}]`;
