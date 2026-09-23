-- ═══════════════════════════════════════════════════════
-- Миграция: производительность RLS-политик (Supabase Performance
-- Advisor, "Auth RLS Initialization Plan")
-- ═══════════════════════════════════════════════════════
-- Выполнить ОДИН РАЗ в SQL Editor Supabase (Dashboard → SQL Editor →
-- New query → вставить и Run), ПОСЛЕ всех остальных миграций в этой
-- папке (пересоздаёт уже существующие политики, поэтому порядок
-- относительно миграций, которые их СОЗДАЮТ, не важен, но должна
-- идти последней, если применяешь всё разом с нуля). Идемпотентно
-- (DROP POLICY IF EXISTS + CREATE POLICY), безопасно выполнить
-- повторно.
--
-- Что чинит: Supabase Performance Advisor правильно обнаружил, что
-- почти каждая RLS-политика в этой базе писала `auth.uid() = user_id`
-- (или `= id` / `= viewer_id` / `= endorser_id`) напрямую — Postgres
-- в этом случае вызывает auth.uid() ОТДЕЛЬНО на каждой строке, которую
-- проверяет политика, а не один раз на весь запрос. На маленьких
-- таблицах разницы не видно, но это ровно то, что банально не
-- масштабируется — на первый план выходит на запросах, трогающих много
-- строк разом (лидерборд, лента /people, агрегаты). Официальная
-- рекомендация Supabase/Postgres — обернуть вызов в подзапрос:
-- `(select auth.uid())` вместо `auth.uid()`. Тогда planner считает его
-- INIT PLAN — вычисляет один раз до начала сканирования строк, а не на
-- каждой из них.
--
-- Это ЧИСТО про производительность, не про доступ: `x = (select f())`
-- и `x = f()` для скалярной STABLE-функции вроде auth.uid() возвращают
-- одно и то же значение на каждой строке одного запроса — сам смысл
-- каждой политики ниже (владелец видит/пишет только свою строку и т.п.)
-- не меняется ни на йоту, меняется только то, СКОЛЬКО раз Postgres эту
-- функцию вызывает по пути к тому же результату. Поэтому каждая
-- политика ниже — дословная копия той, что уже создана в исходном
-- файле (см. комментарий у каждого блока), с единственным изменением:
-- auth.uid() → (select auth.uid()).
--
-- api_tokens (supabase/api-tokens-migration.sql)
DROP POLICY IF EXISTS "api_tokens_own_row" ON api_tokens;
CREATE POLICY "api_tokens_own_row" ON api_tokens
  FOR ALL USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

-- challenge_attempts, user_streaks, subscriptions, ai_usage (supabase/challenges-schema.sql)
DROP POLICY IF EXISTS "attempts_select" ON challenge_attempts;
CREATE POLICY "attempts_select" ON challenge_attempts FOR SELECT USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "attempts_insert" ON challenge_attempts;
CREATE POLICY "attempts_insert" ON challenge_attempts FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "attempts_update" ON challenge_attempts;
CREATE POLICY "attempts_update" ON challenge_attempts FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "streaks_select" ON user_streaks;
CREATE POLICY "streaks_select" ON user_streaks FOR SELECT USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "streaks_upsert" ON user_streaks;
CREATE POLICY "streaks_upsert" ON user_streaks FOR ALL USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "subscriptions_select" ON subscriptions;
CREATE POLICY "subscriptions_select" ON subscriptions FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "ai_usage_select" ON ai_usage;
CREATE POLICY "ai_usage_select" ON ai_usage FOR SELECT USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "ai_usage_insert" ON ai_usage;
CREATE POLICY "ai_usage_insert" ON ai_usage FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "ai_usage_update" ON ai_usage;
CREATE POLICY "ai_usage_update" ON ai_usage FOR UPDATE USING ((select auth.uid()) = user_id);

-- favorites (supabase/favorites-schema.sql)
DROP POLICY IF EXISTS "favorites_select" ON favorites;
CREATE POLICY "favorites_select" ON favorites FOR SELECT USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "favorites_insert" ON favorites;
CREATE POLICY "favorites_insert" ON favorites FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "favorites_delete" ON favorites;
CREATE POLICY "favorites_delete" ON favorites FOR DELETE USING ((select auth.uid()) = user_id);

-- mock_endpoints, mock_routes (supabase/mock-api-migration.sql)
DROP POLICY IF EXISTS "mock_endpoints_own_row" ON mock_endpoints;
CREATE POLICY "mock_endpoints_own_row" ON mock_endpoints
  FOR ALL USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "mock_routes_own_endpoint" ON mock_routes;
