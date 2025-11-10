-- Add bonus claim columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS bonus_claimed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS bonus_currency text,
  ADD COLUMN IF NOT EXISTS bonus_claimed_at timestamptz;
