import { supabase } from './supabase';

export async function registerUser(username: string, password: string) {
  const hashedPassword = await hashPassword(password);

  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (existingUser) {
    throw new Error('Username sudah digunakan');
  }

  const { data, error } = await supabase
    .from('users')
    .insert([{ username, password: hashedPassword }])
    .select()
    .single();

  if (error) throw error;

  const currencies = ['USDT', 'BNB', 'ETH', 'SOL', 'BASE'];
  const balanceInserts = currencies.map(currency => ({
    user_id: data.id,
    currency,
    amount: '0'
  }));

  await supabase.from('balances').insert(balanceInserts);

  return data;
}

export async function loginUser(username: string, password: string) {
  const hashedPassword = await hashPassword(password);

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .eq('password', hashedPassword)
    .maybeSingle();

  if (error || !data) {
    throw new Error('Username atau password salah');
  }

  return data;
}

export async function resetPassword(username: string, newPassword: string) {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (userError) throw userError;
  if (!user) throw new Error('Username tidak ditemukan');

  const hashedPassword = await hashPassword(newPassword);
  const { error } = await supabase
    .from('users')
    .update({ password: hashedPassword })
    .eq('id', user.id);

  if (error) throw error;

  return { success: true };
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
