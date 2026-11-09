-- ═══════════════════════════════════════════════════════
-- Миграция: исправление ai_usage (сломанный дневной лимит AI)
-- ═══════════════════════════════════════════════════════
-- Выполнить ОДИН РАЗ в SQL Editor Supabase (Dashboard → SQL Editor →
-- New query → вставить и Run) — тот же процесс, что и у остальных
-- миграций. Все операторы идемпотентны, безопасно выполнить повторно.
--
-- Проблема: ai_usage (challenges-schema.sql) создана с tool_slug text
-- NOT NULL и UNIQUE(user_id, tool_slug, used_at) — расчёт на отдельный
-- счётчик по каждому инструменту. Но lib/rate-limit.ts (checkAiLimit /
-- incrementAiUsage) реализует ОДИН общий дневной лимит на все AI-тулы
-- сразу (сообщение "Daily AI limit reached — Upgrade to Pro" не
-- упоминает конкретный инструмент) и НИКОГДА не передаёт tool_slug —
-- ни при SELECT (.eq("used_at", today) без .eq("tool_slug", ...)), ни
-- при INSERT ({ user_id, used_at, count: 1 }).
--
-- Результат: incrementAiUsage() на INSERT падает с нарушением NOT NULL
-- по tool_slug — а ошибку никто не проверяет (return-значение insert()
-- не читается), так что падение полностью молчаливое. Строка в
-- ai_usage никогда не сохраняется, checkAiLimit() каждый раз видит
-- "использований сегодня: 0" и возвращает allowed: true — бесплатный
-- лимit в 3 генерации/день (PLANS.free.aiGenerationsPerDay в
-- lib/stripe.ts) НИКОГДА не применялся ни для одного AI-инструмента,
-- включая test-case-generator, у которого checkAiLimit() вообще
-- вызывается. Это ровно та же проблема, что и отсутствие
-- checkAiLimit() в bug-report-generator/regex-generator (исправлено
-- отдельно, в самих route.ts) — только на уровне схемы, а не кода.

ALTER TABLE ai_usage ALTER COLUMN tool_slug DROP NOT NULL;

-- Убираем трёхколоночное ограничение уникальности — оно требовало бы
-- tool_slug на каждой вставке ради полусмысленного "одна строка на
-- инструмент в день", тогда как приложение всегда работало (и должно
-- работать) с одной строкой на пользователя в день, независимо от
-- инструмента.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ai_usage_user_id_tool_slug_used_at_key'
  ) THEN
    ALTER TABLE ai_usage DROP CONSTRAINT ai_usage_user_id_tool_slug_used_at_key;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_usage_user_date_unique ON ai_usage(user_id, used_at);
