-- ═══════════════════════════════════════════════════════
-- Миграция: ужесточение INSERT-политики skill_endorsements
-- (security audit 2026-09-23, дополняет skill-endorsements-migration.sql)
-- ═══════════════════════════════════════════════════════
-- Выполнить ОДИН РАЗ в SQL Editor Supabase (Dashboard → SQL Editor →
-- New query → вставить и Run), ПОСЛЕ skill-endorsements-migration.sql.
-- Идемпотентно, безопасно выполнить повторно.

-- Находка аудита: комментарий у исходной таблицы (см.
-- skill-endorsements-migration.sql) описывает намерение "эндорсить
-- можно только тег, который сам B уже выбрал в своём tech_stack", но
-- эта проверка была реализована ТОЛЬКО на клиенте — components/profile/
-- SkillEndorsements.tsx показывает кнопку лишь для тегов из
-- profile.tech_stack, однако сама RLS-политика INSERT это не
-- проверяла. Любой залогиненный пользователь мог отправить
-- .insert({endorser_id, endorsee_id, skill_tag: "что угодно"}) напрямую
-- через supabase-js (в обход UI, например из консоли браузера) —
-- анти-спам гейт profile_views при этом всё ещё соблюдался (нужно
-- реально открыть профиль), но сам skill_tag мог быть произвольной
-- строкой, не входящей ни в справочник STACK_TAGS, ни в tech_stack
-- эндорси. Прямой XSS отсюда не следовало (skill_tag всегда проходит
-- через getStackTag() при отображении, неизвестный id просто
-- отфильтровывается), но это позволяло накручивать countDistinctEndorsedSkills
-- (roadmap item 1, бейдж cross_endorsed) произвольными "навыками",
-- которых у человека нет — ровно то честности сигнала, ради которого
-- и был выбран peer-эндорсемент как основа бейджа, а не сырая
-- самозаявленная статистика.
--
-- Фикс: та же проверка теперь и в самой политике — skill_tag обязан
-- входить в tech_stack эндорсируемого профиля на момент вставки.
DROP POLICY IF EXISTS "skill_endorsements_insert" ON skill_endorsements;

CREATE POLICY "skill_endorsements_insert" ON skill_endorsements FOR INSERT WITH CHECK (
  auth.uid() = endorser_id
  AND endorser_id <> endorsee_id
  AND EXISTS (
    SELECT 1 FROM profile_views v
    WHERE v.viewer_id = auth.uid() AND v.viewed_user_id = skill_endorsements.endorsee_id
  )
  AND EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = skill_endorsements.endorsee_id
      AND skill_endorsements.skill_tag = ANY (p.tech_stack)
  )
);
