-- BarBuddy: Amazon Cognito signs users in (paper Table 3.3); Supabase keeps the
-- BarBuddy profile, role and account status, and the backend grants access from
-- them. cognito_sub links a profile to its Cognito user (the token's "sub").
-- auth_user_id stays for accounts created with Supabase Auth: their first
-- Cognito sign-in moves them over (user migration trigger) and links them.
-- Additive only.
ALTER TABLE public.bb_users_tbl
  ADD COLUMN IF NOT EXISTS cognito_sub text;

CREATE UNIQUE INDEX IF NOT EXISTS bb_users_cognito_sub_key
  ON public.bb_users_tbl (cognito_sub)
  WHERE cognito_sub IS NOT NULL;
