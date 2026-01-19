import { calculateAcrossBridgeSlippage } from '../services/gasFeeService.js';
import { calculateSlippage, calculateETHtoUSDCSlippage } from '../services/slippageService.js';

/**
 * Utility function to calculate slippage for bridging ETH from Base to Arbitrum
 * @param {string} amount - Amount of ETH to bridge (e.g., "0.1")
 * @returns {Promise<Object>} Bridge slippage details including LP fees, relayer fees, and total slippage
 * 
 * Example usage:
 * const slippage = await bridgeSlippage("0.1");
 * console.log(`Total Slippage: ${slippage.totalSlippagePercentage}`);
 * console.log(`Expected Loss: ${slippage.totalLossEth} ETH ($${slippage.totalLossUsd})`);
 * console.log(`LP Fee: ${slippage.lpFeePercentage}`);
 */
export async function bridgeSlippage(amount) {
  try {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('Invalid amount: must be a positive number');
    }

    const slippageData = await calculateAcrossBridgeSlippage(amount);
    
    return {
      protocol: slippageData.protocol,
      bridge: slippageData.bridge,
      inputAmountEth: slippageData.inputAmount.eth,
      inputAmountUsd: slippageData.inputAmount.usd,
      outputAmountEth: slippageData.expectedOutputAmount.eth,
      outputAmountUsd: slippageData.expectedOutputAmount.usd,
      totalSlippagePercentage: slippageData.slippage.total.percentage,
      totalSlippageBasisPoints: slippageData.slippage.total.basisPoints,
      totalLossEth: slippageData.slippage.total.amountEth,
      totalLossUsd: slippageData.slippage.total.amountUsd,
      lpFeePercentage: slippageData.slippage.breakdown.lpFee.percentage,
      lpFeeEth: slippageData.slippage.breakdown.lpFee.amountEth,
      lpFeeUsd: slippageData.slippage.breakdown.lpFee.amountUsd,
      relayerGasFeePercentage: slippageData.slippage.breakdown.relayerGasFee.percentage,
      relayerGasFeeEth: slippageData.slippage.breakdown.relayerGasFee.amountEth,
      relayerGasFeeUsd: slippageData.slippage.breakdown.relayerGasFee.amountUsd,
      relayerCapitalFeePercentage: slippageData.slippage.breakdown.relayerCapitalFee.percentage,
      relayerCapitalFeeEth: slippageData.slippage.breakdown.relayerCapitalFee.amountEth,
      relayerCapitalFeeUsd: slippageData.slippage.breakdown.relayerCapitalFee.amountUsd,
      priceImpact: slippageData.priceImpact.percentage,
      estimatedTime: slippageData.estimatedTime,
      dataSource: slippageData.dataSource,
      timestamp: slippageData.timestamp
    };
  } catch (error) {
    throw new Error(`Failed to calculate bridge slippage: ${error.message}`);
  }
}

/**
 * Utility function to calculate AMM slippage for swapping ETH to USDC on Arbitrum (Uniswap V3)
 * @param {string} amount - Amount of ETH to swap (e.g., "1", "0.5")
 * @returns {Promise<Object>} AMM slippage details including price impact and expected output
 * 
 * Example usage:
 * const slippage = await ammSlippage("1");
 * console.log(`Slippage: ${slippage.slippagePercentage}`);
 * console.log(`Price Impact: ${slippage.priceImpactPercentage}`);
 * console.log(`Expected Output: ${slippage.expectedOutputAmount} USDC`);
 */
export async function ammSlippage(amount) {
  try {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('Invalid amount: must be a positive number');
    }

    // Hardcoded values: Arbitrum, ETH -> USDC, fee tier 3000 (0.3%)
    const chain = 'arbitrum';
    const feeTier = 3000;
    
    // Define WETH and USDC tokens for Arbitrum
    const tokenIn = {
      address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      symbol: 'WETH',
      decimals: 18
    };
    
    const tokenOut = {
      address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      symbol: 'USDC',
      decimals: 6
    };

    const slippageData = await calculateSlippage(chain, tokenIn, tokenOut, amount, feeTier);
    
    return {
      chain: slippageData.chain,
      protocol: 'Uniswap V3',
      poolAddress: slippageData.poolAddress,
      swap: 'ETH → USDC',
      tokenIn: {
        symbol: slippageData.tokenIn.symbol,
        address: slippageData.tokenIn.address,
        amount: slippageData.tokenIn.amount
      },
      tokenOut: {
        symbol: slippageData.tokenOut.symbol,
        address: slippageData.tokenOut.address
      },
      feeTier: slippageData.feeTier,
      currentPrice: slippageData.currentPrice,
      executionPrice: slippageData.executionPrice,
      expectedOutputAmount: slippageData.expectedAmountOut,
      actualOutputAmount: slippageData.actualAmountOut,
      slippageAmount: slippageData.slippage.amount,
      slippagePercentage: slippageData.slippage.formatted,
      priceImpactPercentage: slippageData.priceImpact.formatted,
      poolLiquidity: slippageData.liquidity,
      currentTick: slippageData.currentTick,
      timestamp: slippageData.timestamp
    };
  } catch (error) {
    throw new Error(`Failed to calculate AMM slippage: ${error.message}`);
  }
}

