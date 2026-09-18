-- ═══════════════════════════════════════════════════════
-- Миграция: peer-эндорсементы навыков (roadmap item 2)
-- ═══════════════════════════════════════════════════════
-- Выполнить ОДИН РАЗ в SQL Editor Supabase (Dashboard → SQL Editor →
-- New query → вставить и Run) — тот же процесс, что и у остальных
-- миграций в этой папке. Все операторы идемпотентны, безопасно
-- выполнить повторно.

-- profile_views — фиксирует факт "юзер A открыл публичный профиль
-- юзера B". Нужна только как анти-спам гейт для эндорсементов ниже:
-- эндорснуть можно только того, чей профиль ты реально открывал, а не
-- любой username, который просто знаешь. Это ровно та половина гейта
-- из ROADMAP-BRAINSTORM.md ("чей профиль ты видел"), которую можно
-- построить прямо сейчас — вторая половина ("кто ответил на твой
-- вопрос в базе знаний") пока невозможна: у базы знаний
-- (app/[locale]/knowledge) ещё нет Q&A/комментариев — это отдельный,
-- не построенный пункт 7 роадмапа.
CREATE TABLE IF NOT EXISTS profile_views (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_user_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE(viewer_id, viewed_user_id),
  CHECK (viewer_id <> viewed_user_id)
);

ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_views_select_own" ON profile_views FOR SELECT USING (auth.uid() = viewer_id);
CREATE POLICY "profile_views_insert_own" ON profile_views FOR INSERT WITH CHECK (auth.uid() = viewer_id);
-- UPDATE нужен для upsert (см. components/profile/SkillEndorsements.tsx),
-- который на повторный визит того же профиля обновляет viewed_at вместо
-- ошибки на UNIQUE-конфликт.
CREATE POLICY "profile_views_update_own" ON profile_views FOR UPDATE USING (auth.uid() = viewer_id) WITH CHECK (auth.uid() = viewer_id);

CREATE INDEX IF NOT EXISTS idx_profile_views_viewer ON profile_views(viewer_id);

-- skill_endorsements — сам эндорсемент: A подтверждает, что у B реально
-- есть навык X. skill_tag — id из lib/profile-stack.ts STACK_TAGS, тот
-- же принцип конечного справочника без CHECK на уровне БД, что уже у
-- role_tag/tech_stack (справочник живёт в приложении, не в базе).
-- Эндорсить можно только тег, который сам B уже выбрал в своём
-- tech_stack, — эта часть тоже проверяется в приложении
-- (SkillEndorsements.tsx показывает кнопку только для тегов из
-- profile.tech_stack), ровно как и остальные проверки принадлежности
-- тега справочнику в этой кодовой базе.
CREATE TABLE IF NOT EXISTS skill_endorsements (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endorser_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endorsee_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_tag    text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(endorser_id, endorsee_id, skill_tag),
  CHECK (endorser_id <> endorsee_id)
);

ALTER TABLE skill_endorsements ENABLE ROW LEVEL SECURITY;

-- Видно всем на публичном профиле (endorsee_id -> is_public = true, тот
-- же приём EXISTS, что уже есть у tool_history_select_public в
-- supabase/profile-public-migration.sql) плюс всегда видно самим
-- участникам — эндорсер должен видеть, кого он уже эндорснул (чтобы
-- показать состояние кнопки "уже эндорсено"), эндорси — кто его
-- эндорснул, даже если сам сейчас сделал профиль приватным.
CREATE POLICY "skill_endorsements_select_public" ON skill_endorsements FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = skill_endorsements.endorsee_id AND p.is_public = true)
);
CREATE POLICY "skill_endorsements_select_own" ON skill_endorsements FOR SELECT USING (
  auth.uid() = endorser_id OR auth.uid() = endorsee_id
);

-- Главный анти-спам гейт: вставить эндорсемент можно, только если
-- вставляющий (auth.uid()) уже есть в profile_views как viewer_id
-- именно этого endorsee_id — то есть реально открывал его профиль.
-- Обойти это снаружи тоже нечем: у skill_endorsements нет REST-обёртки
-- в app/api/v1/* и личные токены пункта 13 доступа к ней не дают.
CREATE POLICY "skill_endorsements_insert" ON skill_endorsements FOR INSERT WITH CHECK (
  auth.uid() = endorser_id
  AND endorser_id <> endorsee_id
  AND EXISTS (
    SELECT 1 FROM profile_views v
    WHERE v.viewer_id = auth.uid() AND v.viewed_user_id = skill_endorsements.endorsee_id
  )
);

-- Отозвать свой же эндорсемент — тот же UX, что уже есть у избранного
-- (★ снимается тем же кликом, которым ставится).
CREATE POLICY "skill_endorsements_delete" ON skill_endorsements FOR DELETE USING (auth.uid() = endorser_id);

CREATE INDEX IF NOT EXISTS idx_skill_endorsements_endorsee ON skill_endorsements(endorsee_id);
CREATE INDEX IF NOT EXISTS idx_skill_endorsements_endorser ON skill_endorsements(endorser_id);
