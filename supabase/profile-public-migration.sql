-- ═══════════════════════════════════════════════════════
-- Миграция: публичная страница профиля (/u/[username])
-- ═══════════════════════════════════════════════════════
-- Выполнить ОДИН РАЗ в SQL Editor Supabase (Dashboard → SQL Editor →
-- New query → вставить и Run) — тот же процесс, что и для
-- supabase/workbench-freeform-migration.sql. Все операторы идемпотентны
-- (IF NOT EXISTS / DO-блоки), безопасно выполнить повторно.

-- Новые поля самовыражения профиля — тот же принцип, что уже есть у
-- avatar_color: выбор из готовых пресетов (см. lib/profile-banners.ts
-- для banner_gradient), без загрузки картинок. pinned_challenge_ids —
-- до 3 id из таблицы challenges, которые пользователь сам выбрал
-- показать на публичном профиле (ограничение "не больше 3" проверяется
-- в приложении, не в БД — та же лёгкость, что у остальных полей этой
-- таблицы, ни у одного из них нет CHECK-ограничений).
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banner_gradient      text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tagline              text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS github_url           text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_url         text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website_url          text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pinned_challenge_ids uuid[] NOT NULL DEFAULT '{}';

-- Публичная страница профиля читает эти таблицы от лица анонимного
-- посетителя (не залогинен вообще) — тот же паттерн, что уже работает
-- для публичного шаринга Workbench: RLS-политика "is_public = true" —
-- единственное место, где проверяется доступ, без дублирования проверки
-- в JS (см. components/profile/PublicProfileView.tsx, который явно
-- фильтрует запрос только по username, не по is_public, — ровно как
-- PublicWorkbenchView.tsx фильтрует только по id).
--
-- profiles.is_public уже существует (DEFAULT true в исходной схеме) —
-- эта миграция добавляет только политику, которой раньше не было ни у
-- кого не было причин читать чужой профиль.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'profiles_select_public'
  ) THEN
    CREATE POLICY "profiles_select_public" ON profiles FOR SELECT USING (is_public = true);
  END IF;
END $$;

-- user_streaks и tool_history не хранят собственный is_public — это
-- поле есть только у profiles, поэтому политика идёт через EXISTS,
-- проверяя чужую строку profiles, а не колонку в своей же таблице.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_streaks' AND policyname = 'user_streaks_select_public'
  ) THEN
    CREATE POLICY "user_streaks_select_public" ON user_streaks FOR SELECT USING (
      EXISTS (SELECT 1 FROM profiles p WHERE p.id = user_streaks.user_id AND p.is_public = true)
    );
  END IF;
END $$;

-- Публичному профилю нужно только ЧИСЛО использованных инструментов для
-- Wrench Score (тот же приём, что уже в components/WrenchScoreBadge.tsx —
-- count-запрос с head:true, не список строк), но RLS даёт доступ на
-- уровне строк, а не колонок — открываем всю историю тем, кто сам включил
-- публичность профиля. Это не чувствительнее того, что уже публично на
-- Workbench (какими инструментами человек пользуется). Осознанно НЕ
-- делаем того же для challenge_attempts/achievements/subscriptions —
-- решения конкретных задач и статус Pro на публичной странице в этой
-- версии не показываем (см. комментарий в PublicProfileView.tsx).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'tool_history' AND policyname = 'tool_history_select_public'
  ) THEN
    CREATE POLICY "tool_history_select_public" ON tool_history FOR SELECT USING (
      EXISTS (SELECT 1 FROM profiles p WHERE p.id = tool_history.user_id AND p.is_public = true)
    );
  END IF;
END $$;
