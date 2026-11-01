-- BarBuddy: reviewees highlight text on their submitted assessment results
-- (the question, their answer and the suggested answer). Highlights are private
-- to the reviewee and point into the text by position, so the answers themselves
-- stay untouched. Additive only.

-- bb_user_submissions_tbl predates these migrations, so the column type is read
-- from the table instead of being assumed.
DO $$
DECLARE
  submission_id_type text;
BEGIN
  SELECT format_type(a.atttypid, a.atttypmod) INTO submission_id_type
  FROM pg_attribute a
  WHERE a.attrelid = 'public.bb_user_submissions_tbl'::regclass
    AND a.attname = 'user_submission_id';

  EXECUTE format($sql$
    CREATE TABLE IF NOT EXISTS public.bb_user_highlights_tbl (
      highlight_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES public.bb_users_tbl(user_id) ON DELETE CASCADE,
      assessment_id uuid NOT NULL REFERENCES public.bb_assessments_tbl(assessment_id) ON DELETE CASCADE,
      user_submission_id %s NOT NULL REFERENCES public.bb_user_submissions_tbl(user_submission_id) ON DELETE CASCADE,
      highlight_target text NOT NULL CHECK (highlight_target IN ('question', 'answer', 'model_answer')),
      start_offset integer NOT NULL CHECK (start_offset >= 0),
      end_offset integer NOT NULL,
      highlight_quote text NOT NULL,
      highlight_color text NOT NULL DEFAULT 'yellow' CHECK (highlight_color IN ('yellow', 'green', 'pink')),
      created_at timestamptz NOT NULL DEFAULT now(),
      CHECK (end_offset > start_offset)
    )
  $sql$, submission_id_type);
END $$;

CREATE INDEX IF NOT EXISTS bb_user_highlights_assessment_idx ON public.bb_user_highlights_tbl (assessment_id, user_id);
CREATE INDEX IF NOT EXISTS bb_user_highlights_submission_idx ON public.bb_user_highlights_tbl (user_submission_id);

-- The backend uses the secret (service role) key, so the table is locked to
-- direct browser access like the others.
ALTER TABLE public.bb_user_highlights_tbl ENABLE ROW LEVEL SECURITY;
