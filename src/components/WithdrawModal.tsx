import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { performWithdraw, getCryptoPrice } from '../lib/exchange';
import { Balance } from '../lib/supabase';

interface WithdrawModalProps {
  userId: string;
  balances: Balance[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function WithdrawModal({ userId, balances, onClose, onSuccess }: WithdrawModalProps) {
  const [currency, setCurrency] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const currentBalance = balances.find(b => b.currency === currency);
  const availableBalance = currentBalance ? parseFloat(currentBalance.amount) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!address) {
        throw new Error('Masukkan address tujuan');
      }

      if (parseFloat(amount) <= 0) {
        throw new Error('Jumlah harus lebih dari 0');
      }

      if (parseFloat(amount) > availableBalance) {
        throw new Error('Saldo tidak mencukupi');
      }

      await performWithdraw(userId, currency, amount, address);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const setMaxAmount = () => {
    setAmount(availableBalance.toString());
  };

  const formatUSD = (amount: number, curr: string) => {
    const usd = amount * getCryptoPrice(curr);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(usd);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 max-w-lg w-full">
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">Withdraw Crypto</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {success ? (
            <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 p-4 rounded-lg text-center">
              <div className="text-2xl mb-2">✓</div>
              <div className="font-semibold">Withdrawal Berhasil!</div>
              <div className="text-sm mt-1">Dana akan segera diproses</div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Pilih Cryptocurrency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {balances.map((balance) => (
                    <option key={balance.currency} value={balance.currency}>
                      {balance.currency} - {parseFloat(balance.amount).toFixed(8)}
                      ({formatUSD(parseFloat(balance.amount), balance.currency)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-slate-300">
                    Jumlah
                  </label>
                  <button
                    type="button"
                    onClick={setMaxAmount}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Max: {availableBalance.toFixed(8)}
                  </button>
                </div>
                <input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="0.00"
                  required
                />
                {amount && (
                  <div className="text-sm text-slate-400 mt-1">
                    ≈ {formatUSD(parseFloat(amount), currency)}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Address Tujuan
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder={currency === 'SOL' ? 'SOL address' : '0x...'}
                  required
                />
              </div>

              <div className="bg-amber-500/10 border border-amber-500/50 rounded-lg p-4">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-200">
                    <p className="font-semibold mb-1">Persyaratan Withdraw:</p>
                    <p className="text-xs">
                      Anda harus memiliki setidaknya minimal $10 di USDT, BNB, ETH, dan SOL untuk melakukan penarikan.
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Withdraw'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
