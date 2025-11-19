import { supabase } from './supabase';

const CRYPTO_PRICES: Record<string, number> = {
  USDT: 1,
  BTC: 60000,
  BNB: 620,
  ETH: 3200,
  SOL: 180,
  BASE: 1
};

export function getCryptoPrice(currency: string): number {
  return CRYPTO_PRICES[currency] || 1;
}

export function getUSDToIDRRate(): number {
  // Allow overriding via env var VITE_USD_TO_IDR (e.g. 15000)
  const envRate = import.meta.env.VITE_USD_TO_IDR;
  const rate = envRate ? parseFloat(envRate) : NaN;
  if (!isNaN(rate) && rate > 0) return rate;
  // default fallback rate
  return 15000;
}

export function convertUSDToIDR(usd: number): number {
  return usd * getUSDToIDRRate();
}

export function calculateUSDValue(amount: string, currency: string): number {
  return parseFloat(amount) * getCryptoPrice(currency);
}

export async function getUserBalances(userId: string) {
  const { data, error } = await supabase
    .from('balances')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return data || [];
}

export async function getTotalUSDBalance(userId: string): Promise<number> {
  const balances = await getUserBalances(userId);
  let total = 0;

  for (const balance of balances) {
    total += calculateUSDValue(balance.amount, balance.currency);
  }

  return total;
}

export async function checkMinimumBalanceLock(userId: string): Promise<boolean> {
  const requiredCurrencies = ['USDT', 'BNB', 'ETH', 'SOL'];
  const balances = await getUserBalances(userId);

  for (const currency of requiredCurrencies) {
    const balance = balances.find(b => b.currency === currency);
    const usdValue = balance ? calculateUSDValue(balance.amount, currency) : 0;

    if (usdValue < 10) {
      return false;
    }
  }

  return true;
}

export async function updateBalance(userId: string, currency: string, amount: string) {
  const { error } = await supabase
    .from('balances')
    .upsert({
      user_id: userId,
      currency,
      amount,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,currency'
    });

  if (error) throw error;
}

export async function recordTransaction(
  userId: string,
  type: string,
  currency: string,
  amount: string,
  fromCurrency?: string,
  toCurrency?: string
) {
  const { error } = await supabase
    .from('transactions')
    .insert([{
      user_id: userId,
      type,
      currency,
      amount,
      from_currency: fromCurrency,
      to_currency: toCurrency,
      status: 'completed'
    }]);

  if (error) throw error;
}

export async function performSwap(
  userId: string,
  fromCurrency: string,
  toCurrency: string,
  amount: string
) {
  const canProceed = await checkMinimumBalanceLock(userId);
  if (!canProceed) {
    throw new Error('Anda harus memiliki minimal $10 di setiap cryptocurrency (USDT, BNB, ETH, SOL) untuk melakukan swap');
  }

  const balances = await getUserBalances(userId);
  const fromBalance = balances.find(b => b.currency === fromCurrency);

  if (!fromBalance || parseFloat(fromBalance.amount) < parseFloat(amount)) {
    throw new Error('Saldo tidak mencukupi');
  }

  const fromPrice = getCryptoPrice(fromCurrency);
  const toPrice = getCryptoPrice(toCurrency);
  const usdValue = parseFloat(amount) * fromPrice;
  const toAmount = usdValue / toPrice;

  const newFromAmount = (parseFloat(fromBalance.amount) - parseFloat(amount)).toString();
  await updateBalance(userId, fromCurrency, newFromAmount);

  const toBalance = balances.find(b => b.currency === toCurrency);
  const newToAmount = (parseFloat(toBalance?.amount || '0') + toAmount).toString();
  await updateBalance(userId, toCurrency, newToAmount);

  await recordTransaction(userId, 'swap', fromCurrency, amount, fromCurrency, toCurrency);
}

export async function performWithdraw(
  userId: string,
  currency: string,
  amount: string,
  address: string,
  network?: string
) {
  const canProceed = await checkMinimumBalanceLock(userId);
  if (!canProceed) {
    throw new Error('Anda harus memiliki setidaknya minimal $10 di saldo di dalam jaringan apa pun untuk melakukan penarikan');
  }

  const balances = await getUserBalances(userId);
  const balance = balances.find(b => b.currency === currency);

  if (!balance || parseFloat(balance.amount) < parseFloat(amount)) {
    throw new Error('Saldo tidak mencukupi');
  }

  const newAmount = (parseFloat(balance.amount) - parseFloat(amount)).toString();
  await updateBalance(userId, currency, newAmount);
  await recordTransaction(userId, 'withdraw', currency, amount, network, address);

  return { success: true, address, network };
}

