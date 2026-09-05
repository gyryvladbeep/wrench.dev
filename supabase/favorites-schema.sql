-- ═══════════════════════════════════════════════════════
-- Favorites — synced to the account, not just localStorage
-- ═══════════════════════════════════════════════════════
-- До этой правки ★ избранное хранилось ТОЛЬКО в localStorage браузера,
-- даже для залогиненных пользователей — вкладка "Избранное" в профиле
-- читала тот же localStorage. Эта таблица даёт настоящее хранилище
-- на аккаунт, синхронизированное между устройствами.

CREATE TABLE IF NOT EXISTS favorites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_slug   text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, tool_slug) -- нельзя добавить один и тот же инструмент дважды
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "favorites_select" ON favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favorites_insert" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites_delete" ON favorites FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);