CREATE POLICY "mock_routes_own_endpoint" ON mock_routes
  FOR ALL
  USING (endpoint_id IN (SELECT id FROM mock_endpoints WHERE user_id = (select auth.uid())))
  WITH CHECK (endpoint_id IN (SELECT id FROM mock_endpoints WHERE user_id = (select auth.uid())));

-- profiles, tool_history, achievements (supabase/profile-schema.sql)
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING ((select auth.uid()) = id);
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING ((select auth.uid()) = id);
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "tool_history_select" ON tool_history;
CREATE POLICY "tool_history_select" ON tool_history FOR SELECT USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "tool_history_insert" ON tool_history;
CREATE POLICY "tool_history_insert" ON tool_history FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "achievements_select" ON achievements;
CREATE POLICY "achievements_select" ON achievements FOR SELECT USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "achievements_insert" ON achievements;
CREATE POLICY "achievements_insert" ON achievements FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- salary_submissions (supabase/salary-calculator-migration.sql)
DROP POLICY IF EXISTS "salary_submissions_own_row" ON salary_submissions;
CREATE POLICY "salary_submissions_own_row" ON salary_submissions
  FOR ALL USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

-- tool_usage_events (supabase/tool-usage-events-rls-migration.sql)
DROP POLICY IF EXISTS "Users can insert own usage events" ON tool_usage_events;
CREATE POLICY "Users can insert own usage events" ON tool_usage_events
  FOR INSERT WITH CHECK (user_id IS NULL OR (select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can view own usage events" ON tool_usage_events;
CREATE POLICY "Users can view own usage events" ON tool_usage_events
  FOR SELECT USING ((select auth.uid()) = user_id);

-- trainer_progress (supabase/trainer-migration.sql)
DROP POLICY IF EXISTS "trainer_progress_own_row" ON trainer_progress;
CREATE POLICY "trainer_progress_own_row" ON trainer_progress
  FOR ALL USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

-- webhook_bins, webhook_requests (supabase/webhook-inspector-migration.sql)
DROP POLICY IF EXISTS "webhook_bins_own_row" ON webhook_bins;
CREATE POLICY "webhook_bins_own_row" ON webhook_bins
  FOR ALL USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "webhook_requests_own_bin" ON webhook_requests;
CREATE POLICY "webhook_requests_own_bin" ON webhook_requests
  FOR ALL
  USING (bin_id IN (SELECT id FROM webhook_bins WHERE user_id = (select auth.uid())))
  WITH CHECK (bin_id IN (SELECT id FROM webhook_bins WHERE user_id = (select auth.uid())));

-- workbenches (supabase/workbench-schema.sql) — workbenches_select_public
-- (supabase/workbench-freeform-migration.sql) уже не использует auth.uid()
-- (is_public = true), её не трогаем.
DROP POLICY IF EXISTS "workbenches_select" ON workbenches;
CREATE POLICY "workbenches_select" ON workbenches FOR SELECT USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "workbenches_insert" ON workbenches;
CREATE POLICY "workbenches_insert" ON workbenches FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "workbenches_update" ON workbenches;
CREATE POLICY "workbenches_update" ON workbenches FOR UPDATE USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "workbenches_delete" ON workbenches;
CREATE POLICY "workbenches_delete" ON workbenches FOR DELETE USING ((select auth.uid()) = user_id);

-- profile_views, skill_endorsements (supabase/skill-endorsements-migration.sql)
-- skill_endorsements_insert НЕ трогаем здесь — она уже переопределяется
-- (в уже оптимальном виде) в skill-endorsements-tag-check-migration.sql;
-- если применяешь миграции по порядку, эта здесь была бы просто лишним
-- промежуточным шагом.
DROP POLICY IF EXISTS "profile_views_select_own" ON profile_views;
CREATE POLICY "profile_views_select_own" ON profile_views FOR SELECT USING ((select auth.uid()) = viewer_id);
DROP POLICY IF EXISTS "profile_views_insert_own" ON profile_views;
CREATE POLICY "profile_views_insert_own" ON profile_views FOR INSERT WITH CHECK ((select auth.uid()) = viewer_id);
DROP POLICY IF EXISTS "profile_views_update_own" ON profile_views;
CREATE POLICY "profile_views_update_own" ON profile_views
  FOR UPDATE USING ((select auth.uid()) = viewer_id) WITH CHECK ((select auth.uid()) = viewer_id);

DROP POLICY IF EXISTS "skill_endorsements_select_own" ON skill_endorsements;
CREATE POLICY "skill_endorsements_select_own" ON skill_endorsements FOR SELECT USING (
  (select auth.uid()) = endorser_id OR (select auth.uid()) = endorsee_id
);
DROP POLICY IF EXISTS "skill_endorsements_delete" ON skill_endorsements;
CREATE POLICY "skill_endorsements_delete" ON skill_endorsements FOR DELETE USING ((select auth.uid()) = endorser_id);
