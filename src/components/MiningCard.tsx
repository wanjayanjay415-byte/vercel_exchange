import { useState } from 'react';
import { Zap } from 'lucide-react';

interface MiningCardProps {
  miningActive: boolean;
  onStart: () => void;
  onStop: () => void;
  miningProgress: number; // percent (0-100)
}

export default function MiningCard({ miningActive, onStart, onStop, miningProgress }: MiningCardProps) {
  return (
  <div className="staking-btn bg-gradient-to-br from-emerald-400 to-cyan-500 hover:from-emerald-500 hover:to-cyan-600 text-white w-20 h-20 md:w-24 md:h-24 rounded-full flex flex-col items-center justify-center transition-all duration-700 ease-out animate-fadein-up shadow-lg">
      <Zap className="w-8 h-8 md:w-10 md:h-10 text-white" />
      <span className="text-[10px] md:text-xs font-bold mt-1">Staking</span>
      <span className="text-[9px] md:text-xs text-white/80">{miningActive ? `${miningProgress}%` : 'Idle'}</span>
      <button
        onClick={miningActive ? onStop : onStart}
        className={`mt-1 px-2 py-1 rounded-full text-[10px] font-semibold ${miningActive ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white`}
        style={{ fontSize: '10px' }}
      >
        {miningActive ? 'Unstake' : 'Stake'}
      </button>
    </div>
  );
}
