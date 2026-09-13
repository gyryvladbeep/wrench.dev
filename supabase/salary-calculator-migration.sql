-- ═══════════════════════════════════════════════════════
-- Миграция: калькулятор зарплат QA/Dev (/salary)
-- ═══════════════════════════════════════════════════════
-- Выполнить ОДИН РАЗ в SQL Editor Supabase (Dashboard → SQL Editor →
-- New query → вставить и Run), ДО деплоя фронтенда — без этой миграции
-- страница /salary будет падать при любой попытке отправить форму или
-- посчитать статистику. Все операторы идемпотентны, безопасно выполнить
-- повторно.

-- Одна строка на пользователя (как user_streaks) — не история изменений,
-- а текущее значение: если человек сменил работу или получил повышение,
-- он обновляет свою же запись, а не добавляет новую. Это же убирает
-- необходимость решать, какую из нескольких записей одного человека
-- учитывать в статистике.
CREATE TABLE IF NOT EXISTS salary_submissions (
  user_id             uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role_tag            text NOT NULL,
  seniority           text NOT NULL,
  years_experience    numeric NOT NULL,
  country             text NOT NULL,
  employment_type     text NOT NULL DEFAULT 'remote',
  monthly_salary_usd  numeric NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE salary_submissions ENABLE ROW LEVEL SECURITY;

-- Сырые строки таблицы НЕ читаются публично ни при каких условиях —
-- в отличие от профиля или Workbench, здесь нет отдельного is_public
-- переключателя, потому что скрывать тут нечего: зарплата привязана
-- к user_id, и открыть сырую таблицу означало бы дать возможность
-- сопоставить чью-то зарплату с его же публичным профилем (username
-- виден в profiles при is_public = true) через общий user_id. Поэтому
-- единственная политика — доступ строго к своей же строке, а вся
-- публичная агрегированная статистика идёт через SECURITY DEFINER
-- функции ниже, которые читают таблицу от имени владельца функции в
-- обход RLS и отдают наружу только агрегаты, не сырые записи.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'salary_submissions' AND policyname = 'salary_submissions_own_row'
  ) THEN
    CREATE POLICY "salary_submissions_own_row" ON salary_submissions
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Статистика по роли, с опциональным уточнением по уровню и стране.
-- HAVING count(*) >= 3 — намеренный порог анонимности: если под
-- выбранными фильтрами наберётся 1-2 человека, показывать точную сумму
-- значило бы фактически раскрыть зарплату кого-то одного конкретного
-- человека, даже не называя его по имени. Вместо ошибки функция всегда
-- возвращает sample_size (это не чувствительно само по себе — просто
-- количество откликов), а остальные поля — NULL, если порог не
-- достигнут; фронтенд (components/salary/SalaryClient.tsx) сам решает,
-- что показать при NULL, и умеет ослаблять фильтры (сначала пробует
-- роль+уровень+страна, потом роль+уровень, потом только роль).
CREATE OR REPLACE FUNCTION get_salary_stats(
  p_role text,
  p_seniority text DEFAULT NULL,
  p_country text DEFAULT NULL
)
RETURNS TABLE (
  sample_size integer,
  median_usd  numeric,
  avg_usd     numeric,
  min_usd     numeric,
  max_usd     numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    count(*)::integer AS sample_size,
    CASE WHEN count(*) >= 3 THEN percentile_cont(0.5) WITHIN GROUP (ORDER BY monthly_salary_usd) END AS median_usd,
    CASE WHEN count(*) >= 3 THEN round(avg(monthly_salary_usd)) END AS avg_usd,
    CASE WHEN count(*) >= 3 THEN min(monthly_salary_usd) END AS min_usd,
    CASE WHEN count(*) >= 3 THEN max(monthly_salary_usd) END AS max_usd
  FROM salary_submissions
  WHERE role_tag = p_role
    AND (p_seniority IS NULL OR seniority = p_seniority)
    AND (p_country IS NULL OR country = p_country);
$$;

GRANT EXECUTE ON FUNCTION get_salary_stats(text, text, text) TO anon, authenticated;

-- Общее число откликов по всему инструменту — безопасно показывать
-- всегда, независимо от порога анонимности: само по себе число
-- участников не раскрывает ничьей конкретной зарплаты. Используется
-- фронтендом для баннера вида "N человек уже поделились своей зарплатой"
-- / приглашения быть одним из первых, пока откликов мало.
CREATE OR REPLACE FUNCTION get_salary_submission_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer FROM salary_submissions;
$$;

GRANT EXECUTE ON FUNCTION get_salary_submission_count() TO anon, authenticated;
