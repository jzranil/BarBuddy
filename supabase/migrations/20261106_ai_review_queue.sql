-- BarBuddy: AI (Gemini) reviews run from a scheduled job (EventBridge → Lambda
-- once a minute) instead of in the background of the submit request, since a
-- Lambda freezes once it has answered. ai_claimed_at records when a run took
-- an essay, so one left in 'processing' by a run that stopped midway is picked
-- up again after 10 minutes. Additive only.
ALTER TABLE public.bb_feedbacks_tbl
  ADD COLUMN IF NOT EXISTS ai_claimed_at timestamptz;

-- The scheduled job looks up the queue every minute
CREATE INDEX IF NOT EXISTS bb_feedbacks_ai_queue_idx
  ON public.bb_feedbacks_tbl (ai_status)
  WHERE ai_status IN ('pending', 'processing');
