-- Create a fallback table to persist bonus claims when users table schema is not updated
CREATE TABLE IF NOT EXISTS bonus_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  currency text NOT NULL,
  amount_usd numeric(20,8) NOT NULL DEFAULT 300,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Allow simple SELECT/INSERT by the app; RLS/more advanced policies can be added later.