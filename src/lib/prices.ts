import { useEffect, useState } from 'react';
import { getUSDToIDRRate } from './exchange';

// Map our currency symbols to CoinGecko ids
const COINGECKO_IDS: Record<string, string> = {
  USDT: 'tether',
  BTC: 'bitcoin',
  ETH: 'ethereum',
  BNB: 'binancecoin',
  SOL: 'solana',
  BASE: 'base-token'
};

export type PriceMap = Record<string, number>; // symbol -> USD price

export async function fetchLivePrices(symbols: string[]): Promise<PriceMap> {
  const ids = Array.from(new Set(symbols.map(s => COINGECKO_IDS[s] || '').filter(Boolean)));
  if (ids.length === 0) return {};

  // CoinGecko simple price endpoint
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch prices: ${res.status}`);
  const data = await res.json();

  const out: PriceMap = {};
  for (const sym of symbols) {
    const id = COINGECKO_IDS[sym];
    if (id && data[id] && typeof data[id].usd === 'number') {
      out[sym] = data[id].usd;
    }
  }

  return out;
}

export function useLivePrices(symbols: string[], intervalMs = 15000) {
  const [prices, setPrices] = useState<PriceMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    let timer: any = null;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const p = await fetchLivePrices(symbols);
        if (!mounted) return;
        setPrices(p);
        setLastUpdated(Date.now());
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();
    timer = setInterval(run, intervalMs);

    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
    };
  }, [JSON.stringify(symbols), intervalMs]);

  const convertUsdToIdr = (usd: number) => usd * getUSDToIDRRate();

  return { prices, loading, error, lastUpdated, convertUsdToIdr } as const;
}
