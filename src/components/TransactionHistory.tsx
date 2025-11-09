import { useState, useEffect } from 'react';
import { Clock, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight } from 'lucide-react';
import { getUserTransactions } from '../lib/exchange';
import { Transaction } from '../lib/supabase';

interface TransactionHistoryProps {
  userId: string;
  refreshKey: number;
}

export default function TransactionHistory({ userId, refreshKey }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, [userId, refreshKey]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await getUserTransactions(userId, 20);
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownCircle className="w-5 h-5 text-emerald-400" />;
      case 'withdraw':
        return <ArrowUpCircle className="w-5 h-5 text-cyan-400" />;
      case 'swap':
        return <ArrowLeftRight className="w-5 h-5 text-violet-400" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'text-emerald-400';
      case 'withdraw':
        return 'text-cyan-400';
      case 'swap':
        return 'text-violet-400';
      default:
        return 'text-slate-400';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount: string) => {
    return parseFloat(amount).toFixed(8).replace(/\.?0+$/, '');
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-8">
        <h2 className="text-xl font-semibold text-white mb-4">Transaction History</h2>
        <div className="text-center text-slate-400 py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-8">
      <h2 className="text-xl font-semibold text-white mb-6">Transaction History</h2>

      {transactions.length === 0 ? (
        <div className="text-center text-slate-400 py-8">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Belum ada transaksi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-800 rounded-lg">
                  {getTransactionIcon(tx.type)}
                </div>
                <div>
                  <div className="font-semibold text-white capitalize">
                    {tx.type}
                    {tx.type === 'swap' && tx.from_currency && tx.to_currency && (
                      <span className="text-sm text-slate-400 ml-2">
                        {tx.from_currency} → {tx.to_currency}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-400">{formatDate(tx.created_at)}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-semibold ${getTransactionColor(tx.type)}`}>
                  {tx.type === 'deposit' ? '+' : tx.type === 'withdraw' ? '-' : ''}
                  {formatAmount(tx.amount)} {tx.currency}
                </div>
                <div className={`text-sm px-2 py-0.5 rounded ${
                  tx.status === 'completed'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : tx.status === 'pending'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {tx.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
