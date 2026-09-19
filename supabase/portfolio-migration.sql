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
  ARRAY['banner','avatar','tagline','bio','links','tech_stack','experience','projects','score','badges','pinned_challenges','endorsements'];

-- Опыт работы и проекты — "классические" резюме-разделы (roadmap:
-- "добавить классические поля, как опыт работы, свои проекты"). Списки
-- записей, а не простой текст, поэтому jsonb, а не text[] — каждая
-- запись это объект с несколькими полями (см. PortfolioExperienceEntry/
-- PortfolioProjectEntry в lib/portfolio.ts). Отдельная SQL-таблица с
-- FK на profiles тут была бы избыточна: id записи нужен только для
-- React key и удаления одной конкретной записи на клиенте, никакие
-- другие таблицы на эти записи не ссылаются — тот же случай, что и у
-- text[]-полей вроде tech_stack, просто с более сложным элементом
-- массива. Порядок в массиве — порядок добавления, менять местами пока
-- нельзя (можно удалить и добавить заново в нужном порядке).
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS portfolio_experience jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS portfolio_projects   jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Тема оформления — id из lib/portfolio.ts PORTFOLIO_THEMES (classic,
-- fantasy, space, anime, matrix, medieval, minimal, nature, conspiracy,
-- horror). Тот же принцип конечного справочника без CHECK на уровне БД,
-- что и у portfolio_sections/tech_stack/role_tag — getPortfolioTheme()
-- в lib/portfolio.ts откатывается на 'classic' при неизвестном/битом
-- значении, так что даже руками испорченная колонка не ломает страницу.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS portfolio_theme text NOT NULL DEFAULT 'classic';

-- Ручная сортировка разделов — id из PORTFOLIO_SECTIONS в том порядке,
-- в котором пользователь сам их расставил (кнопки "вверх"/"вниз" во
-- вкладке Портфолио), а не фиксированный порядок каталога. Пустой
-- массив (значение по умолчанию — ни у кого ещё нет сохранённой
-- сортировки) значит "рисовать в порядке каталога", см.
-- fullSectionOrder()/orderedEnabledSections() в lib/portfolio.ts — одна
-- и та же функция решает порядок и для живого превью, и для публичной
-- веб-страницы портфолио, и для экспорта PNG. Хранит позиции ВСЕХ 12
-- разделов, включая выключенные — чтобы выключенный раздел не терял
-- своё место в списке, если его потом снова включат.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS portfolio_section_order text[] NOT NULL DEFAULT '{}'::text[];

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
--
-- Веб-версия портфолио (app/[locale]/u/[username]/portfolio/page.tsx,
-- components/portfolio/PublicPortfolioView.tsx) — наоборот, читает
-- профиль анонимным клиентом через ту же profiles_select_public, что и
-- обычная публичная страница профиля (/u/[username]): видна ровно тем
-- же посетителям и ровно тогда же, когда включена "Показывать профиль
-- по прямой ссылке" (profiles.is_public) во вкладке Настройки —
-- отдельного тумблера специально под портфолио не заводили, чтобы не
-- плодить два разных выключателя видимости для одного и того же
-- профиля.