/**
 * Utility function to calculate AMM slippage for ETH to USDC swap on Arbitrum (convenience function)
 * @param {string} ethAmount - Amount of ETH to swap (e.g., "1", "0.5")
 * @param {number} feeTier - Optional fee tier (default: 500 for 0.05%)
 * @returns {Promise<Object>} AMM slippage details for ETH to USDC swap
 * 
 * Example usage:
 * const slippage = await ammSlippageETHtoUSDC("1", 500);
 * console.log(`Slippage: ${slippage.slippagePercentage}`);
 * console.log(`You will receive: ${slippage.actualOutputAmount} USDC`);
 */
export async function ammSlippageETHtoUSDC(ethAmount, feeTier = 3000) {
  try {
    if (!ethAmount || parseFloat(ethAmount) <= 0) {
      throw new Error('Invalid ethAmount: must be a positive number');
    }

    if (![500, 3000, 10000].includes(feeTier)) {
      throw new Error('Invalid feeTier: must be 500, 3000, or 10000');
    }

    const slippageData = await calculateETHtoUSDCSlippage(ethAmount, feeTier);
    
    return {
      chain: slippageData.chain,
      protocol: 'Uniswap V3',
      poolAddress: slippageData.poolAddress,
      swap: `${slippageData.tokenIn.symbol} → ${slippageData.tokenOut.symbol}`,
      inputAmount: `${slippageData.tokenIn.amount} ${slippageData.tokenIn.symbol}`,
      feeTier: slippageData.feeTier,
      currentPrice: slippageData.currentPrice,
      executionPrice: slippageData.executionPrice,
      expectedOutputAmount: slippageData.expectedAmountOut,
      actualOutputAmount: slippageData.actualAmountOut,
      slippageAmount: slippageData.slippage.amount,
      slippagePercentage: slippageData.slippage.formatted,
      priceImpactPercentage: slippageData.priceImpact.formatted,
      poolLiquidity: slippageData.liquidity,
      timestamp: slippageData.timestamp
    };
  } catch (error) {
    throw new Error(`Failed to calculate ETH to USDC slippage: ${error.message}`);
  }
}

/**
 * Utility function to get combined slippage for complete flow (bridge + swap)
 * @param {string} bridgeAmount - Amount of ETH to bridge from Base to Arbitrum
 * @param {string} swapAmount - Amount of ETH to swap to USDC on Arbitrum
 * @param {number} feeTier - Fee tier for the swap (default: 500)
 * @returns {Promise<Object>} Combined slippage for bridge and swap operations
 * 
 * Example usage:
 * const slippage = await getCombinedSlippage("0.1", "0.1", 500);
 * console.log(`Total Slippage: ${slippage.totalSlippagePercentage}`);
 * console.log(`Bridge Slippage: ${slippage.bridgeSlippagePercentage}`);
 * console.log(`Swap Slippage: ${slippage.swapSlippagePercentage}`);
 */
export async function getCombinedSlippage(bridgeAmount, swapAmount, feeTier = 3000) {
  try {
    if (!bridgeAmount || parseFloat(bridgeAmount) <= 0) {
      throw new Error('Invalid bridgeAmount: must be a positive number');
    }

    if (!swapAmount || parseFloat(swapAmount) <= 0) {
      throw new Error('Invalid swapAmount: must be a positive number');
    }

    // Get both slippage calculations in parallel
    const [bridgeSlippageData, swapSlippageData] = await Promise.all([
      bridgeSlippage(bridgeAmount),
      ammSlippageETHtoUSDC(swapAmount, feeTier)
    ]);

    // Calculate combined slippage
    const bridgeSlippagePct = parseFloat(bridgeSlippageData.totalSlippagePercentage);
    const swapSlippagePct = parseFloat(swapSlippageData.slippagePercentage);
    
    // For sequential operations: total slippage ≈ sum of individual slippages (for small percentages)
    const totalSlippage = bridgeSlippagePct + swapSlippagePct;

    return {
      operation: 'Bridge ETH (Base → Arbitrum) + Swap ETH to USDC',
      bridgeAmount: bridgeAmount,
      swapAmount: swapAmount,
      bridgeSlippagePercentage: bridgeSlippageData.totalSlippagePercentage,
      swapSlippagePercentage: swapSlippageData.slippagePercentage,
      totalSlippagePercentage: `${totalSlippage.toFixed(4)}%`,
      bridgeDetails: {
        inputEth: bridgeSlippageData.inputAmountEth,
        outputEth: bridgeSlippageData.outputAmountEth,
        lossEth: bridgeSlippageData.totalLossEth,
        lossUsd: bridgeSlippageData.totalLossUsd
      },
      swapDetails: {
        inputEth: swapAmount,
        expectedUsdc: swapSlippageData.expectedOutputAmount,
        actualUsdc: swapSlippageData.actualOutputAmount,
        priceImpact: swapSlippageData.priceImpactPercentage
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Failed to calculate combined slippage: ${error.message}`);
  }
}

// Export all functions as a default object for convenience
export default {
  bridgeSlippage,
  ammSlippage,
  ammSlippageETHtoUSDC,
  getCombinedSlippage
};
