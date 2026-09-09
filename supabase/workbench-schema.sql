-- ═══════════════════════════════════════════════════════
-- Workbench — персональные страницы из нескольких инструментов
-- ═══════════════════════════════════════════════════════
-- Один ряд = один именованный набор инструментов пользователя.
-- tool_slugs хранит порядок инструментов внутри набора обычным text[],
-- а не отдельной таблицей связей — порядок и принадлежность имеют
-- смысл только в контексте одного workbench, отдельная таблица тут
-- была бы лишней сложностью.
--
-- layout хранит позицию каждой карточки на свободном холсте (x/y в
-- пикселях), по slug'у инструмента — jsonb, а не отдельные колонки,
-- потому что набор ключей заранее не известен и меняется вместе с
-- tool_slugs. is_public включает read-only доступ по прямой ссылке
-- (см. политику workbenches_select_public ниже и app/[locale]/w/[id]).

CREATE TABLE IF NOT EXISTS workbenches (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL DEFAULT 'My Workbench',
  tool_slugs  text[] NOT NULL DEFAULT '{}',
  position    integer NOT NULL DEFAULT 0,
  layout      jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_public   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE workbenches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workbenches_select" ON workbenches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "workbenches_insert" ON workbenches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "workbenches_update" ON workbenches FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "workbenches_delete" ON workbenches FOR DELETE USING (auth.uid() = user_id);

-- Публичная read-only ссылка: любой (в т.ч. анонимный посетитель) может
-- прочитать ряд, если владелец включил is_public — но не изменить и не
-- увидеть чужие приватные рабочие столы, для которых is_public = false.
-- Отдельная политика, а не ослабление workbenches_select, потому что
-- Postgres RLS объединяет политики одного действия через OR — так обе
-- ветки доступа (свой владелец / публичный флаг) остаются явными и
-- независимо читаемыми.
CREATE POLICY "workbenches_select_public" ON workbenches FOR SELECT USING (is_public = true);

CREATE INDEX IF NOT EXISTS idx_workbenches_user ON workbenches(user_id, position);
