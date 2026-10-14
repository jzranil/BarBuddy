-- BarBuddy: review packages, 7 AM daily rollout, per-day Mock Bar exams,
-- AI (Gemini) comparison fields and the expanded badge catalog.
-- Additive: no data is deleted. Two CHECK constraints are widened.

-- ---------------------------------------------------------------------------
-- 1. Review packages (no payment yet): Package 1-4 x 7/14/45/65 days
-- ---------------------------------------------------------------------------
ALTER TABLE public.bb_subscriptions_tbl
  ADD COLUMN IF NOT EXISTS subscription_package smallint;

INSERT INTO public.bb_subscriptions_tbl (subscription_desc, subscription_duration, subscription_price, subscription_package, is_archived)
SELECT v.d, v.days, v.price, v.pkg, false
FROM (VALUES
  ('Package 1 — Day 1 Subjects', 65, 1099, 1), ('Package 1 — Day 1 Subjects', 45, 899, 1), ('Package 1 — Day 1 Subjects', 14, 399, 1), ('Package 1 — Day 1 Subjects', 7, 229, 1),
  ('Package 2 — Day 2 Subjects', 65, 1099, 2), ('Package 2 — Day 2 Subjects', 45, 899, 2), ('Package 2 — Day 2 Subjects', 14, 399, 2), ('Package 2 — Day 2 Subjects', 7, 229, 2),
  ('Package 3 — Day 3 Subjects', 65, 1099, 3), ('Package 3 — Day 3 Subjects', 45, 899, 3), ('Package 3 — Day 3 Subjects', 14, 399, 3), ('Package 3 — Day 3 Subjects', 7, 229, 3),
  ('Package 4 — All Subjects', 65, 1449, 4), ('Package 4 — All Subjects', 45, 1209, 4), ('Package 4 — All Subjects', 14, 449, 4), ('Package 4 — All Subjects', 7, 299, 4)
) AS v(d, days, price, pkg)
WHERE NOT EXISTS (
  SELECT 1 FROM public.bb_subscriptions_tbl s
  WHERE s.subscription_package = v.pkg AND s.subscription_duration = v.days
);

ALTER TABLE public.bb_users_tbl
  ADD COLUMN IF NOT EXISTS subscription_started_at timestamptz;

-- ---------------------------------------------------------------------------
-- 2. Assessments: rolled-out sets wait as 'ready' until the reviewee starts
--    them; Mock Bar exams belong to one examination day.
-- ---------------------------------------------------------------------------
ALTER TABLE public.bb_assessments_tbl DROP CONSTRAINT IF EXISTS bb_assessments_tbl_assessment_status_check;
ALTER TABLE public.bb_assessments_tbl
  ADD CONSTRAINT bb_assessments_tbl_assessment_status_check CHECK (assessment_status IN ('ready', 'in_progress', 'submitted'));

ALTER TABLE public.bb_assessments_tbl ALTER COLUMN expires_at DROP NOT NULL;

ALTER TABLE public.bb_assessments_tbl
  ADD COLUMN IF NOT EXISTS exam_day smallint CHECK (exam_day IS NULL OR exam_day BETWEEN 1 AND 3),
  ADD COLUMN IF NOT EXISTS opened_at timestamptz,
  ADD COLUMN IF NOT EXISTS feedback_viewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_sent_at timestamptz;

-- ---------------------------------------------------------------------------
-- 3. AI (Gemini) comparison against the suggested answer
-- ---------------------------------------------------------------------------
ALTER TABLE public.bb_feedbacks_tbl
  ADD COLUMN IF NOT EXISTS ai_status text NOT NULL DEFAULT 'not_configured',
  ADD COLUMN IF NOT EXISTS ai_feedback text,
  ADD COLUMN IF NOT EXISTS ai_accuracy text,
  ADD COLUMN IF NOT EXISTS ai_model text,
  ADD COLUMN IF NOT EXISTS ai_generated_at timestamptz;

-- ---------------------------------------------------------------------------
-- 4. Badge conditions from "BarBuddy Achievements & Badges"
-- ---------------------------------------------------------------------------
ALTER TABLE public.bb_achievements_tbl DROP CONSTRAINT IF EXISTS bb_achievements_condition_check;
ALTER TABLE public.bb_achievements_tbl
  ADD CONSTRAINT bb_achievements_condition_check CHECK (achievement_condition IN (
    'manual', 'study_streak', 'xp_earned', 'questions_completed', 'exams_completed', 'perfect_scores',
    'alac_complete', 'alac_master', 'score_improved', 'competency_gain', 'mastery_points',
    'subjects_mastered', 'groups_competent', 'group_score', 'subject_score', 'bar_readiness',
    'timed_completed', 'study_sessions', 'mock_full', 'daily_complete', 'daily_full_streak',
    'challenges_completed', 'feedback_reviewed', 'learn_improve', 'comeback', 'achievements_unlocked',
    'completionist'
  ));

ALTER TABLE public.bb_achievements_tbl
  ADD COLUMN IF NOT EXISTS achievement_subject_group text;

-- ---------------------------------------------------------------------------
-- 5. Mock Bar unlock rule (whichever is reached first) — editable in Settings
-- ---------------------------------------------------------------------------
INSERT INTO public.bb_settings_tbl (setting_key, setting_value) VALUES
  ('mock.unlock', '{"level": 4, "streak_days": 30}')
ON CONFLICT (setting_key) DO NOTHING;

UPDATE public.bb_settings_tbl
SET setting_value = jsonb_set(setting_value, '{questions}', '20')
WHERE setting_key = 'assessment.mock';
