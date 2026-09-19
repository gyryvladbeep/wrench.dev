-- ═══════════════════════════════════════════════════════
-- Миграция: конструктор портфолио (Profile → Портфолио)
-- ═══════════════════════════════════════════════════════
-- Выполнить ОДИН РАЗ в SQL Editor Supabase (Dashboard → SQL Editor →
-- New query → вставить и Run) — тот же процесс, что и у остальных
-- миграций в этой папке. Оператор идемпотентен (IF NOT EXISTS),
-- безопасно выполнить повторно.

-- portfolio_sections — какие необязательные разделы пользователь включил
-- в экспортируемое портфолио (слоган/о себе/ссылки/стек/Wrench Score/
-- награды/закреплённые решения/эндорсементы навыков). Значения — id из
-- lib/portfolio.ts PORTFOLIO_SECTIONS, тот же принцип конечного
-- справочника без CHECK на уровне БД, что уже применён к tech_stack/
-- role_tag (см. supabase/profile-stack-location-migration.sql) — сам
-- справочник живёт в приложении, не в базе. "Шапка" портфолио
-- (аватар/имя/юзернейм/роль/локация) в этот список не входит — она
-- есть в экспорте всегда, отключить её нельзя.
--
-- DEFAULT — все разделы включены, совпадает с DEFAULT_PORTFOLIO_SECTIONS
-- в lib/portfolio.ts (при расхождении источником истины считать эту
-- миграцию — lib/portfolio.ts только клиентский фолбэк на случай
-- null/undefined с сервера).
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS portfolio_sections text[] NOT NULL DEFAULT
  ARRAY['tagline','bio','links','tech_stack','score','badges','pinned_challenges','endorsements'];

-- profiles_select_own / profiles_select_public (см. supabase/profile-schema.sql
-- и supabase/profile-public-migration.sql) уже покрывают ЛЮБую колонку
-- этой строки, включая новую — RLS работает на уровне строк, не
-- колонок (тот же факт уже отмечен в profile-stack-location-migration.sql).
-- Сам экспорт портфолио (app/api/portfolio/[username]/route.ts) читает
-- профиль через авторизованного клиента и дополнительно проверяет, что
-- запрашивает именно владелец — картинка не публикуется по прямой
-- ссылке анонимно, в отличие от /api/badge/[username].
