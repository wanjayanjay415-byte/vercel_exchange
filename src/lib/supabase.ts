import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface User {
  id: string;
  username: string;
  email?: string;
  created_at: string;
}

export interface Balance {
  id: string;
  user_id: string;
  currency: string;
  amount: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: string;
  currency: string;
  amount: string;
  from_currency?: string;
  to_currency?: string;
  status: string;
  created_at: string;
}

export interface DepositAddress {
  id: string;
  currency: string;
  address: string;
  created_at: string;
}
