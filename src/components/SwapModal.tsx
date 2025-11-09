import { useState } from 'react';
import { X, ArrowDownUp, AlertCircle } from 'lucide-react';
import { performSwap, getCryptoPrice } from '../lib/exchange';
import { Balance } from '../lib/supabase';

interface SwapModalProps {
  userId: string;
  balances: Balance[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function SwapModal({ userId, balances, onClose, onSuccess }: SwapModalProps) {
  const [fromCurrency, setFromCurrency] = useState('USDT');
  const [toCurrency, setToCurrency] = useState('BNB');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const fromBalance = balances.find(b => b.currency === fromCurrency);
  const availableBalance = fromBalance ? parseFloat(fromBalance.amount) : 0;

  const calculateReceiveAmount = () => {
    if (!amount || parseFloat(amount) <= 0) return 0;
    const fromPrice = getCryptoPrice(fromCurrency);
    const toPrice = getCryptoPrice(toCurrency);
    const usdValue = parseFloat(amount) * fromPrice;
    return usdValue / toPrice;
  };

  const receiveAmount = calculateReceiveAmount();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (fromCurrency === toCurrency) {
        throw new Error('Pilih cryptocurrency yang berbeda');
      }

      if (parseFloat(amount) <= 0) {
        throw new Error('Jumlah harus lebih dari 0');
      }

      if (parseFloat(amount) > availableBalance) {
        throw new Error('Saldo tidak mencukupi');
      }

      await performSwap(userId, fromCurrency, toCurrency, amount);
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

  const swapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
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

  const availableCurrencies = balances.map(b => b.currency);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 max-w-lg w-full">
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">Swap Crypto</h2>
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
              <div className="font-semibold">Swap Berhasil!</div>
              <div className="text-sm mt-1">
                {amount} {fromCurrency} → {receiveAmount.toFixed(8)} {toCurrency}
              </div>
            </div>
          ) : (
            <>
              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-600">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-slate-300">From</label>
                  <button
                    type="button"
                    onClick={setMaxAmount}
                    className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    Max: {availableBalance.toFixed(8)}
                  </button>
                </div>
                <div className="flex gap-3">
                  <input
                    type="number"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1 px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white text-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="0.00"
                    required
                  />
                  <select
                    value={fromCurrency}
                    onChange={(e) => setFromCurrency(e.target.value)}
                    className="px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {availableCurrencies.map((curr) => (
                      <option key={curr} value={curr}>
                        {curr}
                      </option>
                    ))}
                  </select>
                </div>
                {amount && (
                  <div className="text-sm text-slate-400 mt-2">
                    ≈ {formatUSD(parseFloat(amount), fromCurrency)}
                  </div>
                )}
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={swapCurrencies}
                  className="p-3 bg-slate-700 hover:bg-slate-600 rounded-full transition-all transform hover:scale-110"
                >
                  <ArrowDownUp className="w-5 h-5 text-violet-400" />
                </button>
              </div>

              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-600">
                <label className="text-sm font-medium text-slate-300 block mb-2">To</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={receiveAmount > 0 ? receiveAmount.toFixed(8) : '0.00'}
                    readOnly
                    className="flex-1 px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white text-lg"
                  />
                  <select
                    value={toCurrency}
                    onChange={(e) => setToCurrency(e.target.value)}
                    className="px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {availableCurrencies.map((curr) => (
                      <option key={curr} value={curr}>
                        {curr}
                      </option>
                    ))}
                  </select>
                </div>
                {receiveAmount > 0 && (
                  <div className="text-sm text-slate-400 mt-2">
                    ≈ {formatUSD(receiveAmount, toCurrency)}
                  </div>
                )}
              </div>

              {amount && receiveAmount > 0 && (
                <div className="bg-slate-900/50 rounded-lg p-3 text-sm">
                  <div className="flex justify-between text-slate-400">
                    <span>Exchange Rate</span>
                    <span className="text-white">
                      1 {fromCurrency} = {(getCryptoPrice(fromCurrency) / getCryptoPrice(toCurrency)).toFixed(8)} {toCurrency}
                    </span>
                  </div>
                </div>
              )}

              <div className="bg-amber-500/10 border border-amber-500/50 rounded-lg p-4">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-200">
                    <p className="font-semibold mb-1">Persyaratan Swap:</p>
                    <p className="text-xs">
                      Anda harus memiliki minimal $10 di USDT, BNB, ETH, dan SOL untuk melakukan swap.
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
                disabled={loading || !amount || parseFloat(amount) <= 0}
                className="w-full bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Swap Now'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
