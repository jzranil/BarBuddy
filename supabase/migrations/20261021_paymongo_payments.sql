-- BarBuddy: online payment through PayMongo Checkout (GCash, Maya, cards).
-- Each row is one payment link. payment_token is the shareable link token:
-- anyone holding it can pay for the reviewee's package until
-- payment_expires_at (10 minutes after creation). Additive only.
ALTER TABLE public.bb_payments_tbl
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS payment_amount numeric(10,2),
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'expired', 'cancelled', 'failed')),
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS payment_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS payer_name text,
  ADD COLUMN IF NOT EXISTS payer_email text,
  ADD COLUMN IF NOT EXISTS paymongo_checkout_id text,
  ADD COLUMN IF NOT EXISTS paymongo_checkout_url text,
  ADD COLUMN IF NOT EXISTS paymongo_payment_id text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS bb_payments_token_key
  ON public.bb_payments_tbl (payment_token) WHERE payment_token IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS bb_payments_checkout_key
  ON public.bb_payments_tbl (paymongo_checkout_id) WHERE paymongo_checkout_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS bb_payments_pending_idx
  ON public.bb_payments_tbl (payment_expires_at) WHERE payment_status = 'pending';
CREATE INDEX IF NOT EXISTS bb_payments_user_idx
  ON public.bb_payments_tbl (user_id, created_at DESC);
