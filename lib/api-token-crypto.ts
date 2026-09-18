// ═══════════════════════════════════════════════════════════════
// Генерация и хэширование личных токенов API-доступа — вызывается
// только с клиента (components/profile/ApiTokensPanel.tsx), при
// создании/отображении токена. Серверная сторона хэширует ту же
// строку через Node crypto (hashApiToken() в lib/api-auth.ts) — оба
// обязаны давать ОДИНАКОВЫЙ hex на один и тот же токен, иначе
// созданный токен никогда бы не прошёл проверку на сервере. crypto.subtle
// здесь, а не Node crypto, потому что этот файл выполняется в браузере
// (secure context — localhost/HTTPS, ровно где живёт приложение).
// ═══════════════════════════════════════════════════════════════

export const API_TOKEN_PREFIX = "wrb_";

function toHex(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// 24 случайных байта (192 бита) — с большим запасом сверх того, что
// нужно для практической неугадываемости, тот же порядок величины, что
// у токенов GitHub/Stripe.
export function generateApiToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return `${API_TOKEN_PREFIX}${toHex(bytes)}`;
}

export async function hashApiTokenBrowser(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(digest);
}

// Показываем в списке ровно столько, сколько нужно, чтобы отличить
// токены друг от друга — не сам токен целиком. "wrb_" + 8 hex-символов
// (32 бита) практически никогда не совпадёт у двух разных токенов
// одного пользователя, при этом ничего не раскрывает о хэше/остатке.
export function apiTokenPrefix(token: string): string {
  return token.slice(0, API_TOKEN_PREFIX.length + 8);
}
