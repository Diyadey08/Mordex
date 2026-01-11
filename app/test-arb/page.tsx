'use client';

import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { parseEther, formatEther } from 'viem';
import { ARBITRAGE_EXECUTOR_ABI, CONTRACT_ADDRESS } from '@/lib/contract-abi';

// Network configurations
const NETWORKS = {
  baseSepolia: {
    name: 'Base Sepolia',
    chainId: 84532,
    weth: '0x4200000000000000000000000000000000000006',
    usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    swapRouter: '0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4',
  },
  arbitrumSepolia: {
    name: 'Arbitrum Sepolia',
    chainId: 421614,
    weth: '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73',
    usdc: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    swapRouter: '0x101F443B4d1b059569D643917553c771E1b9663E',
  },
};

// Fee tiers
const FEE_TIERS = {
  '0.01%': 100,
  '0.05%': 500,
  '0.3%': 3000,
  '1%': 10000,
};

export default function TestArbPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const { writeContractAsync, isPending: isExecuting } = useWriteContract();
  const { data: userBalance } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: ARBITRAGE_EXECUTOR_ABI,
    functionName: 'getUserBalance',
    args: address ? [address] : undefined,
  });

  // Form state
  const [network, setNetwork] = useState<'baseSepolia' | 'arbitrumSepolia'>('baseSepolia');
  const [tokenInAddress, setTokenInAddress] = useState('');
  const [tokenOutAddress, setTokenOutAddress] = useState('');
  const [feeBuy, setFeeBuy] = useState(3000);
  const [feeSell, setFeeSell] = useState(3000);
  const [amountIn, setAmountIn] = useState('');
  const [minAmountOutBuy, setMinAmountOutBuy] = useState('0');
  const [minAmountOutSell, setMinAmountOutSell] = useState('0');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  // Auto-fill function
  const autoFillNetwork = (net: 'baseSepolia' | 'arbitrumSepolia') => {
    setNetwork(net);
    const config = NETWORKS[net];
    setTokenInAddress(config.weth);
    setTokenOutAddress(config.usdc);
  };

  const handleExecute = async () => {
    if (!isConnected) {
      setError('Please connect your wallet');
      return;
    }

    try {
      setError('');
      setStatus('Preparing transaction...');

      const amountInWei = parseEther(amountIn);
      const minOutBuy = minAmountOutBuy ? parseEther(minAmountOutBuy) : BigInt(0);
      const minOutSell = minAmountOutSell ? parseEther(minAmountOutSell) : BigInt(0);

      setStatus('Waiting for wallet confirmation...');

      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: ARBITRAGE_EXECUTOR_ABI,
        functionName: 'executeArbitrageFlexible',
        args: [
          tokenInAddress as `0x${string}`,
          tokenOutAddress as `0x${string}`,
          feeBuy,
          feeSell,
          amountInWei,
          minOutBuy,
          minOutSell,
        ],
      });

      setStatus('✅ Arbitrage executed successfully!');
      setTimeout(() => {
        router.push('/profile');
      }, 2000);
    } catch (err: any) {
      console.error('Execution error:', err);
      setError(err.message || 'Failed to execute arbitrage');
      setStatus('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white">Test Flexible Arbitrage</h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
          {isConnected && userBalance && (
            <p className="text-gray-300">
              Your Balance: <span className="font-bold text-white">{formatEther(userBalance)} ETH</span>
            </p>
          )}
        </div>

        {!isConnected ? (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center">
            <p className="text-white text-lg mb-4">Please connect your wallet to test arbitrage</p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Go to Home
            </button>
          </div>
        ) : (
          <>
            {/* Quick Fill Buttons */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-4">Quick Fill Presets</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => autoFillNetwork('baseSepolia')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg font-semibold transition-colors"
                >
                  🔵 Base Sepolia WETH ↔ USDC
                </button>
                <button
                  onClick={() => autoFillNetwork('arbitrumSepolia')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-lg font-semibold transition-colors"
                >
                  🟣 Arbitrum Sepolia WETH ↔ USDC
                </button>
              </div>
            </div>

            {/* Configuration Form */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-4">Arbitrage Configuration</h2>
              
              <div className="space-y-4">
                {/* Network Info */}
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-gray-400 text-sm mb-2">Selected Network</p>
                  <p className="text-white font-semibold">{NETWORKS[network].name}</p>
                </div>

                {/* Token In */}
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Token In (Buy With)
                  </label>
                  <input
                    type="text"
                    value={tokenInAddress}
                    onChange={(e) => setTokenInAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-white/10 text-white border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-gray-400 text-sm mt-1">
                    Example: WETH - {NETWORKS[network].weth}
                  </p>
                </div>

                {/* Token Out */}
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Token Out (Buy This)
                  </label>
                  <input
                    type="text"
                    value={tokenOutAddress}
                    onChange={(e) => setTokenOutAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-white/10 text-white border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-gray-400 text-sm mt-1">
                    Example: USDC - {NETWORKS[network].usdc}
                  </p>
                </div>

                {/* Fee Buy */}
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Buy Pool Fee Tier
                  </label>
                  <select
                    value={feeBuy}
                    onChange={(e) => setFeeBuy(Number(e.target.value))}
                    className="w-full bg-white/10 text-white border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                  >
                    {Object.entries(FEE_TIERS).map(([label, value]) => (
                      <option key={value} value={value} className="bg-gray-800">
                        {label} Fee ({value})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fee Sell */}
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Sell Pool Fee Tier
                  </label>
                  <select
                    value={feeSell}
                    onChange={(e) => setFeeSell(Number(e.target.value))}
                    className="w-full bg-white/10 text-white border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                  >
                    {Object.entries(FEE_TIERS).map(([label, value]) => (
                      <option key={value} value={value} className="bg-gray-800">
                        {label} Fee ({value})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount In */}
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Amount In (ETH or Token Amount)
                  </label>
                  <input
                    type="text"
                    value={amountIn}
                    onChange={(e) => setAmountIn(e.target.value)}
                    placeholder="0.01"
                    className="w-full bg-white/10 text-white border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-gray-400 text-sm mt-1">
                    Amount to use for arbitrage (in ETH or token units)
                  </p>
                </div>

                {/* Min Amount Out Buy */}
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Min Amount Out (Buy) - Optional
                  </label>
                  <input
                    type="text"
                    value={minAmountOutBuy}
                    onChange={(e) => setMinAmountOutBuy(e.target.value)}
                    placeholder="0"
                    className="w-full bg-white/10 text-white border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-gray-400 text-sm mt-1">
                    Minimum tokens to receive in first swap (0 = no minimum, risky!)
                  </p>
                </div>

                {/* Min Amount Out Sell */}
                <div>
                  <label className="block text-white font-semibold mb-2">
                    Min Amount Out (Sell) - Optional
                  </label>
                  <input
                    type="text"
                    value={minAmountOutSell}
                    onChange={(e) => setMinAmountOutSell(e.target.value)}
                    placeholder="0"
                    className="w-full bg-white/10 text-white border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-gray-400 text-sm mt-1">
                    Minimum tokens to receive in second swap (0 = no minimum, risky!)
                  </p>
                </div>
              </div>

              {/* Execute Button */}
              <button
                onClick={handleExecute}
                disabled={isExecuting || !amountIn || !tokenInAddress || !tokenOutAddress}
                className="w-full mt-6 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg font-bold text-lg transition-colors"
              >
                {isExecuting ? 'Executing...' : 'Execute Flexible Arbitrage'}
              </button>
            </div>

            {/* Status Messages */}
            {status && (
              <div className="bg-blue-500/20 backdrop-blur-md rounded-2xl p-6 mb-6 border border-blue-500/50">
                <p className="text-blue-300 text-center font-semibold">{status}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/20 backdrop-blur-md rounded-2xl p-6 mb-6 border border-red-500/50">
                <p className="text-red-300 text-center">{error}</p>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">📋 How to Fill</h2>
              <div className="space-y-3 text-gray-300">
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="font-semibold text-white mb-2">1. Choose Network</p>
                  <p>Click a quick fill button to auto-populate addresses for that network</p>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="font-semibold text-white mb-2">2. Token Addresses</p>
                  <p className="text-sm">
                    <span className="text-blue-300">Base Sepolia:</span><br/>
                    WETH: {NETWORKS.baseSepolia.weth}<br/>
                    USDC: {NETWORKS.baseSepolia.usdc}
                  </p>
                  <p className="text-sm mt-2">
                    <span className="text-purple-300">Arbitrum Sepolia:</span><br/>
                    WETH: {NETWORKS.arbitrumSepolia.weth}<br/>
                    USDC: {NETWORKS.arbitrumSepolia.usdc}
                  </p>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <p className="font-semibold text-white mb-2">3. Fee Tiers</p>
                  <p>Select the Uniswap pool fee tier (usually 0.3% = 3000 works best)</p>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <p className="font-semibold text-white mb-2">4. Amount</p>
                  <p>Enter amount in ETH (e.g., 0.01 for a small test)</p>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <p className="font-semibold text-white mb-2">5. Execute</p>
                  <p>Click execute and confirm in your wallet. View results in your profile!</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
