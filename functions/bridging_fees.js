import {
  calculateAcrossBridgeFees,
  calculateAcrossBridgeSlippage
} from '../services/gasFeeService.js';

/**
 * Utility function to get bridging fees for ETH from Base to Arbitrum using Across Protocol
 * @param {string} amount - Amount of ETH to bridge (e.g., "0.1")
 * @returns {Promise<Object>} Bridge fee details including relayer fees, gas costs, and expected output
 * 
 * Example usage:
 * const fees = await getBridgingFees("0.1");
 * console.log(`Input: ${fees.inputAmount} ETH`);
 * console.log(`Output: ${fees.outputAmount} ETH`);
 * console.log(`Relayer Fee: ${fees.relayerFee.percentage} (${fees.relayerFee.amountEth} ETH)`);
 * console.log(`Gas Cost: ${fees.gasCostEth} ETH ($${fees.gasCostUsd})`);
 * console.log(`Total Fees: ${fees.totalFeesEth} ETH ($${fees.totalFeesUsd})`);
 */
export async function getBridgingFees(amount) {
  try {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('Invalid amount: must be a positive number');
    }

    const bridgeFees = await calculateAcrossBridgeFees(amount);
    
    return {
      protocol: bridgeFees.protocol,
      bridge: bridgeFees.bridge,
      inputAmount: bridgeFees.inputAmount,
      outputAmount: bridgeFees.outputAmount,
      relayerFee: {
        percentage: bridgeFees.fees.relayerFee.percentage,
        amountEth: bridgeFees.fees.relayerFee.amountEth,
        amountUsd: bridgeFees.fees.relayerFee.amountUsd
      },
      gasCostEth: bridgeFees.fees.gasFee.gasCostEth,
      gasCostUsd: bridgeFees.fees.gasFee.gasCostUsd,
      gasPrice: bridgeFees.fees.gasFee.gasPrice,
      totalFeesEth: bridgeFees.fees.totalFees.eth,
      totalFeesUsd: bridgeFees.fees.totalFees.usd,
      estimatedTime: bridgeFees.estimatedTime,
      timestamp: bridgeFees.timestamp
    };
  } catch (error) {
    throw new Error(`Failed to get bridging fees: ${error.message}`);
  }
}

/**
 * Utility function to get detailed slippage analysis for bridging ETH from Base to Arbitrum
 * @param {string} amount - Amount of ETH to bridge (e.g., "0.1")
 * @returns {Promise<Object>} Detailed slippage breakdown including LP fees, relayer fees, and capital costs
 * 
 * Example usage:
 * const slippage = await getBridgingSlippage("0.1");
 * console.log(`Total Slippage: ${slippage.totalSlippage.percentage}`);
 * console.log(`LP Fee: ${slippage.lpFee.percentage}`);
 * console.log(`Expected Output: ${slippage.expectedOutputEth} ETH`);
 */
export async function getBridgingSlippage(amount) {
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
      expectedOutputEth: slippageData.expectedOutputAmount.eth,
      expectedOutputUsd: slippageData.expectedOutputAmount.usd,
      totalSlippage: {
        percentage: slippageData.slippage.total.percentage,
        basisPoints: slippageData.slippage.total.basisPoints,
        amountEth: slippageData.slippage.total.amountEth,
        amountUsd: slippageData.slippage.total.amountUsd
      },
      lpFee: {
        percentage: slippageData.slippage.breakdown.lpFee.percentage,
        amountEth: slippageData.slippage.breakdown.lpFee.amountEth,
        amountUsd: slippageData.slippage.breakdown.lpFee.amountUsd,
        description: slippageData.slippage.breakdown.lpFee.description
      },
      relayerGasFee: {
        percentage: slippageData.slippage.breakdown.relayerGasFee.percentage,
        amountEth: slippageData.slippage.breakdown.relayerGasFee.amountEth,
        amountUsd: slippageData.slippage.breakdown.relayerGasFee.amountUsd,
        description: slippageData.slippage.breakdown.relayerGasFee.description
      },
      relayerCapitalFee: {
        percentage: slippageData.slippage.breakdown.relayerCapitalFee.percentage,
        amountEth: slippageData.slippage.breakdown.relayerCapitalFee.amountEth,
        amountUsd: slippageData.slippage.breakdown.relayerCapitalFee.amountUsd,
        description: slippageData.slippage.breakdown.relayerCapitalFee.description
      },
      priceImpact: slippageData.priceImpact,
      estimatedTime: slippageData.estimatedTime,
      dataSource: slippageData.dataSource,
      timestamp: slippageData.timestamp
    };
  } catch (error) {
    throw new Error(`Failed to get bridging slippage: ${error.message}`);
  }
}

/**
 * Utility function to get comprehensive bridging information (fees + slippage)
 * @param {string} amount - Amount of ETH to bridge (e.g., "0.1")
 * @returns {Promise<Object>} Complete bridging information including fees and slippage analysis
 * 
 * Example usage:
 * const info = await getCompleteBridgingInfo("0.1");
 * console.log(`Bridge: ${info.bridge}`);
 * console.log(`Total Fees: ${info.totalFeesEth} ETH ($${info.totalFeesUsd})`);
 * console.log(`Total Slippage: ${info.totalSlippagePercentage}`);
 */
export async function getCompleteBridgingInfo(amount) {
  try {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('Invalid amount: must be a positive number');
    }

    // Fetch both fees and slippage data in parallel
    const [fees, slippage] = await Promise.all([
      getBridgingFees(amount),
      getBridgingSlippage(amount)
    ]);

    return {
      protocol: fees.protocol,
      bridge: fees.bridge,
      inputAmount: amount,
      expectedOutput: fees.outputAmount,
      totalFeesEth: fees.totalFeesEth,
      totalFeesUsd: fees.totalFeesUsd,
      totalSlippagePercentage: slippage.totalSlippage.percentage,
      breakdown: {
        relayerFee: fees.relayerFee,
        gasCost: {
          eth: fees.gasCostEth,
          usd: fees.gasCostUsd,
          gasPrice: fees.gasPrice
        },
        slippageBreakdown: {
          lpFee: slippage.lpFee,
          relayerGasFee: slippage.relayerGasFee,
          relayerCapitalFee: slippage.relayerCapitalFee
        }
      },
      estimatedTime: fees.estimatedTime,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Failed to get complete bridging info: ${error.message}`);
  }
}

// Export all functions as a default object for convenience
export default {
  getBridgingFees,
  getBridgingSlippage,
  getCompleteBridgingInfo
};
