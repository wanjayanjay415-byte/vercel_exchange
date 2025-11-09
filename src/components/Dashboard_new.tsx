import { useState, useEffect } from 'react';
import { LogOut, TrendingUp } from 'lucide-react';
import { getUserBalances, getTotalUSDBalance } from '../lib/exchange';
import { Balance } from '../lib/supabase';
import VideoBackground from './VideoBackground';
import DepositModal from './DepositModal';
import WithdrawModal from './WithdrawModal';
import SwapModal from './SwapModal';
import BottomNav from './BottomNav';
import TabContent from './TabContent';

interface DashboardProps {
  userId: string;
  username: string;
  onLogout: () => void;
}

export default function Dashboard({ userId, username, onLogout }: DashboardProps) {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [totalUSD, setTotalUSD] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showSwap, setShowSwap] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'home' | 'deposit' | 'withdraw' | 'swap' | 'history'>('home');

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
    if (tab === 'deposit') setShowDeposit(true);
    if (tab === 'withdraw') setShowWithdraw(true);
    if (tab === 'swap') setShowSwap(true);
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
          <header className="flex justify-between items-center mb-6 md:mb-8">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <div className="bg-gradient-to-br from-emerald-400 to-cyan-500 p-2 rounded-lg flex-shrink-0">
                <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-white truncate">Crypto Exchange</h1>
                <p className="text-slate-400 text-xs md:text-sm truncate">Welcome, {username}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 rounded-lg transition-all border border-slate-700 flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden lg:inline">Logout</span>
            </button>
            <button
              onClick={onLogout}
              className="md:hidden p-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 rounded-lg transition-all border border-slate-700 flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </header>

          <TabContent
            activeTab={activeTab}
            balances={balances}
            totalUSD={totalUSD}
            userId={userId}
            refreshKey={refreshKey}
            onShowDeposit={() => setShowDeposit(true)}
            onShowWithdraw={() => setShowWithdraw(true)}
            onShowSwap={() => setShowSwap(true)}
          />
        </div>

        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

        {showDeposit && (
          <DepositModal
            onClose={() => setShowDeposit(false)}
            onSuccess={handleRefresh}
          />
        )}

        {showWithdraw && (
          <WithdrawModal
            userId={userId}
            balances={balances}
            onClose={() => setShowWithdraw(false)}
            onSuccess={handleRefresh}
          />
        )}

        {showSwap && (
          <SwapModal
            userId={userId}
            balances={balances}
            onClose={() => setShowSwap(false)}
            onSuccess={handleRefresh}
          />
        )}
      </div>
    </VideoBackground>
  );
}