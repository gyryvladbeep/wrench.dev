-- ═══════════════════════════════════════════════════════
-- Workbench — персональные страницы из нескольких инструментов
-- ═══════════════════════════════════════════════════════
-- Один ряд = один именованный набор инструментов пользователя.
-- tool_slugs хранит порядок инструментов внутри набора обычным text[],
-- а не отдельной таблицей связей — порядок и принадлежность имеют
-- смысл только в контексте одного workbench, отдельная таблица тут
-- была бы лишней сложностью.

CREATE TABLE IF NOT EXISTS workbenches (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL DEFAULT 'My Workbench',
  tool_slugs  text[] NOT NULL DEFAULT '{}',
  position    integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE workbenches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workbenches_select" ON workbenches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "workbenches_insert" ON workbenches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "workbenches_update" ON workbenches FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "workbenches_delete" ON workbenches FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_workbenches_user ON workbenches(user_id, position);
