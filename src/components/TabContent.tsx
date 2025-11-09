import { Wallet } from 'lucide-react';
import { Balance } from '../lib/supabase';
import { getCryptoPrice, convertUSDToIDR } from '../lib/exchange';
import { getLogoForCurrency } from '../lib/logos';
import TransactionHistory from './TransactionHistory';

interface TabContentProps {
  activeTab: 'home' | 'deposit' | 'withdraw' | 'swap' | 'history';
  balances: Balance[];
  totalUSD: number;
  userId: string;
  refreshKey: number;
  onShowDeposit: () => void;
  onShowWithdraw: () => void;
  onShowSwap: () => void;
}

export default function TabContent({
  activeTab,
  balances,
  totalUSD,
  userId,
  refreshKey,
  onShowDeposit,
  onShowWithdraw,
  onShowSwap
}: TabContentProps) {
  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return num.toFixed(8).replace(/\.?0+$/, '');
  };

  const formatUSD = (usd: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(usd);
  };

  const formatIDR = (idr: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(idr);
  };

  if (activeTab === 'home') {
    return (
      <div className="pb-24 md:pb-0">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-6 md:p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="w-6 h-6 text-emerald-400" />
            <h2 className="text-lg md:text-xl font-semibold text-white">Total Balance</h2>
          </div>
          <div className="text-3xl md:text-4xl font-bold text-white mb-2">{formatUSD(totalUSD)}</div>
          <div className="text-slate-400 text-sm">Total nilai aset Anda dalam IDR</div>
          <div className="text-lg md:text-xl text-slate-300">{formatIDR(convertUSDToIDR(totalUSD))} (IDR)</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6">
          <button
            onClick={onShowDeposit}
            className="bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white p-5 md:p-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
          >
            <div className="font-semibold text-base md:text-lg">Deposit</div>
            <div className="text-xs md:text-sm opacity-90">Tambah saldo</div>
          </button>

          <button
            onClick={onShowWithdraw}
            className="bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white p-5 md:p-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
          >
            <div className="font-semibold text-base md:text-lg">Withdraw</div>
            <div className="text-xs md:text-sm opacity-90">Tarik dana</div>
          </button>

          <button
            onClick={onShowSwap}
            className="bg-gradient-to-br from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white p-5 md:p-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
          >
            <div className="font-semibold text-base md:text-lg">Swap</div>
            <div className="text-xs md:text-sm opacity-90">Tukar kripto</div>
          </button>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-6 md:p-8">
          <h2 className="text-lg md:text-xl font-semibold text-white mb-6">Your Assets</h2>
          <div className="space-y-3">
            {balances.map((balance) => {
              const usdValue = parseFloat(balance.amount) * getCryptoPrice(balance.currency);
              return (
                <div
                  key={balance.id}
                  className="flex justify-between items-center p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 hover:border-emerald-500/50 transition-all"
                >
                  <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-slate-900/30">
                              {(() => {
                                const logo = getLogoForCurrency(balance.currency);
                                if (logo) {
                                  return (
                                    <img src={logo} alt={balance.currency} className="w-8 h-8 object-contain" />
                                  );
                                }
                                return (
                                  <div className="text-white font-bold text-sm">{balance.currency.substring(0, 1)}</div>
                                );
                              })()}
                            </div>
                    <div>
                      <div className="font-semibold text-white text-sm md:text-base">{balance.currency}</div>
                      <div className="text-xs md:text-sm text-slate-400">{formatUSD(usdValue)}</div>
                      {balance.currency === 'USDT' && (
                        <div className="text-xs md:text-sm text-slate-400">{formatIDR(convertUSDToIDR(usdValue))} (IDR)</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-white text-sm md:text-base">{formatCurrency(balance.amount)}</div>
                    <div className="text-xs md:text-sm text-slate-400">{balance.currency}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'deposit') {
    return (
      <div className="pb-24 md:pb-0">
        <button
          onClick={onShowDeposit}
          className="w-full bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white p-8 rounded-xl transition-all shadow-lg mb-6"
        >
          <div className="text-2xl font-semibold mb-2">Deposit</div>
          <div className="text-base opacity-90">Tambah saldo ke akun Anda</div>
        </button>
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-6">
          <p className="text-slate-400 text-center">Klik tombol di atas untuk mulai deposit</p>
        </div>
      </div>
    );
  }

  if (activeTab === 'withdraw') {
    return (
      <div className="pb-24 md:pb-0">
        <button
          onClick={onShowWithdraw}
          className="w-full bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white p-8 rounded-xl transition-all shadow-lg mb-6"
        >
          <div className="text-2xl font-semibold mb-2">Withdraw</div>
          <div className="text-base opacity-90">Tarik dana dari akun Anda</div>
        </button>
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-6">
          <p className="text-slate-400 text-center">Klik tombol di atas untuk mulai withdraw</p>
        </div>
      </div>
    );
  }

  if (activeTab === 'swap') {
    return (
      <div className="pb-24 md:pb-0">
        <button
          onClick={onShowSwap}
          className="w-full bg-gradient-to-br from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white p-8 rounded-xl transition-all shadow-lg mb-6"
        >
          <div className="text-2xl font-semibold mb-2">Swap</div>
          <div className="text-base opacity-90">Tukar kripto Anda</div>
        </button>
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-6">
          <p className="text-slate-400 text-center">Klik tombol di atas untuk mulai swap</p>
        </div>
      </div>
    );
  }

  if (activeTab === 'history') {
    return (
      <div className="pb-24 md:pb-0">
        <TransactionHistory userId={userId} refreshKey={refreshKey} />
      </div>
    );
  }

  return null;
}
