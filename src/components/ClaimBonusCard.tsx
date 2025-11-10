import { useState } from 'react';
import { claimBonus } from '../lib/exchange';

interface Props {
  userId: string;
  onClaimSuccess: () => void;
  onClose?: () => void;
}

export default function ClaimBonusCard({ userId, onClaimSuccess, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const options = ['BTC', 'USDT', 'SOL', 'BNB'];

  const handleClaim = async (currency: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await claimBonus(userId, currency);
      setSuccessMsg(`Berhasil klaim $300 sebagai ${currency} (~${parseFloat(res.amount).toFixed(8)} ${currency})`);

      // immediately notify parent to hide the card so it closes automatically
      onClaimSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal klaim bonus');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative mx-4">
        <div
          className="claim-card-pop claim-card-float bg-white/10 backdrop-blur-lg text-gray-900 rounded-2xl shadow-2xl border border-gray-300/30 p-0 w-auto relative flex flex-col items-center"
          style={{ maxWidth: 360, border: '1.5px solid rgba(255,255,255,0.18)' }}
        >
          {/* close button */}
          <button
            aria-label="Close claim"
            onClick={() => {
              if (typeof onClose === 'function') onClose();
            }}
            className="absolute right-2 top-2 text-gray-500 hover:text-gray-900 bg-white/80 rounded-full p-1 z-10"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
          >
            ✕
          </button>
          <img
            src="/claim/claim-card.jpg"
            alt="Claim Bonus"
            className="w-full object-contain rounded-t-2xl"
            style={{ aspectRatio: '1/1', maxHeight: 240, background: '#fff' }}
          />
          <div className="px-6 pb-6 pt-4 w-full flex flex-col items-center">
            <h3 className="text-xl font-bold text-center mb-1 text-white">CLAIM $300 FREE</h3>
            <p className="text-xs text-white text-center mb-4">Receive $300 one time upon registration. Select an asset to receive the bonus.</p>
            <div className="flex flex-wrap gap-2 justify-center mb-2">
              {options.map(opt => (
                <button
                  key={opt}
                  disabled={loading}
                  onClick={() => handleClaim(opt)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  {opt}
                </button>
              ))}
            </div>
            {error && <div className="mt-2 text-xs text-red-400">{error}</div>}
            {successMsg && <div className="mt-2 text-xs text-emerald-600">{successMsg}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
