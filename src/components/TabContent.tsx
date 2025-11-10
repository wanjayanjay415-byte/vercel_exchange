// import removed, see below
import { Wallet, ArrowDownUp, Download, Upload } from 'lucide-react';
import { useRef, useEffect } from 'react';
import { BarChart2 } from 'lucide-react';
import { Balance } from '../lib/supabase';
import { getCryptoPrice, convertUSDToIDR } from '../lib/exchange';
import { getLogoForCurrency } from '../lib/logos';
import { useLivePrices } from '../lib/prices';
import TransactionHistory from './TransactionHistory';
import MiningCard from './MiningCard';
import './animated-buttons.css';

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

  // Live total display with PnL
  // (useRef import moved to top)
  const LiveTotalDisplay = ({ balances, staticTotalUSD }: { balances: Balance[]; staticTotalUSD: number }) => {
    const symbols = Array.from(new Set(balances.map(b => b.currency)));
    const { prices } = useLivePrices(symbols, 15000);

    // expose live prices to the renderer below (simple shared place to avoid prop drilling)
    try {
      (window as any).__LIVE_PRICES = prices;
    } catch (e) {}

    // compute total using live prices when available
    let liveTotal = 0;
    for (const b of balances) {
      const price = prices[b.currency] ?? getCryptoPrice(b.currency);
      liveTotal += parseFloat(b.amount) * price;
    }

    const totalToShow = Object.keys(prices).length > 0 ? liveTotal : staticTotalUSD;

    // PnL calculation: compare to initial value at first render
    const initialTotalRef = useRef<number | null>(null);
    useEffect(() => {
      if (initialTotalRef.current === null && totalToShow > 0) {
        initialTotalRef.current = totalToShow;
      }
    }, [totalToShow]);

    const initialTotal = initialTotalRef.current;
    let pnl = 0;
    if (initialTotal !== null && initialTotal !== 0) {
      pnl = ((totalToShow - initialTotal) / initialTotal) * 100;
    }

    let pnlColor = 'text-slate-400';
    if (pnl > 0.01) pnlColor = 'text-emerald-400';
    else if (pnl < -0.01) pnlColor = 'text-red-400';

    return (
      <>
        <div className="text-3xl md:text-4xl font-bold text-white mb-2">{formatUSD(totalToShow)}</div>
        <div className="flex items-center gap-2 mb-1">
          <span className={`font-semibold text-sm ${pnlColor}`}>
            PnL: {pnl > 0 ? '+' : ''}{pnl.toFixed(2)}%
          </span>
        </div>
        <div className="text-slate-400 text-sm">Total nilai aset Anda dalam IDR</div>
        <div className="text-lg md:text-xl text-slate-300">{formatIDR(convertUSDToIDR(totalToShow))} (IDR)</div>
      </>
    );
  };

  if (activeTab === 'home') {
    return (
      <div className="pb-24 md:pb-0">
  <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-6 md:p-8 mb-6 balance-card-pop">
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="w-6 h-6 text-emerald-400" />
            <h2 className="text-lg md:text-xl font-semibold text-white">Total Balance</h2>
          </div>
          {/* prefer live prices for total if available */}
            <LiveTotalDisplay balances={balances} staticTotalUSD={totalUSD} />
        </div>

  <div className="flex mb-6 gap-0">
          <div className="flex flex-col items-center justify-center w-20 md:w-24">
            <button
              onClick={onShowDeposit}
              className="deposit-btn bg-gradient-to-br from-emerald-400 to-cyan-500 hover:from-emerald-500 hover:to-cyan-600 text-white w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center transition-all duration-700 ease-out animate-fadein-up shadow-lg border-r border-white/10"
              style={{ animationDelay: '0.1s' }}
              aria-label="Deposit"
            >
              <Download className="w-8 h-8 md:w-10 md:h-10" />
            </button>
            <span className="text-xs text-white mt-1">Deposit</span>
          </div>

          <div className="flex flex-col items-center justify-center w-20 md:w-24">
            <button
              onClick={onShowWithdraw}
              className="withdraw-btn bg-gradient-to-br from-emerald-400 to-cyan-500 hover:from-emerald-500 hover:to-cyan-600 text-white w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center transition-all duration-700 ease-out animate-fadein-up shadow-lg border-r border-white/10"
              style={{ animationDelay: '0.3s' }}
              aria-label="Withdraw"
            >
              <Upload className="w-8 h-8 md:w-10 md:h-10" />
            </button>
            <span className="text-xs text-white mt-1">Withdraw</span>
          </div>

          <div className="flex flex-col items-center justify-center w-20 md:w-24">
            <button
              onClick={onShowSwap}
              className="swap-btn bg-gradient-to-br from-emerald-400 to-cyan-500 hover:from-emerald-500 hover:to-cyan-600 text-white w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center transition-all duration-700 ease-out animate-fadein-up shadow-lg border-r border-white/10"
              style={{ animationDelay: '0.5s' }}
              aria-label="Swap"
            >
              <ArrowDownUp className="w-8 h-8 md:w-10 md:h-10" />
            </button>
            <span className="text-xs text-white mt-1">Swap</span>
          </div>

          <div className="flex flex-col items-center justify-center w-20 md:w-24">
            <div className="flex items-center justify-center w-20 h-20 md:w-24 md:h-24">
              <MiningCard
                miningActive={(window as any).miningActive || false}
                miningProgress={(window as any).miningProgress || 0}
                onStart={() => (window as any).handleStartMining?.()}
                onStop={() => (window as any).handleStopMining?.()}
              />
            </div>
            <span className="text-xs text-white mt-1">Staking</span>
          </div>

          {/* Chart button for candle chart page */}
          <div className="flex flex-col items-center justify-center w-20 md:w-24">
            <button
              className="chart-btn bg-gradient-to-br from-emerald-400 to-cyan-500 hover:from-emerald-500 hover:to-cyan-600 text-white w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center transition-all duration-700 ease-out animate-fadein-up shadow-lg border-l border-white/10"
              style={{ animationDelay: '0.7s' }}
              aria-label="Candle Chart"
              onClick={() => window.location.href = '/charts'}
            >
              <BarChart2 className="w-8 h-8 md:w-10 md:h-10" />
            </button>
            <span className="text-xs text-white mt-1">Grafik</span>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-6 md:p-8">
          <h2 className="text-lg md:text-xl font-semibold text-white mb-6">Your Assets</h2>
          <div className="space-y-3">
              {balances.map((balance) => {
                // ...existing code...
                const price = (window as any).__LIVE_PRICES && (window as any).__LIVE_PRICES[balance.currency]
                  ? (window as any).__LIVE_PRICES[balance.currency]
                  : getCryptoPrice(balance.currency);
                const usdValue = parseFloat(balance.amount) * price;
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
