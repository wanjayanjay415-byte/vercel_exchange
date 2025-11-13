import { supabase } from './supabase';

export async function registerUser(username: string, password: string, email?: string) {
  const hashedPassword = await hashPassword(password);

  // Check username/email uniqueness
  const { data: existingByUsername } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (existingByUsername) {
    throw new Error('Username sudah digunakan');
  }

  if (email) {
    const { data: existingByEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (existingByEmail) {
      throw new Error('Email sudah digunakan');
    }
  }

  // Try inserting with bonus_claimed (newer schema). If the remote DB doesn't
  // have that column yet, fall back to inserting without it to avoid a 400 error
  // during registration (backwards-compatible behavior).
  let data: any = null;
  let error: any = null;

  try {
    const insertPayload: any = { username, password: hashedPassword };
    if (typeof email !== 'undefined') insertPayload.email = email;
    insertPayload.bonus_claimed = false;

    const resp = await supabase
      .from('users')
      .insert([insertPayload])
      .select()
      .single();
    data = resp.data;
    error = resp.error;
  } catch (e) {
    // supabase-js sometimes throws; capture and continue to fallback
    error = e;
  }

  // If insert failed because the column doesn't exist, retry without bonus_claimed
  if (error) {
    const msg = (error && ((error as any).message || JSON.stringify(error))) || '';
    if (/bonus_claimed|column.*bonus_claimed|unknown column/i.test(msg)) {
      const insertPayload: any = { username, password: hashedPassword };
      if (typeof email !== 'undefined') insertPayload.email = email;
      const resp2 = await supabase
        .from('users')
        .insert([insertPayload])
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
  // Try getting the full user row. If the DB doesn't have bonus columns, fall back
  // to reading the users row and checking `bonus_claims` fallback table.
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
    // If error indicates missing columns or other issues, do a minimal lookup
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

/**
 * Upsert a user row for an OAuth sign-in (e.g. Google).
 * - If a user with the given email exists, returns it.
 * - Otherwise creates a new user with a username derived from the email
 *   and creates default balances for that user.
 */
export async function upsertOAuthUser(email: string) {
  if (!email) throw new Error('Email is required');

  // Try existing user by email
  const { data: existing, error: existingErr } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (existingErr) throw existingErr;
  if (existing) return existing;

  // Derive a username from email prefix and ensure uniqueness
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

  const { data: inserted, error: insertErr } = await supabase
    .from('users')
    .insert([{ username, email }])
    .select()
    .single();

  if (insertErr) throw insertErr;

  const currencies = ['USDT', 'BTC', 'BNB', 'ETH', 'SOL', 'BASE'];
  const balanceInserts = currencies.map(currency => ({
    user_id: inserted.id,
    currency,
    amount: '0'
  }));

  const { error: biErr } = await supabase.from('balances').insert(balanceInserts);
  if (biErr) {
    // non-fatal: log but don't block returning the user
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
  // ensure username unique
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
  // verify current password first
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
  // Try to read user's email and set a `verification_sent_at` timestamp to record intent.
  // If your Supabase project uses Auth, consider using the Auth API to send a real email.
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

  // Note: this function records that a verification email was requested. Sending
  // a real email may require Supabase Auth or an external mail service.
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
