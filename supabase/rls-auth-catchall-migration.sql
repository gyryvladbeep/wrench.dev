-- ═══════════════════════════════════════════════════════
-- Миграция: универсальный фикс для всего, что Supabase Performance/
-- Security Advisor ещё найдёт по auth.<fn>()/current_setting() в RLS,
-- плюс search_path для auto_confirm_user
-- ═══════════════════════════════════════════════════════
-- Выполнить ОДИН РАЗ в SQL Editor Supabase (Dashboard → SQL Editor →
-- New query → вставить и Run). Идемпотентно, безопасно выполнить
-- повторно.
--
-- Почему это отдельный файл, а не добавка в rls-performance-migration.sql:
-- вторая присланная тобой партия предупреждений (sub_select, sub_insert,
-- usage_select, usage_insert, usage_update, profiles_select,
-- profiles_insert, profiles_update) — это политики с ДРУГИМИ именами,
-- чем те, что чинил rls-performance-migration.sql (subscriptions_select,
-- ai_usage_select/insert/update, profiles_select_own/insert_own/update_own).
-- Их нет ни в одном .sql-файле в этой папке — то есть на твоём живом
-- проекте Supabase есть политики, которые были созданы напрямую через
-- Dashboard/SQL Editor когда-то раньше и никогда не попадали в
-- отслеживаемые миграции репозитория. Гадать их точный USING/WITH CHECK
-- текст и переписывать его руками вручную — риск случайно поменять
-- смысл политики, если угадаю неточно.
--
-- Вместо этого — первый блок ниже читает ФАКТИЧЕСКОЕ определение
-- КАЖДОЙ политики public-схемы прямо из каталога Postgres (pg_policies)
-- и чинит именно то, что там реально написано: находит любой
-- НЕобёрнутый вызов auth.uid()/auth.role()/auth.jwt()/current_setting(...)
-- и оборачивает его в (select ...) через ALTER POLICY, не трогая
-- остальную логику политики ни на символ. Это и чинит все 8 политик
-- из второй партии (какой бы ни была их точная формулировка), и заодно
-- подстрахует от точно такой же проблемы в любой другой политике,
-- которая всплывёт в следующих партиях — так что присылать их дальше
-- по одной уже не нужно, один этот блок ловит их все разом.
--
-- Проверено локально на реальном Postgres 16: создавал политики с
-- разными формами (USING, WITH CHECK, оба сразу, несколько вызовов
-- auth.uid() в одном выражении, уже обёрнутую политику как контроль) —
-- блок правильно оборачивает только то, что ещё не обёрнуто, ничего не
-- дублирует при повторном запуске, и не трогает уже оптимальные политики.
DO $$
DECLARE
  pol RECORD;
  new_qual  text;
  new_check text;
  stmt      text;
  -- auth.uid()/auth.role()/auth.jwt() или current_setting(...), но
  -- только если ПЕРЕД вызовом ещё нет "SELECT " — именно так Postgres
  -- сам печатает уже обёрнутый вызов обратно из каталога
  -- (`(select auth.uid())`, который сохраняется, становится
  -- `( SELECT auth.uid() AS uid)` при чтении из pg_policies) — то есть
  -- этот же паттерн узнаёт и то, что обернул этот файл, и то, что уже
  -- было обёрнуто вручную/предыдущей миграцией, и не оборачивает дважды.
  pattern     text := '(?<!SELECT )(auth\.(?:uid|role|jwt)\(\)|current_setting\([^()]*\))';
  replacement text := '(select \1)';
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        (qual IS NOT NULL AND qual ~ pattern)
        OR (with_check IS NOT NULL AND with_check ~ pattern)
      )
  LOOP
    new_qual  := CASE WHEN pol.qual IS NOT NULL THEN regexp_replace(pol.qual, pattern, replacement, 'g') ELSE NULL END;
    new_check := CASE WHEN pol.with_check IS NOT NULL THEN regexp_replace(pol.with_check, pattern, replacement, 'g') ELSE NULL END;

    stmt := format('ALTER POLICY %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    IF new_qual IS NOT NULL THEN
      stmt := stmt || format(' USING (%s)', new_qual);
    END IF;
    IF new_check IS NOT NULL THEN
      stmt := stmt || format(' WITH CHECK (%s)', new_check);
    END IF;

    RAISE NOTICE 'rls-auth-catchall: %', stmt;
    EXECUTE stmt;
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────
-- auto_confirm_user — "Function has a role mutable search_path"
-- ─────────────────────────────────────────────────────────
-- Ещё одна функция, которой нет ни в одном .sql-файле здесь — судя по
-- имени, разовый вспомогательный SQL-хелпер, написанный кем-то прямо в
-- Dashboard (скорее всего для ручного тестирования — подтвердить
-- e-mail тестового аккаунта в обход обычного flow с письмом), а не
-- часть основного приложения. Раз её определения нет в репозитории —
-- не могу процитировать/переписать её тело, поэтому чиню именно то,
-- на что жалуется линтер, не трогая остальное: SECURITY DEFINER-функция
-- без явного search_path уязвима к тому, что вызывающая сессия могла
-- заранее подложить в свой search_path схему с одноимённым объектом
-- (таблицей/функцией) и подменить то, что функция реально вызывает —
-- закрепление search_path на 'public, pg_temp' убирает эту
-- неоднозначность, тот же фикс, что Supabase сам рекомендует.
-- Через oid, а не через ALTER FUNCTION public.auto_confirm_user(...) —
-- чтобы не гадать точную сигнатуру (сколько у неё аргументов и какого
-- типа); если функции с таким именем нет вовсе, цикл просто ничего не
-- делает.
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
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', func_oid::regprocedure);
    RAISE NOTICE 'rls-auth-catchall: pinned search_path on %', func_oid::regprocedure;
  END LOOP;
END $$;
