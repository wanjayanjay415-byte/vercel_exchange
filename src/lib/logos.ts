// Mapping sederhana dari symbol ke path logo SVG di `src/assets/logos`.
// Tambahkan atau ganti file SVG di folder tersebut sesuai kebutuhan.

import usdtLogo from '../assets/logos/usdt.svg';
import bnbLogo from '../assets/logos/bnb.svg';
import baseLogo from '../assets/logos/base.svg';
import solLogo from '../assets/logos/sol.svg';

const LOGO_MAP: Record<string, string> = {
  USDT: usdtLogo,
  BNB: bnbLogo,
  BASE: baseLogo,
  SOL: solLogo,
};

export function getLogoForCurrency(currency: string): string | undefined {
  return LOGO_MAP[currency];
}

export default LOGO_MAP;
