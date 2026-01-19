import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const RPC_URLS = {
  base: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
  arbitrum: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc'
};

// Create a fresh provider for each request to avoid caching
export const getProvider = (chain) => {
  const chainLower = chain.toLowerCase();
  if (!RPC_URLS[chainLower]) {
    throw new Error(`Unsupported chain: ${chain}`);
  }
  // Create new provider instance each time to bypass any caching
  return new ethers.JsonRpcProvider(RPC_URLS[chainLower], undefined, {
    staticNetwork: true,
    batchMaxCount: 1 // Disable batching to ensure fresh data
  });
};
