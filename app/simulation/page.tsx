'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAccount, useWriteContract } from 'wagmi';
import { parseEther } from 'viem';
import { ARBITRAGE_EXECUTOR_ABI, CONTRACT_ADDRESS } from '@/lib/contract-abi';
import Hyperspeed from '@/components/Hyperspeed';
import { ArrowLeft, TrendingUp, Zap, AlertCircle } from 'lucide-react';

export default function SimulationPage() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending: isExecuting } = useWriteContract();
  
  const [amount, setAmount] = useState('0.01');
  const [buyPrice, setBuyPrice] = useState('2900');
  const [sellPrice, setSellPrice] = useState('2950');
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [executionStatus, setExecutionStatus] = useState('');
  const [executionError, setExecutionError] = useState('');

  const runSimulation = async () => {
    setSimulating(true);
    setResult(null);
    setExecutionStatus('');
    setExecutionError('');

    try {
      const response = await fetch('/api/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          buyPrice: parseFloat(buyPrice),
          sellPrice: parseFloat(sellPrice),
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Simulation error:', error);
      setResult({
        success: false,
        error: 'Failed to run simulation',
      });
    } finally {
      setSimulating(false);
    }
  };

  const handleExecuteArbitrage = async () => {
    if (!isConnected) {
      setExecutionError('Please connect your wallet');
      return;
    }

    if (!result || !result.success || !result.simulation.shouldExecute) {
      setExecutionError('Cannot execute unprofitable trade');
      return;
    }

    try {
      setExecutionError('');
      setExecutionStatus('Preparing transaction...');

      const amountInWei = parseEther(amount);
      const minAmountOutBuy = BigInt(0); // Let contract handle slippage
      const minAmountOutSell = BigInt(0); // Let contract handle slippage

      setExecutionStatus('Waiting for wallet confirmation...');

      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: ARBITRAGE_EXECUTOR_ABI,
        functionName: 'executeArb',
        args: [amountInWei, minAmountOutBuy, minAmountOutSell],
      });

      setExecutionStatus('✅ Arbitrage executed successfully!');
    } catch (err: any) {
      console.error('Execution error:', err);
      setExecutionError(err.message || 'Failed to execute arbitrage');
      setExecutionStatus('');
    }
  };

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

      <div className="relative z-20 max-w-6xl mx-auto p-4 md:p-8">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Input Form */}
          <div className="space-y-6">
            {/* Simulation Form */}
            <div className="glass-dark rounded-2xl p-6 border border-white/10 shadow-2xl">
              <h2 className="text-xl font-light text-white mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-teal-400" />
                Simulation Parameters
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-light text-zinc-400 uppercase tracking-wider mb-2">
                    Trade Amount (ETH)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full glass-light rounded-xl px-4 py-3 text-white font-light focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
                    placeholder="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-light text-zinc-400 uppercase tracking-wider mb-2">
                    Buy Price (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                    className="w-full glass-light rounded-xl px-4 py-3 text-white font-light focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
                    placeholder="2900"
                  />
                  <p className="text-xs text-zinc-500 mt-1 font-light">Price to buy ETH on Base chain</p>
                </div>

                <div>
                  <label className="block text-sm font-light text-zinc-400 uppercase tracking-wider mb-2">
                    Sell Price (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    className="w-full glass-light rounded-xl px-4 py-3 text-white font-light focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
                    placeholder="2950"
                  />
                  <p className="text-xs text-zinc-500 mt-1 font-light">Price to sell ETH on Arbitrum chain</p>
                </div>

                <button
                  onClick={runSimulation}
                  disabled={simulating}
                  className="w-full btn-shiny-accent py-3 rounded-xl font-light text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {simulating ? 'Simulating...' : 'Run Simulation'}
                </button>
              </div>
            </div>

            {/* Info Card */}
            <div className="glass-dark rounded-2xl p-6 border border-white/10 shadow-2xl">
              <h3 className="text-sm font-light text-teal-400 uppercase tracking-wider mb-3">How it works</h3>
              <div className="space-y-2 text-sm text-white/70 font-light">
                <p>1. Enter your trade amount and price spread</p>
                <p>2. Run simulation to calculate all costs</p>
                <p>3. If profitable, execute the arbitrage</p>
                <p>4. Contract validates profit on-chain</p>
              </div>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {result && result.success && (
              <>
                {/* Net Profit Card */}
                <div className={`glass-dark rounded-2xl p-6 border-2 shadow-2xl ${
                  result.simulation.shouldExecute 
                    ? 'border-teal-500/50' 
                    : 'border-red-500/50'
                }`}>
                  <div className="text-xs text-zinc-400 uppercase mb-2 font-light tracking-wider">
                    Net Expected Profit
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-4xl font-light font-mono ${
                      result.simulation.netProfitUsd > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {result.simulation.netProfitUsd > 0 ? '+' : ''}${result.simulation.netProfitUsd.toFixed(2)}
                    </span>
                    {result.simulation.shouldExecute ? (
                      <span className="text-sm font-light text-teal-400 bg-teal-500/20 px-3 py-1 rounded-full border border-teal-500/30">
                        ✓ Profitable
                      </span>
                    ) : (
                      <span className="text-sm font-light text-red-400 bg-red-500/20 px-3 py-1 rounded-full border border-red-500/30">
                        ✗ Unprofitable
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-2 font-light">{result.simulation.recommendation}</p>
                </div>

                {/* Trading Details */}
                <div className="glass-dark rounded-2xl p-6 border border-white/10 shadow-2xl">
                  <h3 className="text-sm font-light text-zinc-400 uppercase tracking-wider mb-4">Trading Details</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="glass-light-shimmer rounded-xl p-3">
                      <div className="text-xs text-zinc-400 uppercase mb-1 font-light">Buy Price</div>
                      <div className="text-sm font-light text-zinc-100 font-mono">${result.simulation.buyPrice.toFixed(2)}</div>
                    </div>
                    <div className="glass-light-shimmer rounded-xl p-3">
                      <div className="text-xs text-zinc-400 uppercase mb-1 font-light">Sell Price</div>
                      <div className="text-sm font-light text-zinc-100 font-mono">${result.simulation.sellPrice.toFixed(2)}</div>
                    </div>
                    <div className="glass-light-shimmer rounded-xl p-3">
                      <div className="text-xs text-zinc-400 uppercase mb-1 font-light">Spread</div>
                      <div className="text-sm font-light text-zinc-100">{result.simulation.spreadPercent.toFixed(3)}%</div>
                    </div>
                    <div className="glass-light-shimmer rounded-xl p-3">
                      <div className="text-xs text-zinc-400 uppercase mb-1 font-light">Amount</div>
                      <div className="text-sm font-light font-mono text-zinc-100">{result.simulation.amountInEth} ETH</div>
                    </div>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="glass-dark rounded-2xl p-6 border border-white/10 shadow-2xl">
                  <h3 className="text-sm font-light text-zinc-400 uppercase tracking-wider mb-4">Cost Breakdown</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-400 font-light">Gas Cost:</span>
                      <span className="font-mono text-zinc-300 font-light">-${result.simulation.gasCostUsd.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-400 font-light">Slippage:</span>
                      <span className="font-mono text-zinc-300 font-light">-${result.simulation.slippageUsd.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-400 font-light">DEX Fees:</span>
                      <span className="font-mono text-zinc-300 font-light">-${result.simulation.feesUsd.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-400 font-light">Bridging Fees:</span>
                      <span className="font-mono text-zinc-300 font-light">-${result.simulation.bridgingFeesUsd.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-white/10 pt-2 mt-2 flex justify-between items-center text-sm font-light">
                      <span className="text-zinc-200">Gross Profit:</span>
                      <span className="font-mono text-teal-400">${result.simulation.grossProfitUsd.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-light">
                      <span className="text-zinc-200">Total Costs:</span>
                      <span className="font-mono text-red-400">-${result.simulation.totalCostsUsd.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-white/10 pt-2 mt-2 flex justify-between items-center">
                      <span className="text-white font-light">Net Profit:</span>
                      <span
                        className={`font-mono font-light ${
                          result.simulation.netProfitUsd > 0
                            ? 'text-green-400'
                            : 'text-red-400'
                        }`}
                      >
                        ${result.simulation.netProfitUsd.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Execute Button */}
                {isConnected && result.simulation.shouldExecute && (
                  <div className="glass-dark rounded-2xl p-6 border border-teal-500/30 shadow-2xl">
                    <button
                      onClick={handleExecuteArbitrage}
                      disabled={isExecuting}
                      className="w-full btn-shiny-accent py-3 rounded-xl font-light text-sm disabled:opacity-50"
                    >
                      {isExecuting ? 'Executing...' : '⚡ Execute Arbitrage'}
                    </button>
                    
                    {executionStatus && (
                      <div className="mt-3 p-3 rounded-xl glass-light border border-teal-500/30 text-teal-400 text-sm font-light text-center">
                        {executionStatus}
                      </div>
                    )}
                    
                    {executionError && (
                      <div className="mt-3 p-3 rounded-xl glass-light border border-red-500/30 text-red-400 text-sm font-light text-center">
                        {executionError}
                      </div>
                    )}
                  </div>
                )}

                {!isConnected && result.simulation.shouldExecute && (
                  <div className="glass-dark rounded-2xl p-6 border border-yellow-500/30 shadow-2xl">
                    <div className="flex items-center gap-2 text-yellow-400 mb-2">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-light">Wallet Not Connected</span>
                    </div>
                    <p className="text-sm text-zinc-400 font-light">
                      Connect your wallet to execute this profitable arbitrage opportunity
                    </p>
                  </div>
                )}
              </>
            )}

            {result && !result.success && (
              <div className="glass-dark rounded-2xl p-6 border border-red-500/50 shadow-2xl">
                <div className="text-red-400 font-light">
                  ❌ Simulation failed: {result.error || 'Unknown error'}
                </div>
              </div>
            )}

            {!result && (
              <div className="glass-dark rounded-2xl p-8 border border-white/10 shadow-2xl text-center">
                <Zap className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-400 font-light">Run a simulation to see results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
