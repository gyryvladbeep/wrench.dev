-- ═══════════════════════════════════════════════════════
-- Миграция: убрать дублирующиеся permissive-политики RLS +
-- закрыть публичный доступ к неиспользуемому materialized view
-- ═══════════════════════════════════════════════════════
-- Выполнить ОДИН РАЗ в SQL Editor Supabase (Dashboard → SQL Editor →
-- New query → вставить и Run). Идемпотентно, безопасно выполнить
-- повторно.

-- ─────────────────────────────────────────────────────────
-- 1. popular_tools_30d — "Materialized view is selectable by anon
--    or authenticated roles"
-- ─────────────────────────────────────────────────────────
-- Это view определён в supabase/schema.sql как задел на будущее
-- ("Phase 2"), и его же пересоздаёт supabase/tool-usage-events-rls-
-- migration.sql — но по факту им никто не пользуется: реальный блок
-- "Popular Tools" на главной странице берёт список не из этого view,
-- а из статичного флага isPopular в lib/tools-registry.ts
-- (getPopularTools()) — это прямо задокументировано комментарием в
-- tool-usage-events-rls-migration.sql. Grep по всему приложению
-- подтверждает: ни одного обращения к popular_tools_30d из кода нет.
--
-- Проблема не в содержимом (счётчики использования инструментов сами
-- по себе не секрет), а в том, что materialized view нельзя защитить
-- через RLS в принципе (RLS работает только для обычных таблиц) —
-- значит он всегда доступен целиком через Data API (PostgREST) любому,
-- у кого есть anon/authenticated ключ, в обход какой-либо логики
-- доступа приложения. Раз view реально не используется — проще и
-- чище не "прятать" его (отзывать права и т.п.), а удалить целиком:
-- нечему сломаться, потому что ничто на него не ссылается.
DROP MATERIALIZED VIEW IF EXISTS public.popular_tools_30d;

-- ─────────────────────────────────────────────────────────
-- 2. "Table X has multiple permissive policies for role Y for
--    action Z" — для ai_usage и (проактивно) для любой другой
--    таблицы в public с той же проблемой
-- ─────────────────────────────────────────────────────────
-- Найдено: на ai_usage сейчас одновременно существуют пары политик
-- вида {ai_usage_insert, usage_insert}, {ai_usage_select, usage_select},
-- {ai_usage_update, usage_update} — то есть по две permissive-политики
-- на одну и ту же роль и одно и то же действие. usage_select/insert/
-- update — те самые "политики-призраки" без источника в репозитории
-- (см. rls-auth-catchall-migration.sql), которые кто-то создал
-- напрямую через Dashboard когда-то раньше, скорее всего как более
-- раннюю версию тех же самых политик, которые потом создала
-- отслеживаемая миграция под именами ai_usage_*.
--
-- Postgres не выбирает "любую одну" из нескольких permissive-политик —
-- он выполняет ВСЕ и объединяет результат через OR. Из этого прямо
-- следует безопасный способ починки без необходимости угадывать/
-- доверять, что тексты дублирующихся политик буквально совпадают:
-- вместо того чтобы удалять "лишнюю" политику (рискуя удалить не ту
-- половину условия, если тексты на самом деле немного различаются),
-- блок ниже читает ВСЕ permissive-политики для каждой группы
-- (таблица, действие, набор ролей) прямо из каталога, склеивает их
-- реальные USING/WITH CHECK выражения через OR в одну политику и
-- удаляет исходные — то есть результат ведёт себя ТОЧНО так же, как
-- и раньше (это то же самое OR, которое Postgres и так вычислял на
-- каждый запрос), но теперь Postgres выполняет его один раз вместо N.
--
-- Группировка идёт по точному совпадению массива ролей (roles) —
-- если у двух политик разный список ролей в TO (например, одна без
-- TO — то есть public — а другая TO authenticated), они НЕ
-- объединяются, чтобы гарантированно не расширить и не сузить круг
-- лиц, которым политика применяется. Если такой случай встретится,
-- итоговый диагностический SELECT в конце файла покажет его отдельно,
-- и его нужно будет разобрать вручную.
--
-- string_agg(DISTINCT ...) на случай, если условия у каких-то двух
-- политик буквально идентичны — тогда вместо избыточного "(x) OR (x)"
-- в объединённой политике останется просто "(x)" один раз.
--
-- Проверено локально на реальном Postgres 16: (а) пара "своё OR
-- публичное" с разными условиями — правильно объединяется в одно
-- выражение через OR; (б) пара с буквально одинаковым условием (как
-- у ai_usage) — DISTINCT схлопывает дубликат, не оставляя лишнего
-- "OR (то же самое)"; (в) пара с разным TO (разные roles) —
-- правильно НЕ объединяется, остаётся как есть; (г) повторный запуск
-- после объединения — идемпотентен, group by находит уже ровно одну
-- политику на группу и ничего не делает.
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
    GROUP BY schemaname, tablename, cmd, roles
    HAVING count(*) > 1
  LOOP
    merged_using := CASE WHEN grp.using_expr IS NOT NULL THEN '(' || grp.using_expr || ')' ELSE NULL END;
    merged_check := CASE WHEN grp.check_expr IS NOT NULL THEN '(' || grp.check_expr || ')' ELSE NULL END;

    new_name := grp.tablename || '_' || lower(grp.cmd) || '_merged';

    -- удаляем все исходные политики группы
    FOREACH pol_name IN ARRAY grp.policy_names
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol_name, grp.schemaname, grp.tablename);
    END LOOP;

    -- и на всякий случай саму объединённую (если запускаем повторно
    -- после сбоя на середине, или имя случайно уже занято)
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', new_name, grp.schemaname, grp.tablename);

    stmt := format(
      'CREATE POLICY %I ON %I.%I AS PERMISSIVE FOR %s TO %s',
      new_name,
      grp.schemaname,
      grp.tablename,
      grp.cmd,
      array_to_string(grp.roles, ', ')
    );
    IF merged_using IS NOT NULL THEN
      stmt := stmt || format(' USING (%s)', merged_using);
    END IF;
    IF merged_check IS NOT NULL THEN
      stmt := stmt || format(' WITH CHECK (%s)', merged_check);
    END IF;

    RAISE NOTICE 'rls-multiple-policies: merged % policies on %.% (%, roles=%) into %: %',
      grp.policy_count, grp.schemaname, grp.tablename, grp.cmd, grp.roles, new_name, stmt;
    EXECUTE stmt;
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────
-- Диагностика: если после объединения выше остались группы с
-- несколькими permissive-политиками (например из-за разных ролей
-- в TO, которые блок сознательно не трогает) — эта строка их
-- покажет. В норме запрос должен вернуть 0 строк.
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
