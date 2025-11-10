import { useState, useEffect } from 'react';
import { LogOut, TrendingUp, Send, Settings as SettingsIcon } from 'lucide-react';
import SendModal from './SendModal';
import ClaimBonusCard from './ClaimBonusCard';
import { getUserById } from '../lib/auth';
import { getUserBalances, getTotalUSDBalance } from '../lib/exchange';
import { Balance } from '../lib/supabase';
import VideoBackground from './VideoBackground';
import DepositModal from './DepositModal';
import WithdrawModal from './WithdrawModal';
import SwapModal from './SwapModal';
import BottomNav from './BottomNav';
import TabContent from './TabContent';
import MiningCard from './MiningCard';

interface DashboardProps {
  userId: string;
  username: string;
  onLogout: () => void;
}

export default function Dashboard({ userId, username, onLogout }: DashboardProps) {
  // Mining state (temporary, will be persisted later)
  const [miningActive, setMiningActive] = useState(false);
  const [miningProgress, setMiningProgress] = useState(0);

  // Simulate mining progress (for UI only, real logic will be added)
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (miningActive && miningProgress < 100) {
      timer = setInterval(() => {
        setMiningProgress(prev => Math.min(prev + 1, 100));
      }, 864000 / 100); // 24hr/100 steps (8.64s per step)
    }
    return () => { if (timer) clearInterval(timer); };
  }, [miningActive, miningProgress]);

  const handleStartMining = () => {
    setMiningActive(true);
    setMiningProgress(0);
  };
  const handleStopMining = () => {
    setMiningActive(false);
    setMiningProgress(0);
  };
  // helper to ensure only one modal (deposit/withdraw/swap) is open at a time
  const openOnlyModal = (which: 'deposit' | 'withdraw' | 'swap' | null) => {
    setShowDeposit(which === 'deposit');
    setShowWithdraw(which === 'withdraw');
    setShowSwap(which === 'swap');
  };
  const [balances, setBalances] = useState<Balance[]>([]);
  const [totalUSD, setTotalUSD] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showSwap, setShowSwap] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'home' | 'deposit' | 'withdraw' | 'swap' | 'history'>('home');
  const [bonusClaimed, setBonusClaimed] = useState(false);
  const [claimDismissed, setClaimDismissed] = useState(false);

  useEffect(() => {
    loadData();
  }, [userId, refreshKey]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [balancesData, total] = await Promise.all([
        getUserBalances(userId),
        getTotalUSDBalance(userId)
      ]);
      setBalances(balancesData);
      setTotalUSD(total);
      // check bonus status
      try {
        const user = await getUserById(userId);
        setBonusClaimed(!!user?.bonus_claimed);
        // read local dismiss flag per user
        try {
          const dismissed = localStorage.getItem(`claimDismissed_${userId}`) === '1';
          setClaimDismissed(dismissed);
        } catch (e) {
          // ignore localStorage errors
        }
      } catch (e) {
        console.error('Failed to load user bonus status', e);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleTabChange = (tab: 'home' | 'deposit' | 'withdraw' | 'swap' | 'history') => {
    setActiveTab(tab);
    if (tab === 'deposit') openOnlyModal('deposit');
    if (tab === 'withdraw') openOnlyModal('withdraw');
    if (tab === 'swap') openOnlyModal('swap');
    if (tab === 'home' || tab === 'history') openOnlyModal(null);
  };

  if (loading) {
    return (
      <VideoBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </VideoBackground>
    );
  }

  return (
    <VideoBackground>
      <div className="min-h-screen">
        <div className="relative max-w-7xl mx-auto px-4 py-6 md:py-8">
          {!bonusClaimed && !claimDismissed && (
            <ClaimBonusCard
              userId={userId}
              onClaimSuccess={() => { setBonusClaimed(true); handleRefresh(); }}
              onClose={() => {
                try {
                  localStorage.setItem(`claimDismissed_${userId}`, '1');
                } catch (e) {}
                setClaimDismissed(true);
              }}
            />
          )}
          <header className="flex justify-between items-center mb-6 md:mb-8">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <div className="bg-gradient-to-br from-emerald-400 to-cyan-500 p-2 rounded-lg flex-shrink-0">
                <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-white truncate">Vercelex Crypto</h1>
                <p className="text-slate-400 text-xs md:text-sm truncate">Welcome, {username}</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => setShowSend(true)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 rounded-lg transition-all border border-slate-700"
              >
                <Send className="w-4 h-4" />
                <span className="hidden lg:inline">Send</span>
              </button>
              <button
                onClick={() => (window.location.href = '/settings')}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 rounded-lg transition-all border border-slate-700"
              >
                <SettingsIcon className="w-4 h-4" />
                <span className="hidden lg:inline">Settings</span>
              </button>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-2 bg-red-700/80 hover:bg-red-700 text-white rounded-lg transition-all border border-red-900"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden lg:inline">Logout</span>
              </button>
            </div>
          </header>
          {/* Mobile: fixed top-right quick actions (Settings + Logout) */}
          <div className="fixed top-2 right-2 z-50 md:hidden flex items-center gap-2" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
            <button
              aria-label="Settings"
              onClick={() => (window.location.href = '/settings')}
              className="p-2 bg-slate-800/60 hover:bg-slate-700/60 rounded-lg transition-colors backdrop-blur-sm"
            >
              <SettingsIcon className="w-5 h-5 text-slate-200" />
            </button>
            <button
              aria-label="Logout"
              onClick={onLogout}
              className="p-2 bg-red-700/80 hover:bg-red-700 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 text-white" />
            </button>
          </div>
          <TabContent
            balances={balances}
            totalUSD={totalUSD}
            activeTab={activeTab}
            userId={userId}
            refreshKey={refreshKey}
            onShowDeposit={() => openOnlyModal('deposit')}
            onShowWithdraw={() => openOnlyModal('withdraw')}
            onShowSwap={() => openOnlyModal('swap')}
          />
          {showDeposit && (
            <DepositModal
              onClose={() => setShowDeposit(false)}
              onSuccess={handleRefresh}
            />
          )}
          {showWithdraw && (
            <WithdrawModal
              userId={userId}
              username={username}
              balances={balances || []}
              onClose={() => setShowWithdraw(false)}
              onSuccess={handleRefresh}
            />
          )}
          {showSwap && (
            <SwapModal
              userId={userId}
              balances={balances || []}
              onClose={() => setShowSwap(false)}
              onSuccess={handleRefresh}
            />
          )}
          {showSend && (
            <SendModal
              onClose={() => setShowSend(false)}
              onSuccess={handleRefresh}
              userId={userId}
            />
          )}
  </div>

        {/* Render BottomNav and MiningCard outside the centered container to avoid transform/stacking context issues */}
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

        <div className="fixed bottom-20 left-0 right-0 flex justify-center md:hidden pointer-events-none">
          <div className="pointer-events-auto">
            <MiningCard
              miningActive={miningActive}
              miningProgress={miningProgress}
              onStart={handleStartMining}
              onStop={handleStopMining}
            />
          </div>
        </div>
      </div>
    </VideoBackground>
  );
}