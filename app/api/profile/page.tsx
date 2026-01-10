'use client';

import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useRouter } from 'next/navigation';
import Hyperspeed from '@/components/Hyperspeed';
import Link from 'next/link';
import { User, ArrowLeft } from 'lucide-react';

interface Transaction {
  timestamp: number;
  amountIn: string;
  profit: string;
  isExecuteArb: boolean;
  date: string;
}

interface TransactionData {
  success: boolean;
  userAddress: string;
  transactions: Transaction[];
  totalTransactions: number;
  totalProfit: string;
  totalProfitWei: string;
}

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [transactions, setTransactions] = useState<TransactionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected) {
      return;
    }

    if (address) {
      fetchTransactions(address);
    }
  }, [address, isConnected]);

  const fetchTransactions = async (userAddress: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/transactions?address=${userAddress}`);
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data);
      } else {
        setError(data.error || 'Failed to fetch transactions');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        {/* Hyperspeed Background */}
        <div className="absolute inset-0 z-0">
          <Hyperspeed effectOptions={{
            colors: {
              roadColor: 0x080808,
              islandColor: 0x0a0a0a,
              background: 0x000000,
              shoulderLines: 0x20B2AA,
              brokenLines: 0x20B2AA,
              leftCars: [0x20B2AA, 0x008B8B, 0x006666],
              rightCars: [0x800000, 0x8B0000, 0x660000],
              sticks: 0x20B2AA
            }
          }} />
        </div>
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40 z-10"></div>

        <div className="relative z-20 min-h-screen flex items-center justify-center p-4">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 max-w-md w-full text-center border border-white/10 shadow-2xl">
            <User className="h-16 w-16 text-teal-400 mx-auto mb-4" />
            <h1 className="text-3xl font-light text-white mb-4">Profile</h1>
            <p className="text-white/70 mb-6 font-light">Please connect your wallet to view your transaction history</p>
            <Link href="/">
              <button className="bg-gradient-to-r from-teal-500/20 to-red-500/20 hover:from-teal-500/30 hover:to-red-500/30 text-white px-6 py-3 rounded-xl font-light transition-all border border-teal-500/30">
                Go to Home
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Hyperspeed Background */}
      <div className="absolute inset-0 z-0">
        <Hyperspeed effectOptions={{
          colors: {
            roadColor: 0x080808,
            islandColor: 0x0a0a0a,
            background: 0x000000,
            shoulderLines: 0x20B2AA,
            brokenLines: 0x20B2AA,
            leftCars: [0x20B2AA, 0x008B8B, 0x006666],
            rightCars: [0x800000, 0x8B0000, 0x660000],
            sticks: 0x20B2AA
          }
        }} />
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 z-10"></div>

      <div className="relative z-20 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          

          {/* Loading State */}
          {loading && (
            <div className="glass-dark rounded-2xl p-8 text-center border border-white/10 shadow-2xl">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mx-auto mb-4"></div>
              <p className="text-white font-light">Loading transactions...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="glass-dark rounded-2xl p-6 border border-red-500/50 shadow-2xl">
              <p className="text-red-300 text-center font-light">{error}</p>
            </div>
          )}

          {/* Transactions List */}
          {transactions && !loading && !error && (
            <div className="glass-dark rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-2xl font-light text-white">Transaction History</h2>
              </div>
              
              {transactions.transactions.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-zinc-400 text-lg font-light">No transactions yet</p>
                  <p className="text-zinc-500 text-sm mt-2 font-light">Execute some arbitrage trades to see your history here</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="glass-light">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-light text-zinc-400 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-light text-zinc-400 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-light text-zinc-400 uppercase tracking-wider">
                          Amount In
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-light text-zinc-400 uppercase tracking-wider">
                          Profit
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-light text-zinc-400 uppercase tracking-wider">
                          ROI
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {transactions.transactions.map((tx, index) => {
                        const roi = ((parseFloat(tx.profit) / parseFloat(tx.amountIn)) * 100).toFixed(2);
                        return (
                          <tr key={index} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-white font-light">
                                {new Date(tx.date).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-zinc-400 font-light">
                                {new Date(tx.date).toLocaleTimeString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 inline-flex text-xs leading-5 font-light rounded-full ${
                                tx.isExecuteArb 
                                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' 
                                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
                              }`}>
                                {tx.isExecuteArb ? 'Standard Arb' : 'Flexible Arb'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-white font-light font-mono">
                              {parseFloat(tx.amountIn).toFixed(6)} ETH
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-light font-mono text-green-400">
                              +{parseFloat(tx.profit).toFixed(6)} ETH
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-light font-mono text-green-400">
                              +{roi}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Refresh Button */}
          {transactions && !loading && (
            <div className="mt-6 text-center">
              <button
                onClick={() => address && fetchTransactions(address)}
                className="bg-gradient-to-r from-teal-500/20 to-red-500/20 hover:from-teal-500/30 hover:to-red-500/30 text-white px-6 py-3 rounded-xl font-light transition-all inline-flex items-center gap-2 border border-teal-500/30"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Refresh Transactions
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
