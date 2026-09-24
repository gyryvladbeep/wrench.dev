-- ═══════════════════════════════════════════════════════
-- Исправление: предыдущий фикс auto_confirm_user() не сработал —
-- REVOKE ... FROM PUBLIC недостаточно на реальном Supabase-проекте
-- ═══════════════════════════════════════════════════════
-- Выполнить ОДИН РАЗ в SQL Editor Supabase (Dashboard → SQL Editor →
-- New query → вставить и Run). Идемпотентно, безопасно выполнить
-- повторно.
--
-- Что произошло: миграция rls-forall-policy-merge-migration.sql
-- отзывала EXECUTE только у PUBLIC — этого достаточно на "чистом"
-- Postgres (так и было проверено локально), но НЕ на Supabase.
-- У каждого Supabase-проекта из коробки настроено
--   ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
--     GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
-- — это значит, что anon и authenticated получают EXECUTE НАПРЯМУЮ,
-- отдельным правом, в момент создания функции, а не только через
-- общий грант PUBLIC. Отзыв прав у PUBLIC эти прямые права не
-- трогает вообще — функция остаётся вызываемой и у anon, и у
-- authenticated, что и показал Advisor после повторного запуска.
--
-- Проверено эмпирически на реальном Postgres 16: воспроизвёл именно
-- этот Supabase default-privileges бутстрап (тот же ALTER DEFAULT
-- PRIVILEGES, что описан выше), создал функцию после него — прямые
-- права у anon/authenticated появляются сразу же, "REVOKE ... FROM
-- PUBLIC" их не убирает (has_function_privilege всё ещё возвращает
-- true для обеих ролей), а "REVOKE ... FROM PUBLIC, anon,
-- authenticated" убирает — подтверждено тем же has_function_privilege.
-- Повторный запуск — без ошибок (REVOKE несуществующего права просто
-- ничего не делает, а не падает).
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
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', func_oid::regprocedure);
    RAISE NOTICE 'auto-confirm-user-revoke-fix: revoked PUBLIC/anon/authenticated execute on %', func_oid::regprocedure;
  END LOOP;
END $$;

-- service_role сознательно не трогаем — это серверный ключ (никогда
-- не попадает в браузер), и Advisor его не проверяет: предупреждения
-- "Public Can Execute" / "Signed-In Users Can Execute" — конкретно
-- про anon/authenticated.

-- Диагностика — должна вернуть false в обеих колонках. Если после
-- выполнения этого файла Advisor всё ещё показывает предупреждение —
-- пришли, что вернул этот SELECT, разберёмся дальше.
SELECT
  has_function_privilege('anon', p.oid, 'EXECUTE')          AS anon_can_still_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_can_still_execute
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname = 'auto_confirm_user';
