import { Home, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, Clock } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'home' | 'deposit' | 'withdraw' | 'swap' | 'history';
  onTabChange: (tab: 'home' | 'deposit' | 'withdraw' | 'swap' | 'history') => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'deposit', label: 'Deposit', icon: ArrowDownCircle },
    { id: 'withdraw', label: 'Withdraw', icon: ArrowUpCircle },
    { id: 'swap', label: 'Swap', icon: ArrowLeftRight },
    { id: 'history', label: 'Riwayat', icon: Clock }
  ] as const;

  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden bg-gradient-to-t from-slate-900/95 via-slate-900/80 to-transparent backdrop-blur-md border-t border-slate-700/50 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="max-w-md mx-auto px-2 py-3">
        <div className="flex justify-around items-center gap-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id as any)}
              className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg transition-all duration-200 ${
                activeTab === id
                  ? 'bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
