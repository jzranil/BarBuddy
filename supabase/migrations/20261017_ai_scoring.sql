-- BarBuddy: the AI (Gemini) scores each essay; Review Administrators mark the
-- AI result as lawyer verified, or flag it with an annotation (and may give a
-- corrected score). Additive only.
ALTER TABLE public.bb_feedbacks_tbl
  ADD COLUMN IF NOT EXISTS ai_score numeric(2,1) CHECK (ai_score IS NULL OR (ai_score >= 0 AND ai_score <= 5)),
  ADD COLUMN IF NOT EXISTS ai_alac jsonb;
