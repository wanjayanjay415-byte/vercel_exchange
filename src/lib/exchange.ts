import { supabase } from './supabase';

const CRYPTO_PRICES: Record<string, number> = {
  USDT: 1,
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
  address: string
) {
  const canProceed = await checkMinimumBalanceLock(userId);
  if (!canProceed) {
    throw new Error('Anda harus memiliki minimal $10 di setiap cryptocurrency (USDT, BNB, ETH, SOL) untuk melakukan penarikan');
  }

  const balances = await getUserBalances(userId);
  const balance = balances.find(b => b.currency === currency);

  if (!balance || parseFloat(balance.amount) < parseFloat(amount)) {
    throw new Error('Saldo tidak mencukupi');
  }

  const newAmount = (parseFloat(balance.amount) - parseFloat(amount)).toString();
  await updateBalance(userId, currency, newAmount);
  await recordTransaction(userId, 'withdraw', currency, amount);

  return { success: true, address };
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
