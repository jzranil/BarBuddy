-- BarBuddy: AI API usage monitoring (paper UAT, Super Admin: "Monitor API usage
-- and system logs"; Figure 3.36: AI API usage on the Super Admin dashboard).
-- One row per Gemini request: model, outcome, tokens from the response's
-- usageMetadata, and response time. Written by the backend only. Additive only.
CREATE TABLE IF NOT EXISTS public.bb_ai_usage_tbl (
  ai_usage_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id text,
  ai_model text NOT NULL,
  ai_status text NOT NULL CHECK (ai_status IN ('ok', 'error')),
  http_status smallint,
  prompt_tokens integer,
  output_tokens integer,
  total_tokens integer,
  latency_ms integer,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bb_ai_usage_created_idx ON public.bb_ai_usage_tbl (created_at DESC);

-- The backend uses the secret (service role) key; no direct browser access
ALTER TABLE public.bb_ai_usage_tbl ENABLE ROW LEVEL SECURITY;
