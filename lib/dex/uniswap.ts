/**
 * Uniswap V3 Integration
 * 
 * Handles:
 * - Price fetching from pools
 * - Quote simulation
 * - Swap execution helpers
 */

import { ethers } from 'ethers';

// ============ Contract Addresses ============

export const ADDRESSES = {
  base: {
    swapRouter: ethers.getAddress('0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4'), // Base Sepolia SwapRouter
    quoter: ethers.getAddress('0xC5290058841028F1614F3A6F0F5816cAd0df5E27'),      // Base Sepolia Quoter V2
    weth: ethers.getAddress('0x4200000000000000000000000000000000000006'),       // Base Sepolia WETH
    usdc: ethers.getAddress('0x036CbD53842c5426634e7929541eC2318f3dCF7e'),       // Base Sepolia USDC
    ethUsdcPool: ethers.getAddress('0xd0b53D9277642d899DF5C87A3966A349A798F224'),  // Base Sepolia ETH/USDC Pool
  },
  arbitrum: {
    swapRouter: ethers.getAddress('0x101F443B4d1b059569D643917553c771E1b9663E'),  // Arbitrum Sepolia SwapRouter
    quoter: ethers.getAddress('0x2779a0CC1c3e0E44D2542EC3e79e3864Ae93Ef0B'),       // Arbitrum Sepolia Quoter
    weth: ethers.getAddress('0x980B62Da83eFf3D4576C647993b0c1D7faf17c73'),       // Arbitrum Sepolia WETH
    usdc: ethers.getAddress('0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d'),       // Arbitrum Sepolia USDC
    ethUsdcPool: ethers.getAddress('0x80d201E993E22e56D97F4A3c93F14aD3F75C5EAc'),  // Arbitrum Sepolia ETH/USDC Pool (example)
  },
};

// ============ ABIs ============

// Uniswap V3 Pool - minimal ABI for price reads
export const POOL_ABI = [
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function liquidity() external view returns (uint128)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function fee() external view returns (uint24)',
];

// Uniswap V3 Quoter V2 - for swap simulation
export const QUOTER_ABI = [
  'function quoteExactInputSingle(tuple(address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96) params) external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)',
];

// ============ Price Math ============

/**
 * Convert Uniswap V3 sqrtPriceX96 to human-readable price
 * 
 * @param sqrtPriceX96 - The sqrt price from slot0
 * @param token0Decimals - Decimals of token0
 * @param token1Decimals - Decimals of token1
 * @param invert - If true, returns price of token0 in terms of token1
 * @returns Price as a number
 */
export function sqrtPriceX96ToPrice(
  sqrtPriceX96: bigint,
  token0Decimals: number = 18,
  token1Decimals: number = 6,
  invert: boolean = false
): number {
  // sqrtPriceX96 = sqrt(price) * 2^96
  // price = (sqrtPriceX96 / 2^96)^2
  const Q96 = BigInt(2) ** BigInt(96);
  const Q192 = Q96 * Q96;
  
  // Calculate raw price: (sqrtPriceX96^2) / 2^192
  const sqrtPriceX96Squared = sqrtPriceX96 * sqrtPriceX96;
  
  // Adjust for decimal difference
  const decimalAdjustment = 10 ** (token0Decimals - token1Decimals);
  
  // Price of token1 in terms of token0
  const price = Number(sqrtPriceX96Squared) / Number(Q192) * decimalAdjustment;
  
  return invert ? 1 / price : price;
}

/**
 * Get ETH/USDC price from Uniswap pool
 * 
 * @param provider - Ethers provider
 * @param chain - 'base' or 'arbitrum'
 * @returns Price of ETH in USDC
 */
export async function getEthUsdcPrice(
  provider: ethers.Provider,
  chain: 'base' | 'arbitrum' = 'base'
): Promise<{ price: number; liquidity: bigint; sqrtPriceX96: bigint }> {
  const addresses = ADDRESSES[chain];
  const pool = new ethers.Contract(addresses.ethUsdcPool, POOL_ABI, provider);
  
  // Get slot0 (contains price) and liquidity
  const [slot0, liquidity, token0] = await Promise.all([
    pool.slot0(),
    pool.liquidity(),
    pool.token0(),
  ]);
  
  const sqrtPriceX96 = slot0.sqrtPriceX96;
  
  // Determine if WETH is token0 or token1
  const wethIsToken0 = token0.toLowerCase() === addresses.weth.toLowerCase();
  
  // Calculate price
  // If WETH is token0: price is token1/token0 = USDC/WETH
  // If WETH is token1: price is token0/token1 = USDC/WETH (inverted)
  let price = sqrtPriceX96ToPrice(
    sqrtPriceX96,
    wethIsToken0 ? 18 : 6, // token0 decimals
    wethIsToken0 ? 6 : 18, // token1 decimals
    wethIsToken0 // invert if WETH is token0
  );
  
  return {
    price,
    liquidity,
    sqrtPriceX96,
  };
}

/**
 * Get quote for exact input swap
 * 
 * @param provider - Ethers provider
 * @param amountIn - Amount of input token (in wei)
 * @param tokenIn - Input token address
 * @param tokenOut - Output token address
 * @param fee - Pool fee tier (default 3000 = 0.3%)
 * @param chain - 'base' or 'arbitrum'
 * @returns Quote result with amount out and gas estimate
 */
export async function getQuote(
  provider: ethers.Provider,
  amountIn: bigint,
  tokenIn: string,
  tokenOut: string,
  fee: number = 3000,
  chain: 'base' | 'arbitrum' = 'base'
): Promise<{
  amountOut: bigint;
  gasEstimate: bigint;
  sqrtPriceX96After: bigint;
}> {
  const addresses = ADDRESSES[chain];
  const quoter = new ethers.Contract(addresses.quoter, QUOTER_ABI, provider);
  
  try {
    const result = await quoter.quoteExactInputSingle.staticCall({
      tokenIn,
      tokenOut,
      amountIn,
      fee,
      sqrtPriceLimitX96: 0,
    });
    
    return {
      amountOut: result.amountOut,
      gasEstimate: result.gasEstimate,
      sqrtPriceX96After: result.sqrtPriceX96After,
    };
  } catch (error) {
    console.error('Quote failed:', error);
    throw error;
  }
}

/**
 * Calculate slippage from a swap
 * 
 * @param amountIn - Input amount
 * @param amountOut - Output amount
 * @param expectedPrice - Expected price (before slippage)
 * @returns Slippage percentage (e.g., 0.5 = 0.5%)
 */
export function calculateSlippage(
  amountIn: bigint,
  amountOut: bigint,
  expectedPrice: number,
  inputDecimals: number = 18,
  outputDecimals: number = 6
): number {
  const actualPrice = Number(amountOut) / (10 ** outputDecimals) / 
                     (Number(amountIn) / (10 ** inputDecimals));
  const slippage = ((expectedPrice - actualPrice) / expectedPrice) * 100;
  return Math.abs(slippage);
}

/**
 * Get pool liquidity depth classification
 */
export function classifyLiquidity(liquidity: bigint): 'low' | 'medium' | 'high' {
  const liquidityNum = Number(liquidity);
  
  if (liquidityNum < 1e15) return 'low';
  if (liquidityNum < 1e18) return 'medium';
  return 'high';
}
