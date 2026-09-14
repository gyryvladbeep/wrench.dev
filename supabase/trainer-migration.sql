-- ═══════════════════════════════════════════════════════
-- Миграция: тренажёр кода (/trainer)
-- ═══════════════════════════════════════════════════════
-- Выполнить ОДИН РАЗ в SQL Editor Supabase (Dashboard → SQL Editor →
-- New query → вставить и Run), ДО деплоя фронтенда. Без этой миграции
-- страница /trainer будет полностью рабочей (упражнения статичные,
-- живут в lib/trainer/exercises.ts, а не в БД) — не сохранится только
-- прогресс между визитами для залогиненных пользователей.

-- Сами упражнения — статический контент в коде (как и все 80+
-- инструментов в lib/tools-registry.ts), не строки в БД: их курирует
-- разработчик, а не пользователи, и добавление нового упражнения не
-- требует миграции. В БД хранится только факт "пользователь X решил
-- упражнение Y" — этого достаточно, чтобы показать галочки и прогресс
-- по категориям.
CREATE TABLE IF NOT EXISTS trainer_progress (
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id  text NOT NULL,
  solved_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, exercise_id)
);

ALTER TABLE trainer_progress ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'trainer_progress' AND policyname = 'trainer_progress_own_row'
  ) THEN
    CREATE POLICY "trainer_progress_own_row" ON trainer_progress
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
