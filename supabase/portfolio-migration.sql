-- ═══════════════════════════════════════════════════════
-- Миграция: конструктор портфолио (Profile → Портфолио)
-- ═══════════════════════════════════════════════════════
-- Выполнить ОДИН РАЗ в SQL Editor Supabase (Dashboard → SQL Editor →
-- New query → вставить и Run) — тот же процесс, что и у остальных
-- миграций в этой папке. Все операторы идемпотентны (IF NOT EXISTS),
-- безопасно выполнить повторно — в том числе если более ранняя версия
-- этого же файла (только с portfolio_sections, без ручных
-- переопределений ниже) уже была выполнена раньше: эта версия просто
-- добавляет недостающие колонки, ничего не трогает у уже существующих.
--
-- ВАЖНО, если более ранняя версия уже выполнялась: у DEFAULT колонки
-- меняется только значение для НОВЫХ строк — у уже существующих
-- профилей portfolio_sections не пересчитывается задним числом, так что
-- "Фон" и "Аватар" (новые переключаемые разделы, добавленные этой
-- версией) там просто окажутся выключены. Достаточно один раз включить
-- обе галочки во вкладке Портфолио — там же они и сохранятся.

-- portfolio_sections — какие необязательные разделы пользователь включил
-- в экспортируемое портфолио (фон/аватар/слоган/о себе/ссылки/стек/
-- Wrench Score/награды/закреплённые решения/эндорсементы навыков).
-- Значения — id из lib/portfolio.ts PORTFOLIO_SECTIONS, тот же принцип
-- конечного справочника без CHECK на уровне БД, что уже применён к
-- tech_stack/role_tag (см. supabase/profile-stack-location-migration.sql)
-- — сам справочник живёт в приложении, не в базе. Единственное, что в
-- этот список не входит и отключить нельзя — строка имя/юзернейм/роль/
-- локация: без неё портфолио превратилось бы в карточку без единой
-- опознавательной детали, чьё это портфолио вообще.
--
-- DEFAULT — все разделы включены, совпадает с DEFAULT_PORTFOLIO_SECTIONS
-- в lib/portfolio.ts (при расхождении источником истины считать эту
-- миграцию — lib/portfolio.ts только клиентский фолбэк на случай
-- null/undefined с сервера).
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS portfolio_sections text[] NOT NULL DEFAULT
  ARRAY['banner','avatar','tagline','bio','links','tech_stack','score','badges','pinned_challenges','endorsements'];

-- Ручной редактор содержимого портфолио — четыре необязательных
-- переопределения, независимых от "настоящих" profile.tagline/
-- profile.bio/profile.display_name: пустое значение (NULL) значит
-- "показать как в самом профиле", заполненное — "показать вот это
-- вместо него". См. resolvePortfolioText() в lib/portfolio.ts — единая
-- функция, которая решает, что в итоге показать, и в живом
-- предпросмотре, и при экспорте PNG, чтобы они не могли разойтись.
-- Свободный текст без справочника, тот же случай, что у самих
-- profile.tagline/bio — не нужен ни CHECK, ни отдельная RLS-политика.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS portfolio_title   text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS portfolio_tagline text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS portfolio_bio     text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS portfolio_footer  text;

-- profiles_select_own / profiles_select_public (см. supabase/profile-schema.sql
-- и supabase/profile-public-migration.sql) уже покрывают ЛЮБую колонку
-- этой строки, включая все новые — RLS работает на уровне строк, не
-- колонок (тот же факт уже отмечен в profile-stack-location-migration.sql).
-- Сам экспорт портфолио (app/api/portfolio/[username]/route.tsx) читает
-- профиль через авторизованного клиента и дополнительно проверяет, что
-- запрашивает именно владелец — картинка не публикуется по прямой
-- ссылке анонимно, в отличие от /api/badge/[username].
