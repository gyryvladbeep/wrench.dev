-- ═══════════════════════════════════════════════════════
-- Миграция: добить оставшиеся "multiple permissive policies" на
-- FOR ALL политиках + закрыть анонимный доступ к auto_confirm_user
-- ═══════════════════════════════════════════════════════
-- Выполнить ОДИН РАЗ в SQL Editor Supabase (Dashboard → SQL Editor →
-- New query → вставить и Run), ПОСЛЕ rls-multiple-policies-migration.sql.
-- Идемпотентно, безопасно выполнить повторно. Не зависит от того,
-- выполнялась ли rls-multiple-policies-migration.sql — можно
-- накатить и отдельно, результат будет тот же.

-- ─────────────────────────────────────────────────────────
-- Почему это отдельный файл: новая партия предупреждений показала,
-- что на user_streaks (и потенциально где-то ещё) есть политика
-- streaks_upsert, объявленная как "FOR ALL" (см. challenges-schema.sql,
-- строка "streaks_upsert" ... FOR ALL USING (auth.uid() = user_id)).
-- Предыдущая миграция (rls-multiple-policies-migration.sql) группировала
-- дублирующиеся политики строго по точному совпадению cmd ('SELECT',
-- 'INSERT' и т.д.) — а у FOR ALL политики в каталоге Postgres
-- cmd = 'ALL', отдельное значение. Из-за этого streaks_upsert НЕ
-- считалась дубликатом ни с streaks_select (SELECT), ни с
-- no_delete_streaks (DELETE) на предыдущем проходе, хотя ФАКТИЧЕСКИ
-- FOR ALL политика применяется Postgres'ом отдельно к каждому из
-- SELECT/INSERT/UPDATE/DELETE — то есть дублирование реально есть,
-- просто предыдущий мерж его не видел.
--
-- Шаг 1 ниже чинит именно это: превращает FOR ALL политику, которая
-- делит таблицу и роли (TO ...) с любой другой permissive-политикой,
-- в 4 отдельные политики (SELECT/INSERT/UPDATE/DELETE) с ТЕМИ ЖЕ
-- самыми USING/WITH CHECK условиями — это не меняет поведение ни на
-- символ, потому что именно так Postgres и обрабатывает FOR ALL под
-- капотом (в т.ч. если WITH CHECK не указан явно — тогда для
-- INSERT/UPDATE используется то же самое выражение, что и в USING;
-- проверено эмпирически: вставка строки, не проходящей USING-условие,
-- отклоняется с "new row violates row-level security policy" даже
-- когда with_check в pg_policies показывает NULL).
--
-- Шаг 2 — тот же самый мерж через OR, что и в
-- rls-multiple-policies-migration.sql (см. её шапку с объяснением) —
-- применяется уже к результату шага 1, где все политики честно
-- разложены по конкретным действиям, поэтому теперь корректно
-- находит и схлопывает то, что раньше пряталось за 'ALL'.
--
-- Как и раньше — группировка только при точном совпадении набора
-- ролей (roles), FOR ALL политика без "соседей" на той же таблице
-- вообще не трогается (незачем — разворачивать её в 4 политики,
-- когда дублирования всё равно нет, лишняя возня).
--
-- Проверено локально на реальном Postgres 16: воспроизвёл ровно
-- твою ситуацию (streaks_upsert FOR ALL без WITH CHECK + отдельная
-- SELECT-политика + отдельная DELETE-политика) — после миграции
-- SELECT и DELETE корректно смёржены в одну политику через OR,
-- INSERT/UPDATE (для которых дубликата нет) остались как отдельные
-- политики streaks_upsert_insert/streaks_upsert_update с тем же
-- условием, что было в исходной streaks_upsert. Повторный запуск —
-- без изменений. Отдельно проверил, что FOR ALL политика БЕЗ соседей
-- на другой таблице не трогается вообще.
DO $$
DECLARE
  pol RECORD;
  has_sibling boolean;
  base_check text;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname, roles, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND permissive = 'PERMISSIVE'
      AND cmd = 'ALL'
      AND qual IS NOT NULL
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM pg_policies q
      WHERE q.schemaname = pol.schemaname
        AND q.tablename  = pol.tablename
        AND q.permissive = 'PERMISSIVE'
        AND q.policyname <> pol.policyname
        AND q.roles = pol.roles
    ) INTO has_sibling;

    IF NOT has_sibling THEN
      CONTINUE;
    END IF;

    base_check := coalesce(pol.with_check, pol.qual);

    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);

    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname || '_select', pol.schemaname, pol.tablename);
    EXECUTE format(
      'CREATE POLICY %I ON %I.%I AS PERMISSIVE FOR SELECT TO %s USING (%s)',
      pol.policyname || '_select', pol.schemaname, pol.tablename, array_to_string(pol.roles, ', '), pol.qual
    );

    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname || '_insert', pol.schemaname, pol.tablename);
    EXECUTE format(
      'CREATE POLICY %I ON %I.%I AS PERMISSIVE FOR INSERT TO %s WITH CHECK (%s)',
      pol.policyname || '_insert', pol.schemaname, pol.tablename, array_to_string(pol.roles, ', '), base_check
    );

    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname || '_update', pol.schemaname, pol.tablename);
    EXECUTE format(
      'CREATE POLICY %I ON %I.%I AS PERMISSIVE FOR UPDATE TO %s USING (%s) WITH CHECK (%s)',
      pol.policyname || '_update', pol.schemaname, pol.tablename, array_to_string(pol.roles, ', '), pol.qual, base_check
    );

    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname || '_delete', pol.schemaname, pol.tablename);
    EXECUTE format(
      'CREATE POLICY %I ON %I.%I AS PERMISSIVE FOR DELETE TO %s USING (%s)',
      pol.policyname || '_delete', pol.schemaname, pol.tablename, array_to_string(pol.roles, ', '), pol.qual
    );

    RAISE NOTICE 'rls-forall-merge: split % on %.% into 4 action-specific policies', pol.policyname, pol.schemaname, pol.tablename;
  END LOOP;
