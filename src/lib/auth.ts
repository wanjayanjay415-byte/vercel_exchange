import { supabase } from './supabase';

export async function registerUser(username: string, password: string, email?: string) {
  const hashedPassword = await hashPassword(password);

  // Check username/email uniqueness
  const { data: existingByUsername, error: exUserErr } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (exUserErr) throw exUserErr;
  if (existingByUsername) {
    throw new Error('Username sudah digunakan');
  }

  if (email) {
    const { data: existingByEmail, error: exEmailErr } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (exEmailErr) throw exEmailErr;
    if (existingByEmail) {
      throw new Error('Email sudah digunakan');
    }
  }

  // Try inserting; prefer to set bonus_claimed=true for new users, but fallback
  // to inserting without that column if DB schema is older.
  let data: any = null;
  let error: any = null;

  try {
    const insertPayload: any = { username, password: hashedPassword };
    if (typeof email !== 'undefined') insertPayload.email = email;
    insertPayload.bonus_claimed = true;

    const resp = await supabase
      .from('users')
      .insert([insertPayload])
      .select()
      .single();
    data = resp.data;
    error = resp.error;
  } catch (e) {
    error = e;
  }

  // If insert failed because bonus_claimed column doesn't exist, retry without it
  if (error) {
    const msg = (error && ((error as any).message || JSON.stringify(error))) || '';
    if (/bonus_claimed|column.*bonus_claimed|unknown column/i.test(msg)) {
      const insertPayload2: any = { username, password: hashedPassword };
      if (typeof email !== 'undefined') insertPayload2.email = email;
      const resp2 = await supabase
        .from('users')
        .insert([insertPayload2])
        .select()
        .single();
      data = resp2.data;
      error = resp2.error;
    }
  }

  if (error) throw error;

  const currencies = ['USDT', 'BTC', 'BNB', 'ETH', 'SOL', 'BASE'];
  const balanceInserts = currencies.map(currency => ({
    user_id: data.id,
    currency,
    amount: '0'
  }));

  await supabase.from('balances').insert(balanceInserts);

  return data;
}

export async function getUserById(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    const user = data || null;

    // if bonus columns absent or false, check fallback table
    if (user && !user.bonus_claimed) {
      const { data: bcData, error: bcErr } = await supabase
        .from('bonus_claims')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();
      if (!bcErr && bcData) {
        (user as any).bonus_claimed = true;
      }
    }

    return user;
  } catch (err: any) {
    const msg = (err && ((err as any).message || JSON.stringify(err))) || '';
    if (/bonus_claimed|column.*bonus_claimed|unknown column/i.test(msg)) {
      const { data: u, error: uErr } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      if (uErr) throw uErr;

      const user = u || null;
      if (user) {
        const { data: bcData, error: bcErr } = await supabase
          .from('bonus_claims')
          .select('user_id')
          .eq('user_id', userId)
          .maybeSingle();
        if (!bcErr && bcData) {
          (user as any).bonus_claimed = true;
        }
      }

      return user;
    }
    throw err;
  }
}

export async function setUserBonusClaimed(userId: string, currency: string) {
  const { error } = await supabase
    .from('users')
    .update({ bonus_claimed: true, bonus_currency: currency, bonus_claimed_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) throw error;
}

export async function upsertOAuthUser(email: string) {
  if (!email) throw new Error('Email is required');

  const { data: existing, error: existingErr } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (existingErr) throw existingErr;
  if (existing) return existing;

  // Derive username
  let base = email.split('@')[0].replace(/[^a-zA-Z0-9_.-]/g, '').toLowerCase();
  if (!base) base = `user${Math.floor(Math.random() * 10000)}`;
  let username = base;
  let i = 0;
  while (true) {
    const { data: du } = await supabase.from('users').select('id').eq('username', username).maybeSingle();
    if (!du) break;
    i += 1;
    username = `${base}${i}`;
  }

  // Try insert with bonus_claimed, fallback without it if column missing
  let inserted: any = null;
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([{ username, email, bonus_claimed: true }])
      .select()
      .single();
    if (error) throw error;
    inserted = data;
  } catch (err: any) {
    const msg = (err && ((err as any).message || JSON.stringify(err))) || '';
    if (/bonus_claimed|column.*bonus_claimed|unknown column/i.test(msg)) {
      const { data: data2, error: err2 } = await supabase
        .from('users')
        .insert([{ username, email }])
        .select()
        .single();
      if (err2) throw err2;
      inserted = data2;
    } else {
      throw err;
    }
  }

  const currencies = ['USDT', 'BTC', 'BNB', 'ETH', 'SOL', 'BASE'];
  const balanceInserts = currencies.map(currency => ({
    user_id: inserted.id,
    currency,
    amount: '0'
  }));

  const { error: biErr } = await supabase.from('balances').insert(balanceInserts);
  if (biErr) {
    console.warn('Failed to create initial balances for OAuth user', biErr);
  }

  return inserted;
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

export async function updateUsername(userId: string, newUsername: string) {
  const { data: existing, error: existingErr } = await supabase
    .from('users')
    .select('id')
    .eq('username', newUsername)
    .maybeSingle();

  if (existingErr) throw existingErr;
  if (existing && existing.id !== userId) {
    throw new Error('Username sudah digunakan');
  }

  const { error } = await supabase
    .from('users')
    .update({ username: newUsername })
    .eq('id', userId);

  if (error) throw error;
  return { success: true };
}

export async function updatePassword(userId: string, currentPassword: string, newPassword: string) {
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('password')
    .eq('id', userId)
    .maybeSingle();

  if (userErr) throw userErr;
  if (!user) throw new Error('User tidak ditemukan');

  const currentHash = await hashPassword(currentPassword);
  if (currentHash !== (user as any).password) {
    throw new Error('Password saat ini salah');
  }

  const newHash = await hashPassword(newPassword);
  const { error } = await supabase
    .from('users')
    .update({ password: newHash })
    .eq('id', userId);

  if (error) throw error;
  return { success: true };
}

export async function sendEmailVerification(userId: string) {
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('email')
    .eq('id', userId)
    .maybeSingle();

  if (userErr) throw userErr;
  if (!user || !user.email) throw new Error('Email tidak tersedia');

  const { error } = await supabase
    .from('users')
    .update({ verification_sent_at: new Date().toISOString() })
    .eq('id', userId);

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
