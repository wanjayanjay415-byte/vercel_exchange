-- Disable bonus claim for all users (idempotent)
-- 1) Ensure users.bonus_claimed exists and default true
-- 2) Set existing users to bonus_claimed = true
-- 3) If bonus_claims table exists, insert fallback records for users without one

DO $$
BEGIN
  -- 1) Add column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'bonus_claimed'
  ) THEN
    EXECUTE 'ALTER TABLE public.users ADD COLUMN bonus_claimed boolean DEFAULT true';
  END IF;

  -- 2) Mark all existing users as having claimed the bonus
  EXECUTE 'UPDATE public.users SET bonus_claimed = true WHERE bonus_claimed IS DISTINCT FROM true';

  -- 3) If bonus_claims table exists, insert a fallback record (amount_usd=300) for users
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bonus_claims') THEN
    -- Insert only for users without an entry in bonus_claims
    EXECUTE $$
      INSERT INTO public.bonus_claims (user_id, currency, amount_usd)
      SELECT u.id, 'USDT', 300
      FROM public.users u
      WHERE NOT EXISTS (SELECT 1 FROM public.bonus_claims b WHERE b.user_id = u.id)
    $$;
  END IF;
END
$$;