END $$;

DO $$
DECLARE
  grp RECORD;
  merged_using text;
  merged_check text;
  new_name     text;
  stmt         text;
  pol_name     text;
BEGIN
  FOR grp IN
    SELECT
      schemaname,
      tablename,
      cmd,
      roles,
      array_agg(policyname ORDER BY policyname) AS policy_names,
      string_agg(DISTINCT qual, ') OR (' ORDER BY qual) FILTER (WHERE qual IS NOT NULL) AS using_expr,
      string_agg(DISTINCT with_check, ') OR (' ORDER BY with_check) FILTER (WHERE with_check IS NOT NULL) AS check_expr,
      count(*) AS policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND permissive = 'PERMISSIVE'
      AND cmd <> 'ALL'
    GROUP BY schemaname, tablename, cmd, roles
    HAVING count(*) > 1
  LOOP
    merged_using := CASE WHEN grp.using_expr IS NOT NULL THEN '(' || grp.using_expr || ')' ELSE NULL END;
    merged_check := CASE WHEN grp.check_expr IS NOT NULL THEN '(' || grp.check_expr || ')' ELSE NULL END;
    new_name := grp.tablename || '_' || lower(grp.cmd) || '_merged';

    FOREACH pol_name IN ARRAY grp.policy_names
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol_name, grp.schemaname, grp.tablename);
    END LOOP;
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', new_name, grp.schemaname, grp.tablename);

    stmt := format('CREATE POLICY %I ON %I.%I AS PERMISSIVE FOR %s TO %s', new_name, grp.schemaname, grp.tablename, grp.cmd, array_to_string(grp.roles, ', '));
    IF merged_using IS NOT NULL THEN stmt := stmt || format(' USING (%s)', merged_using); END IF;
    IF merged_check IS NOT NULL THEN stmt := stmt || format(' WITH CHECK (%s)', merged_check); END IF;

    RAISE NOTICE 'rls-forall-merge: % policies on %.% (%, roles=%) -> %: %', grp.policy_count, grp.schemaname, grp.tablename, grp.cmd, grp.roles, new_name, stmt;
    EXECUTE stmt;
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────
-- auto_confirm_user() — "can be executed by the anon role as a
-- SECURITY DEFINER function via /rest/v1/rpc/auto_confirm_user"
-- ─────────────────────────────────────────────────────────
-- Как и раньше (см. rls-auth-catchall-migration.sql) — этой функции
-- нет ни в одном .sql-файле репозитория, и grep по всему коду
-- приложения (ts/tsx/js) не находит НИ ОДНОГО обращения к ней —
-- значит из приложения она никогда не вызывается, это забытый
-- ручной хелпер из Dashboard (судя по имени — подтверждение e-mail
-- тестового аккаунта в обход обычного flow с письмом).
--
-- Проблема, которую поднял линтер: SECURITY DEFINER означает "функция
-- выполняется с правами того, кто её создал" (обычно это роль
-- postgres/владелец), а не с правами вызывающего — и по умолчанию
-- Postgres выдаёт EXECUTE абсолютно всем (включая нелогиненных, роль
-- anon), если явно не отозвать. То есть СЕЙЧАС любой человек без
-- аккаунта может дёрнуть её напрямую через REST API
-- (/rest/v1/rpc/auto_confirm_user), и она выполнится с повышенными
-- правами — что именно она при этом делает, не могу проверить (тела
-- функции нет в репозитории), поэтому не могу гарантировать, что
-- это безвредно.
--
-- Фикс — самый безопасный из возможных без доступа к телу функции:
-- отозвать EXECUTE у PUBLIC (это разом убирает доступ и у anon, и у
-- authenticated — обе роли получали право на выполнение только через
-- неявный грант PUBLIC при создании функции, отдельного гранта нет).
-- Если функция тебе всё ещё нужна для ручного тестирования — в самом
-- SQL Editor Supabase Dashboard она по-прежнему будет работать (там
-- ты подключён как postgres/service_role, эти права не отзываются).
-- Если она реально нужна фронтенду через RPC — напиши, добавлю
-- отдельным GRANT EXECUTE ... TO authenticated точечно.
--
-- Через oid → regprocedure, а не через явную сигнатуру — на случай,
-- если у функции есть перегрузки или аргументы, которых не видно из
-- текста предупреждения (в последней партии линтер показал сигнатуру
-- без аргументов: auto_confirm_user()). Если функции с таким именем
-- нет вовсе — цикл просто ничего не делает.
DO $$
DECLARE
  func_oid oid;
BEGIN
  FOR func_oid IN
    SELECT p.oid
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'auto_confirm_user'
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', func_oid::regprocedure);
    RAISE NOTICE 'rls-forall-merge: revoked PUBLIC execute on %', func_oid::regprocedure;
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────
-- Диагностика: должна вернуть 0 строк. Если что-то есть — значит
-- остался случай с разными roles в TO (см. rls-multiple-policies-
-- migration.sql) или FOR ALL политика без USING (редкий случай,
-- шаг 1 её не трогает) — пришли мне, что вернёт запрос.
-- ─────────────────────────────────────────────────────────
SELECT
  schemaname,
  tablename,
  cmd,
  roles,
  count(*) AS policy_count,
  array_agg(policyname ORDER BY policyname) AS policy_names
FROM pg_policies
WHERE schemaname = 'public'
  AND permissive = 'PERMISSIVE'
GROUP BY schemaname, tablename, cmd, roles
HAVING count(*) > 1;
