// Simple static mapping for logos that are bundled in `src/assets/logos`.
// This approach avoids runtime errors caused by non-standard import.meta features
// in some environments. If you prefer to place logos in `public/`, put them
// in `public/logos/<currency>.svg` and the function will fall back to that path.

import usdtLogo from '../assets/logos/usdt.svg';
import bnbLogo from '../assets/logos/bnb.svg';
import baseLogo from '../assets/logos/base.svg';
import solLogo from '../assets/logos/sol.svg';
import ethLogo from '../assets/logos/eth.svg';
import btcLogo from '../assets/logos/btc.svg';

const LOGO_MAP: Record<string, string> = {
  USDT: usdtLogo,
  BNB: bnbLogo,
  BASE: baseLogo,
  SOL: solLogo,
  ETH: ethLogo,
  BTC: btcLogo,
  // BTC is commonly provided by users; if you want it bundled, add btc.svg to src/assets/logos
};

export function getLogoForCurrency(currency: string): string | undefined {
  if (!currency) return undefined;
  const upper = currency.toUpperCase();
  // direct mapping
  if (LOGO_MAP[upper]) return LOGO_MAP[upper];

  // aliases
  if (upper === 'BITCOIN') return LOGO_MAP['BTC'];

  // Fallback: try loading from public folder /logos/<currency>.svg (works in dev & production
  // if you place files in public/logos)
  const publicPath = `/logos/${upper.toLowerCase()}.svg`;
  return publicPath;
}

export default LOGO_MAP;
