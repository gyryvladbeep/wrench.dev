// Чистая логика без Supabase/React — тот же принцип границы, что у
// lib/portfolio.ts/lib/wrench-score.ts, протестировано без браузера (см.
// tests/is-new-account.spec.ts). Вынесено из
// app/[locale]/auth/callback/route.ts, чтобы не проверять эту логику
// только вручную кликая по OAuth-кнопке.
//
// Зачем вообще эта проверка — см. подробный комментарий в самом route.ts:
// у OAuth (в отличие от email/пароля) нет отдельного события "это была
// регистрация", кнопка одна и та же и на /auth/login, и на /auth/signup.
// Надёжный признак первого входа — created_at и last_sign_in_at Supabase
// auth.users внутри нескольких секунд друг от друга.
export function isNewAccount(
  createdAt: string | null | undefined,
  lastSignInAt: string | null | undefined,
  thresholdMs = 15000
): boolean {
  if (!createdAt || !lastSignInAt) return false;
  const created  = new Date(createdAt).getTime();
  const lastSeen = new Date(lastSignInAt).getTime();
  if (Number.isNaN(created) || Number.isNaN(lastSeen)) return false;
  return Math.abs(lastSeen - created) < thresholdMs;
}
