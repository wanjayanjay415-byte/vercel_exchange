import { useState, useEffect } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { getDepositAddresses } from '../lib/exchange';
import { DepositAddress } from '../lib/supabase';

interface DepositModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function DepositModal({ onClose, onSuccess }: DepositModalProps) {
  const { lang } = useLanguage();
  const [addresses, setAddresses] = useState<DepositAddress[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState('USDT');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const data = await getDepositAddresses();
      setAddresses(data);
    } catch (error) {
      console.error('Error loading addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentAddress = addresses.find(a => a.currency === selectedCurrency);

  const handleCopy = async () => {
    if (currentAddress) {
      await navigator.clipboard.writeText(currentAddress.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 modal-overlay">
      <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 max-w-lg w-full modal-pop-panel">
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">Deposit Crypto</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center text-slate-400 py-8">Loading...</div>
          ) : (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  {lang === 'id' ? 'Pilih Cryptocurrency' : 'Select Cryptocurrency'}
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {addresses.map((addr) => (
                    <button
                      key={addr.currency}
                      onClick={() => setSelectedCurrency(addr.currency)}
                      className={`p-3 rounded-lg font-semibold transition-all ${
                        selectedCurrency === addr.currency
                          ? 'bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-lg'
                          : 'bg-slate-900/50 text-slate-400 hover:bg-slate-700/50'
                      }`}
                    >
                      {addr.currency}
                    </button>
                  ))}
                </div>
              </div>

              {currentAddress && (
                <div className="space-y-4">
                  <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
                    <div className="text-sm text-slate-400 mb-2">{lang === 'id' ? 'Deposit Address' : 'Deposit Address'}</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-800 p-3 rounded-lg border border-slate-600">
                        <code className="text-emerald-400 text-sm break-all">
                          {currentAddress.address}
                        </code>
                      </div>
                      <button
                        onClick={handleCopy}
                        className="p-3 bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors"
                      >
                        {copied ? (
                          <Check className="w-5 h-5 text-white" />
                        ) : (
                          <Copy className="w-5 h-5 text-white" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/50 rounded-lg p-4">
                    <div className="flex gap-2">
                      <div className="text-amber-500 font-semibold">⚠️</div>
                      <div className="text-sm text-amber-200">
                        <p className="font-semibold mb-1">{lang === 'id' ? 'Penting:' : 'Important:'}</p>
                        <ul className="space-y-1 text-xs">
                          <li>• {lang === 'id' ? `Hanya kirim ${selectedCurrency} ke address ini` : `Only send ${selectedCurrency} to this address`}</li>
                          <li>• {lang === 'id' ? 'Kirim dari network yang benar' : 'Send from the correct network'}</li>
                          <li>• {lang === 'id' ? 'Deposit akan otomatis masuk setelah konfirmasi blockchain' : 'Deposits will be credited after blockchain confirmations'}</li>
                          {(selectedCurrency === 'USDT' || selectedCurrency === 'BNB' || selectedCurrency === 'ETH' || selectedCurrency === 'BASE') && (
                            <li>• {lang === 'id' ? 'Address untuk EVM compatible chains' : 'Address for EVM-compatible chains'}</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onSuccess();
                      onClose();
                    }}
                    className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold py-3 rounded-lg transition-all"
                  >
                    {lang === 'id' ? 'Saya Sudah Transfer' : 'I Have Transferred'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
