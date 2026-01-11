/**
 * Profit Calculation Math
 * 
 * Handles:
 * - Gas cost estimation
 * - Slippage calculation
 * - Fee calculation
 * - Net profit computation
 */

// ============ Constants ============

// Uniswap V3 fee tiers
export const POOL_FEES = {
  LOW: 500,      // 0.05%
  MEDIUM: 3000,  // 0.3%
  HIGH: 10000,   // 1%
};

// Estimated gas for arbitrage execution
// ETH wrap + 2 swaps + unwrap
export const ESTIMATED_GAS_UNITS = 350000;

// ============ Types ============

export interface ProfitCalculation {
  grossProfitUsd: number;
  gasCostUsd: number;
  slippageUsd: number;
  feesUsd: number;
  netProfitUsd: number;
  profitMarginPct: number;
}

export interface SimulationParams {
  amountInWei: bigint;
  ethPriceUsd: number;
  priceA: number;          // Price on pool A
  priceB: number;          // Price on pool B
  quoteAmountOut: bigint;  // From Quoter
  gasPrice: bigint;        // In wei
  poolFeeBps: number;      // Fee in basis points (3000 = 0.3%)
}

// ============ Functions ============

/**
 * Calculate gas cost in USD
 */
export function calculateGasCost(
  gasPrice: bigint,
  gasUnits: number,
  ethPriceUsd: number
): number {
  const gasCostWei = gasPrice * BigInt(gasUnits);
  const gasCostEth = Number(gasCostWei) / 1e18;
  return gasCostEth * ethPriceUsd;
}

/**
 * Calculate swap fee cost in USD
 */
export function calculateSwapFees(
  amountInWei: bigint,
  feeBps: number,
  ethPriceUsd: number
): number {
  // Fee is applied twice (buy + sell)
  const feeRate = (feeBps / 1_000_000) * 2;
  const amountInEth = Number(amountInWei) / 1e18;
  return amountInEth * ethPriceUsd * feeRate;
}

/**
 * Calculate slippage cost in USD
 * Slippage = difference between spot price and execution price
 */
export function calculateSlippageCost(
  amountInWei: bigint,
  spotPrice: number,
  executionPrice: number,
  ethPriceUsd: number
): number {
  const amountInEth = Number(amountInWei) / 1e18;
  const expectedOut = amountInEth * spotPrice;
  const actualOut = amountInEth * executionPrice;
  const slippageUsd = (expectedOut - actualOut);
  return Math.max(0, slippageUsd);
}

/**
 * Calculate gross profit from price spread
 */
export function calculateGrossProfit(
  amountInWei: bigint,
  buyPrice: number,   // ETH price where we buy (lower = better)
  sellPrice: number,  // ETH price where we sell (higher = better)
  ethPriceUsd: number
): number {
  const amountInEth = Number(amountInWei) / 1e18;
  
  // Profit from price difference
  // Buy ETH cheap (high ETH/USDC = more USDC needed per ETH)
  // Sell ETH expensive (high ETH/USDC = more USDC received per ETH)
  const priceDiff = sellPrice - buyPrice;
  const profitUsd = amountInEth * priceDiff;
  
  return profitUsd;
}

/**
 * Full profit calculation
 */
export function calculateFullProfit(params: SimulationParams): ProfitCalculation {
  const {
    amountInWei,
    ethPriceUsd,
    priceA,
    priceB,
    gasPrice,
    poolFeeBps,
  } = params;
  
  // Determine buy/sell based on prices
  const buyPrice = Math.min(priceA, priceB);
  const sellPrice = Math.max(priceA, priceB);
  
  // Calculate each component
  const grossProfitUsd = calculateGrossProfit(
    amountInWei,
    buyPrice,
    sellPrice,
    ethPriceUsd
  );
  
  const gasCostUsd = calculateGasCost(
    gasPrice,
    ESTIMATED_GAS_UNITS,
    ethPriceUsd
  );
  
  const feesUsd = calculateSwapFees(
    amountInWei,
    poolFeeBps,
    ethPriceUsd
  );
  
  // Estimate slippage as ~0.1% of trade for simplicity
  // In production, use Quoter for accurate simulation
  const amountInEth = Number(amountInWei) / 1e18;
  const slippageUsd = amountInEth * ethPriceUsd * 0.001;
  
  // Net profit
  const netProfitUsd = grossProfitUsd - gasCostUsd - feesUsd - slippageUsd;
  
  // Profit margin
  const tradeValueUsd = amountInEth * ethPriceUsd;
  const profitMarginPct = (netProfitUsd / tradeValueUsd) * 100;
  
  return {
    grossProfitUsd,
    gasCostUsd,
    slippageUsd,
    feesUsd,
    netProfitUsd,
    profitMarginPct,
  };
}

/**
 * Calculate price spread percentage
 */
export function calculateSpread(priceA: number, priceB: number): number {
  const minPrice = Math.min(priceA, priceB);
  const maxPrice = Math.max(priceA, priceB);
  return ((maxPrice - minPrice) / minPrice) * 100;
}

/**
 * Check if spread is actionable
 */
export function isActionableSpread(spreadPct: number, minSpreadPct: number = 0.1): boolean {
  return spreadPct >= minSpreadPct;
}

/**
 * Format ETH amount from wei
 */
export function formatEth(wei: bigint): string {
  return (Number(wei) / 1e18).toFixed(6);
}

/**
 * Format USD amount
 */
export function formatUsd(usd: number): string {
  return usd.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Parse ETH string to wei
 */
export function parseEthToWei(ethString: string): bigint {
  const eth = parseFloat(ethString);
  return BigInt(Math.floor(eth * 1e18));
}
