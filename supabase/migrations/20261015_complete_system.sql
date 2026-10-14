-- BarBuddy: tables and columns needed to complete the system described in
-- the capstone paper (Chapter 1 scope, Chapter 3 functional requirements).
-- Additive only: no existing table, column or row is dropped or rewritten.
-- Payment/subscription and AI integration are intentionally out of scope.

-- ---------------------------------------------------------------------------
-- 1. Assessment sessions (daily questions, mock bar, subject practice)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bb_assessments_tbl (
  assessment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.bb_users_tbl(user_id) ON DELETE CASCADE,
  assessment_type text NOT NULL CHECK (assessment_type IN ('daily', 'mock', 'practice')),
  question_subject_id uuid REFERENCES public.bb_question_subjects_tbl(question_subject_id),
  assessment_title text NOT NULL,
  assessment_status text NOT NULL DEFAULT 'in_progress' CHECK (assessment_status IN ('in_progress', 'submitted')),
  reading_minutes integer NOT NULL DEFAULT 0 CHECK (reading_minutes >= 0),
  time_limit_minutes integer NOT NULL CHECK (time_limit_minutes > 0),
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  submitted_at timestamptz,
  auto_submitted boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assessments_user ON public.bb_assessments_tbl (user_id, started_at DESC);

-- One daily question set per reviewee per (Philippine) day
CREATE UNIQUE INDEX IF NOT EXISTS bb_assessments_one_daily_per_day
  ON public.bb_assessments_tbl (user_id, ((started_at AT TIME ZONE 'Asia/Manila')::date))
  WHERE assessment_type = 'daily';

-- ---------------------------------------------------------------------------
-- 2. Essay submissions: drafts (auto-save), status and per-question order
-- ---------------------------------------------------------------------------
ALTER TABLE public.bb_user_submissions_tbl
  ADD COLUMN IF NOT EXISTS assessment_id uuid REFERENCES public.bb_assessments_tbl(assessment_id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS question_order integer,
  ADD COLUMN IF NOT EXISTS submission_status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS word_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_flagged boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz;

DO $$ BEGIN
  ALTER TABLE public.bb_user_submissions_tbl
    ADD CONSTRAINT bb_user_submissions_status_check CHECK (submission_status IN ('draft', 'submitted'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- A question appears once per assessment (prevents duplicate submissions)
CREATE UNIQUE INDEX IF NOT EXISTS bb_user_submissions_assessment_question_unique
  ON public.bb_user_submissions_tbl (assessment_id, question_id);

CREATE INDEX IF NOT EXISTS idx_user_submissions_user ON public.bb_user_submissions_tbl (user_id, submitted_at DESC);

-- ---------------------------------------------------------------------------
-- 3. Feedback: lawyer verification on the five-point scale + ALAC components
--    feedback_score            = verified five-point score (0-5)
--    feedback_comment          = lawyer's comments
--    feedback_answer_comment   = automated (non-AI) ALAC structure check summary
-- ---------------------------------------------------------------------------
ALTER TABLE public.bb_feedbacks_tbl
  ADD COLUMN IF NOT EXISTS feedback_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS alac_answer smallint,
  ADD COLUMN IF NOT EXISTS alac_legal_basis smallint,
  ADD COLUMN IF NOT EXISTS alac_application smallint,
  ADD COLUMN IF NOT EXISTS alac_conclusion smallint,
  ADD COLUMN IF NOT EXISTS structure_check jsonb,
  ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES public.bb_users_tbl(user_id),
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;

DO $$ BEGIN
  ALTER TABLE public.bb_feedbacks_tbl
    ADD CONSTRAINT bb_feedbacks_status_check CHECK (feedback_status IN ('pending', 'verified', 'flagged'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.bb_feedbacks_tbl
    ADD CONSTRAINT bb_feedbacks_score_check CHECK (feedback_score IS NULL OR (feedback_score >= 0 AND feedback_score <= 5));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ALAC component ratings: 0 = missing, 1 = partial, 2 = complete
DO $$ BEGIN
  ALTER TABLE public.bb_feedbacks_tbl
    ADD CONSTRAINT bb_feedbacks_alac_check CHECK (
      (alac_answer IS NULL OR alac_answer BETWEEN 0 AND 2) AND
      (alac_legal_basis IS NULL OR alac_legal_basis BETWEEN 0 AND 2) AND
      (alac_application IS NULL OR alac_application BETWEEN 0 AND 2) AND
      (alac_conclusion IS NULL OR alac_conclusion BETWEEN 0 AND 2)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 4. Engagement: XP, streaks (bb_user_analytics_tbl is linked from bb_users_tbl)
-- ---------------------------------------------------------------------------
ALTER TABLE public.bb_user_analytics_tbl
  ADD COLUMN IF NOT EXISTS user_analytics_xp integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS user_analytics_longest_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS user_analytics_last_active date;

-- ---------------------------------------------------------------------------
-- 5. Badges and achievements: conditions, rewards and awards
-- ---------------------------------------------------------------------------
ALTER TABLE public.bb_achievements_tbl
  ADD COLUMN IF NOT EXISTS achievement_desc text,
  ADD COLUMN IF NOT EXISTS achievement_condition text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS achievement_threshold numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS achievement_xp_reward integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS achievement_rarity text,
  ADD COLUMN IF NOT EXISTS achievement_category text,
  ADD COLUMN IF NOT EXISTS question_subject_id uuid REFERENCES public.bb_question_subjects_tbl(question_subject_id);

DO $$ BEGIN
  ALTER TABLE public.bb_achievements_tbl
    ADD CONSTRAINT bb_achievements_condition_check CHECK (achievement_condition IN (
      'manual', 'questions_completed', 'study_streak', 'exams_completed', 'perfect_scores',
      'study_sessions', 'subjects_mastered', 'bar_readiness', 'subject_score', 'xp_earned'
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.bb_user_achievements_tbl (
  user_achievement_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.bb_users_tbl(user_id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES public.bb_achievements_tbl(achievement_id) ON DELETE CASCADE,
  awarded_by uuid REFERENCES public.bb_users_tbl(user_id),
  awarded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

-- ---------------------------------------------------------------------------
-- 6. Syllabi: Bar subject and examination day (bb_resources_tbl)
-- ---------------------------------------------------------------------------
ALTER TABLE public.bb_resources_tbl
  ADD COLUMN IF NOT EXISTS question_subject_id uuid REFERENCES public.bb_question_subjects_tbl(question_subject_id),
  ADD COLUMN IF NOT EXISTS exam_day smallint,
  ADD COLUMN IF NOT EXISTS resource_file_name text,
  ADD COLUMN IF NOT EXISTS resource_file_size integer;

DO $$ BEGIN
  ALTER TABLE public.bb_resources_tbl
    ADD CONSTRAINT bb_resources_exam_day_check CHECK (exam_day IS NULL OR exam_day BETWEEN 1 AND 4);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 7. System announcements (Super Admin)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bb_announcements_tbl (
  announcement_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_title text NOT NULL,
  announcement_body text NOT NULL,
  announcement_audience text NOT NULL DEFAULT 'all'
    CHECK (announcement_audience IN ('all', 'reviewee', 'lawyer', 'super_admin')),
  is_published boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.bb_users_tbl(user_id),
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 8. System settings (assessment time limits, reading period, question counts)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bb_settings_tbl (
  setting_key text PRIMARY KEY,
  setting_value jsonb NOT NULL,
  updated_by uuid REFERENCES public.bb_users_tbl(user_id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.bb_settings_tbl (setting_key, setting_value) VALUES
  ('assessment.daily',    '{"questions": 3,  "time_limit_minutes": 60,  "reading_minutes": 5}'),
  ('assessment.mock',     '{"questions": 20, "time_limit_minutes": 240, "reading_minutes": 15}'),
  ('assessment.practice', '{"questions": 5,  "time_limit_minutes": 90,  "reading_minutes": 5}')
ON CONFLICT (setting_key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 9. Row Level Security: the backend uses the secret (service role) key, so
--    the new tables are locked to direct browser access like the others.
-- ---------------------------------------------------------------------------
ALTER TABLE public.bb_assessments_tbl ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bb_user_achievements_tbl ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bb_announcements_tbl ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bb_settings_tbl ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 10. Starter badge / achievement catalog (same entries the reviewee portal
--     already showed), so the module is usable before admins add their own.
-- ---------------------------------------------------------------------------
INSERT INTO public.bb_achievement_types_tbl (achievement_type_desc)
SELECT v FROM (VALUES ('Badge'), ('Achievement')) AS t(v)
WHERE NOT EXISTS (SELECT 1 FROM public.bb_achievement_types_tbl WHERE achievement_type_desc = t.v);
