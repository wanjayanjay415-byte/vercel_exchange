/*
  # Fix Exchange Platform Schema

  ## Changes Made
    1. Drop existing tables if they exist with incorrect RLS
    2. Recreate all tables without RLS dependencies on auth.uid()
    3. Use anon access policies since this app uses custom authentication
    4. Allow anonymous users to perform operations (custom auth handled in app)

  ## Tables
    - `users` - User accounts with username/password
    - `balances` - User cryptocurrency balances
    - `transactions` - Transaction history
    - `deposit_addresses` - Deposit addresses for each currency

  ## Security
    - RLS enabled on all tables
    - Anonymous access allowed (app handles auth)
    - Data isolation handled at application level
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS balances CASCADE;
DROP TABLE IF EXISTS deposit_addresses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create balances table
CREATE TABLE balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  currency text NOT NULL,
  amount text DEFAULT '0' NOT NULL,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, currency)
);

-- Create transactions table
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  currency text NOT NULL,
  amount text NOT NULL,
  from_currency text,
  to_currency text,
  status text DEFAULT 'completed' NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create deposit addresses table
CREATE TABLE deposit_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  currency text UNIQUE NOT NULL,
  address text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposit_addresses ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow anon access (custom auth in app)
CREATE POLICY "Allow all operations on users"
  ON users FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on balances"
  ON balances FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on transactions"
  ON transactions FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on deposit_addresses"
  ON deposit_addresses FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Insert deposit addresses
INSERT INTO deposit_addresses (currency, address) VALUES
  ('USDT', '0x53add575cc415f17f60c3bc65c4a8ce7a217309f'),
  ('BNB', '0x53add575cc415f17f60c3bc65c4a8ce7a217309f'),
  ('ETH', '0x53add575cc415f17f60c3bc65c4a8ce7a217309f'),
  ('BASE', '0x53add575cc415f17f60c3bc65c4a8ce7a217309f'),
  ('SOL', 'GApediwXymfKmbweEha7Gp1XG83ikrnzTQZX7wAvDMMt')
ON CONFLICT (currency) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_balances_user_id ON balances(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);