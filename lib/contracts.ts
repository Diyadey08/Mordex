/**
 * Contract Interaction Helpers (Testnet Only)
 * 
 * For server-side operations:
 * - Price fetching
 * - Gas estimation
 * - Read-only contract queries
 * 
 * NOTE: All write operations (deposit, withdraw, execute)
 * are handled client-side via wagmi hooks
 */

import { ethers } from 'ethers';

// ============ Testnet Configuration ============

export const TESTNET_CONFIG = {
  baseSepolia: {
    chainId: 84532,
    rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
    explorer: 'https://sepolia.basescan.org',
    swapRouter: '0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4',
    weth: '0x4200000000000000000000000000000000000006',
    usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  },
  arbitrumSepolia: {
    chainId: 421614,
    rpcUrl: process.env.ARBITRUM_SEPOLIA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc',
    explorer: 'https://sepolia.arbiscan.io',
    swapRouter: '0x101F443B4d1b059569D643917553c771E1b9663E',
    weth: '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73',
    usdc: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
  },
};

// ============ ABIs ============

export const ARBITRAGE_EXECUTOR_ABI = [
  // Read functions
  'function owner() external view returns (address)',
  'function getBalance(address user) external view returns (uint256)',
  'function getContractBalance() external view returns (uint256)',
  'function userBalances(address user) external view returns (uint256)',
  'function WETH() external view returns (address)',
  'function USDC() external view returns (address)',
  'function swapRouter() external view returns (address)',
  'function POOL_FEE() external view returns (uint24)',
  'function contractBalance() external view returns (uint256)',
  'function getUserBalance(address user) external view returns (uint256)',
  'function getUserTransactions(address user) external view returns (tuple(uint256 timestamp, uint256 amountIn, uint256 profit, bool isExecuteArb)[])',
  
  // Write functions (called via wagmi on client)
  'function deposit() external payable',
  'function withdraw(uint256 amount) external',
  'function withdrawAll() external',
  'function executeArb(uint256 amountIn, uint256 minProfit) external',
  
  // Events
  'event ArbitrageExecuted(address indexed user, uint256 indexed timestamp, uint256 ethBefore, uint256 ethAfter, uint256 profit, uint256 amountIn)',
  'event FundsDeposited(address indexed from, uint256 amount)',
  'event FundsWithdrawn(address indexed to, uint256 amount)',
];

// ============ Provider Setup (Testnet) ============

/**
 * Get a read-only provider for testnet
 */
export function getProvider(chain: 'baseSepolia' | 'arbitrumSepolia' = 'baseSepolia'): ethers.JsonRpcProvider {
  const config = TESTNET_CONFIG[chain];
  return new ethers.JsonRpcProvider(config.rpcUrl);
}

/**
 * NOTE: Signer is no longer used server-side
 * All transactions are signed by user wallet via wagmi
 */

// ============ Contract Instances ============

/**
 * Get ArbitrageExecutor contract (read-only)
 */
export function getExecutorContract(chain: 'baseSepolia' | 'arbitrumSepolia' = 'baseSepolia'): ethers.Contract {
  const address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_ARBITRAGE_EXECUTOR_ADDRESS;
  
  if (!address) {
    throw new Error('Contract address not set. Run: npx hardhat run scripts/deploy.ts --network baseSepolia');
  }
  
  const provider = getProvider(chain);
  return new ethers.Contract(address, ARBITRAGE_EXECUTOR_ABI, provider);
}

// ============ Read-Only Helpers ============

/**
 * Get user's deposited balance
 */
export async function getUserBalance(
  userAddress: string,
  chain: 'baseSepolia' | 'arbitrumSepolia' = 'baseSepolia'
): Promise<bigint> {
  const contract = getExecutorContract(chain);
  return contract.getBalance(userAddress);
}

/**
 * Get total contract balance
 */
export async function getContractBalance(chain: 'baseSepolia' | 'arbitrumSepolia' = 'baseSepolia'): Promise<bigint> {
  const contract = getExecutorContract(chain);
  return contract.getContractBalance();
}

/**
 * Get current gas price
 */
export async function getGasPrice(chain: 'baseSepolia' | 'arbitrumSepolia' | 'base' | 'arbitrum' = 'baseSepolia'): Promise<bigint> {
  try {
    // Normalize chain names
    const normalizedChain = chain === 'base' ? 'baseSepolia' : 
                           chain === 'arbitrum' ? 'arbitrumSepolia' : 
                           chain;
    
    const provider = getProvider(normalizedChain as 'baseSepolia' | 'arbitrumSepolia');
    const feeData = await provider.getFeeData();
    
    // Use gasPrice if available, otherwise use maxFeePerGas, or fallback to 1 gwei
    const gasPrice = feeData.gasPrice || feeData.maxFeePerGas || ethers.parseUnits('1', 'gwei');
    
    console.log('[Gas Price]', normalizedChain, ':', ethers.formatUnits(gasPrice, 'gwei'), 'gwei');
    
    return gasPrice;
  } catch (error) {
    console.error('[Gas Price] Error fetching gas price:', error);
    // Fallback to 1 gwei for testnet
    return ethers.parseUnits('1', 'gwei');
  }
}

/**
 * Estimate gas for arbitrage execution
 * Returns default estimate since we can't simulate without user's balance context
 */
export function estimateGas(): bigint {
  // Conservative estimate for:
  // deposit WETH + swap WETH→USDC + swap USDC→WETH + withdraw
  return BigInt(400000);
}
