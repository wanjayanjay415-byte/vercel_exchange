/*
  # Create Exchange Platform Schema

  ## 1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `username` (text, unique) - User's login username
      - `password` (text) - Hashed password
      - `created_at` (timestamptz) - Account creation timestamp
    
    - `balances`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `currency` (text) - Currency type (USDT, BNB, ETH, SOL)
      - `amount` (decimal) - Balance amount
      - `updated_at` (timestamptz) - Last update timestamp
    
    - `transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `type` (text) - Transaction type (deposit, withdraw, swap)
      - `currency` (text) - Currency involved
      - `amount` (decimal) - Transaction amount
      - `from_currency` (text, nullable) - For swap transactions
      - `to_currency` (text, nullable) - For swap transactions
      - `status` (text) - Transaction status (pending, completed, failed)
      - `created_at` (timestamptz) - Transaction timestamp
    
    - `deposit_addresses`
      - `id` (uuid, primary key)
      - `currency` (text, unique) - Currency type
      - `address` (text) - Deposit address
      - `created_at` (timestamptz)

  ## 2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - Deposit addresses are publicly readable for deposits

  ## 3. Initial Data
    - Pre-populate deposit addresses for USDT, BNB, ETH, BASE, and SOL
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create balances table
CREATE TABLE IF NOT EXISTS balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  currency text NOT NULL,
  amount decimal(20, 8) DEFAULT 0 NOT NULL,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, currency)
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  currency text NOT NULL,
  amount decimal(20, 8) NOT NULL,
  from_currency text,
  to_currency text,
  status text DEFAULT 'completed' NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create deposit addresses table
CREATE TABLE IF NOT EXISTS deposit_addresses (
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

-- RLS Policies for users table
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for balances table
CREATE POLICY "Users can view own balances"
  ON balances FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own balances"
  ON balances FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own balances"
  ON balances FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for transactions table
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for deposit addresses (public read)
CREATE POLICY "Anyone can view deposit addresses"
  ON deposit_addresses FOR SELECT
  TO anon, authenticated
  USING (true);

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