export async function getDepositAddresses() {
  const { data, error } = await supabase
    .from('deposit_addresses')
    .select('*');

  if (error) throw error;
  return data || [];
}

export async function getUserTransactions(userId: string, limit = 10) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Claim a one-time $300 bonus for a user. User can claim only once.
 * The bonus will be credited to the chosen currency (BTC, USDT, SOL, BNB).
 */
export async function claimBonus(userId: string, currency: string) {
  // Bonus claim feature is disabled globally.
  throw new Error('Fitur klaim bonus telah dinonaktifkan');

  // check user flag. Be resilient if remote DB doesn't have bonus_claimed column yet.
  let user: any = null;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, bonus_claimed')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    user = data;
  } catch (err: any) {
    // If error is about missing column, fallback to selecting only id and assume not claimed
  const msg = (err && ((err as any).message || JSON.stringify(err))) || '';
    if (/bonus_claimed|column.*bonus_claimed|unknown column/i.test(msg)) {
      const { data: data2, error: err2 } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      if (err2) throw err2;
      user = data2;
      if (user) user.bonus_claimed = false;
    } else {
      throw err;
    }
  }

  if (!user) throw new Error('User tidak ditemukan');
  if (user.bonus_claimed) throw new Error('Bonus sudah diklaim');

  // compute how much of `currency` equals $300
  const price = getCryptoPrice(currency);
  const amount = (300 / price);

  // fetch current balance
  const balances = await getUserBalances(userId);
  const balance = balances.find(b => b.currency === currency);
  const current = parseFloat(balance?.amount || '0');
  const newAmount = (current + amount).toString();

  // update balance and record transaction
  await updateBalance(userId, currency, newAmount);
  await recordTransaction(userId, 'bonus', currency, amount.toString());

  // mark user as claimed
  const { error: updateError } = await supabase
    .from('users')
    .update({ bonus_claimed: true, bonus_currency: currency, bonus_claimed_at: new Date().toISOString() })
    .eq('id', userId);

  if (updateError) {
    const msg = (updateError && (((updateError as any).message) || JSON.stringify(updateError))) || '';
    // If column doesn't exist, persist claim in `bonus_claims` table as a fallback
    if (/bonus_claimed|column.*bonus_claimed|unknown column/i.test(msg)) {
      console.warn('bonus_claimed column missing in DB; will record claim in bonus_claims table as fallback.');
      const { error: insertErr } = await supabase.from('bonus_claims').upsert({
        user_id: userId,
        currency,
        amount_usd: 300
      }, { onConflict: 'user_id' });
      if (insertErr) {
        console.error('Failed to persist fallback bonus_claims record', insertErr);
        // still return success (balance credited) but include warning
        return { success: true, currency, amount: amount.toString(), warning: 'bonus_persist_failed' };
      }

      return { success: true, currency, amount: amount.toString(), warning: 'bonus_flag_recorded_in_bonus_claims' };
    }
    throw updateError;
  }

  return { success: true, currency, amount: amount.toString() };
}

export async function transferUSDT(senderUserId: string, recipientUsername: string, amount: string) {
  // find recipient by username
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, username')
    .eq('username', recipientUsername)
    .limit(1);

  if (usersError) throw usersError;
  if (!users || users.length === 0) {
    throw new Error('Recipient tidak ditemukan');
  }

  const recipientId = users[0].id;

  // load balances for both users
  const senderBalances = await getUserBalances(senderUserId);
  const recipientBalances = await getUserBalances(recipientId);

  const senderUSDT = senderBalances.find(b => b.currency === 'USDT');
  const recipientUSDT = recipientBalances.find(b => b.currency === 'USDT');

  if (!senderUSDT || parseFloat(senderUSDT.amount) < parseFloat(amount)) {
    throw new Error('Saldo pengirim tidak mencukupi');
  }

  // subtract from sender
  const newSenderAmount = (parseFloat(senderUSDT.amount) - parseFloat(amount)).toString();
  await updateBalance(senderUserId, 'USDT', newSenderAmount);

  // add to recipient
  const newRecipientAmount = (parseFloat(recipientUSDT?.amount || '0') + parseFloat(amount)).toString();
  await updateBalance(recipientId, 'USDT', newRecipientAmount);

  // record transactions for both users
  await recordTransaction(senderUserId, 'send', 'USDT', amount);
  await recordTransaction(recipientId, 'receive', 'USDT', amount);

  return { success: true, to: recipientUsername };
}
