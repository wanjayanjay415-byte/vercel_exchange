import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCryptoPrice } from '../lib/exchange';

const COINS = ['BTC', 'ETH', 'BNB', 'SOL', 'BASE'];

function fetchCandleData(symbol: string) {
  // Simulate fetching candle data from CoinGecko or other API
  // Replace with real API integration as needed
  return Promise.resolve([
    { time: Date.now() - 60000 * 4, open: 100, high: 110, low: 95, close: 105 },
    { time: Date.now() - 60000 * 3, open: 105, high: 115, low: 100, close: 110 },
    { time: Date.now() - 60000 * 2, open: 110, high: 120, low: 105, close: 115 },
    { time: Date.now() - 60000 * 1, open: 115, high: 125, low: 110, close: 120 },
    { time: Date.now(), open: 120, high: 130, low: 115, close: 125 },
  ]);
}

function CandleChart({ symbol }: { symbol: string }) {
  const [candles, setCandles] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      const data = await fetchCandleData(symbol);
      if (mounted) setCandles(data);
    };
    fetchData();
    const interval = setInterval(fetchData, 15000); // refresh every 15s
    return () => { mounted = false; clearInterval(interval); };
  }, [symbol]);

  return (
    <div className="bg-slate-900 rounded-xl p-4 shadow-lg mb-8">
      <h3 className="text-lg font-bold text-white mb-2">{symbol} Candle Chart</h3>
      <div className="flex gap-2 items-end h-32">
        {candles.map((candle, idx) => {
          const color = candle.close >= candle.open ? 'bg-emerald-400' : 'bg-red-400';
          const height = Math.max(20, Math.abs(candle.close - candle.open) * 2);
          return (
            <div key={idx} className="flex flex-col items-center justify-end">
              <div className={`w-6 ${color}`} style={{ height }} />
              <span className="text-xs text-white mt-1">{candle.close}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ChartsPage() {
  const navigate = useNavigate?.() || ((url: string) => { window.location.href = url; });
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <button
        className="mb-6 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800"
        onClick={() => navigate('/')}
      >
        ← Back to Dashboard
      </button>
      <h1 className="text-2xl font-bold text-white mb-8">Crypto Candle Charts</h1>
      {COINS.map((coin) => (
        <CandleChart key={coin} symbol={coin} />
      ))}
    </div>
  );
}
