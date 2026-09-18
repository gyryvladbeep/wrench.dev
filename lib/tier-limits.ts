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
