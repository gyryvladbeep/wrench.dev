// ═══════════════════════════════════════════════════════════════
// Лимиты free/Pro по фичам, которые можно создавать двумя путями —
// из UI (lib/hooks/useMockEndpoints.ts, lib/hooks/useWebhookBins.ts)
// и из серверных write-эндпоинтов публичного API (app/api/v1/mock-endpoints,
// app/api/v1/webhook-bins — тот же CI/curl-сценарий, что и пункт 13 из
// ROADMAP-BRAINSTORM.md). Оба пути создают строки в одних и тех же
// таблицах, поэтому обязаны считать по одному и тому же числу, а не
// по двум похожим константам в разных местах, которые могут разъехаться
// при следующей правке лимита. Хуки ниже реэкспортируют эти же
// константы под старыми именами — ничего в остальном коде, что уже
// импортирует их из lib/hooks/*, трогать не пришлось.
// ═══════════════════════════════════════════════════════════════

export const FREE_MAX_MOCK_ENDPOINTS = 1;
export const FREE_MAX_MOCK_ROUTES = 3;
export const PRO_MAX_MOCK_ENDPOINTS = 5;
export const PRO_MAX_MOCK_ROUTES = 15;

export const FREE_MAX_WEBHOOK_BINS = 1;
export const PRO_MAX_WEBHOOK_BINS = 5;
export const WEBHOOK_REQUEST_RETENTION = 50;

// Security audit 2026-09-23: response_body раньше не имел верхней
// границы длины ни в форме (MockApiClient.tsx), ни в write-эндпоинте
// публичного API (app/api/v1/mock-endpoints) — единственной защитой от
// патологически огромного тела был неявный лимит размера самого
// HTTP-запроса на Vercel. Атака "на себя" (раздуть собственные же
// строки в своей же таблице под своим же RLS) не даёт доступа к чужим
// данным, но легко приводит к путанице в интерфейсе и напрасному
// расходу места в бесплатном тарифе Supabase — тот же порядок величины,
// что и у настоящего API-ответа с реалистичным по объёму JSON.
export const MAX_MOCK_RESPONSE_BODY_LENGTH = 20_000;
