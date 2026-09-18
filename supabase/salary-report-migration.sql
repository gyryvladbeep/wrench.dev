-- ═══════════════════════════════════════════════════════
-- Миграция: публичный "срез рынка" зарплат (/salary/report)
-- ═══════════════════════════════════════════════════════
-- Выполнить ОДИН РАЗ в SQL Editor Supabase (Dashboard → SQL Editor →
-- New query → вставить и Run), ДО деплоя фронтенда. Требует уже
-- накатанной supabase/salary-calculator-migration.sql (таблица
-- salary_submissions и её RLS-политика) — эта миграция только
-- добавляет две новые SECURITY DEFINER функции поверх неё, саму
-- таблицу не трогает. Идемпотентно, безопасно выполнить повторно.
--
-- Пункт 23 из ROADMAP-BRAINSTORM.md — "авто-обновляемый отчёт на
-- основе агрегатов уже существующего калькулятора зарплат". В отличие
-- от get_salary_stats() (одна комбинация роль+уровень+страна за
-- вызов, под интерактивный фильтр в components/salary/SalaryClient.tsx),
-- функции ниже отдают ВЕСЬ срез одним запросом — так и задумана
-- отдельная публичная страница-отчёт: один SSR-рендер, без клиентских
-- фильтров.
--
-- Тот же порог анонимности count(*) >= 3, что и в get_salary_stats() —
-- см. подробный комментарий в supabase/salary-calculator-migration.sql.
-- sample_size отдаётся всегда (не чувствителен сам по себе), остальные
-- поля — NULL, если порог не достигнут; фронтенд
-- (components/salary/SalaryReportTable.tsx) показывает такие строки
-- как "недостаточно данных" вместо чисел.

CREATE OR REPLACE FUNCTION get_salary_report_by_role()
RETURNS TABLE (
  role_tag    text,
  seniority   text,
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
    role_tag,
    seniority,
    count(*)::integer AS sample_size,
    CASE WHEN count(*) >= 3 THEN percentile_cont(0.5) WITHIN GROUP (ORDER BY monthly_salary_usd) END AS median_usd,
    CASE WHEN count(*) >= 3 THEN round(avg(monthly_salary_usd)) END AS avg_usd,
    CASE WHEN count(*) >= 3 THEN min(monthly_salary_usd) END AS min_usd,
    CASE WHEN count(*) >= 3 THEN max(monthly_salary_usd) END AS max_usd
  FROM salary_submissions
  GROUP BY role_tag, seniority;
$$;

GRANT EXECUTE ON FUNCTION get_salary_report_by_role() TO anon, authenticated;

-- Срез по стране, безотносительно роли/уровня — при малом числе
-- откликов на старте это, скорее всего, первая разбивка, которая
-- реально преодолевает порог в 3 (комбинации роль+уровень+страна
-- дробят и без того небольшую выборку намного сильнее).
CREATE OR REPLACE FUNCTION get_salary_report_by_country()
RETURNS TABLE (
  country     text,
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
    country,
    count(*)::integer AS sample_size,
    CASE WHEN count(*) >= 3 THEN percentile_cont(0.5) WITHIN GROUP (ORDER BY monthly_salary_usd) END AS median_usd,
    CASE WHEN count(*) >= 3 THEN round(avg(monthly_salary_usd)) END AS avg_usd,
    CASE WHEN count(*) >= 3 THEN min(monthly_salary_usd) END AS min_usd,
    CASE WHEN count(*) >= 3 THEN max(monthly_salary_usd) END AS max_usd
  FROM salary_submissions
  GROUP BY country
  ORDER BY sample_size DESC, country;
$$;

GRANT EXECUTE ON FUNCTION get_salary_report_by_country() TO anon, authenticated;
