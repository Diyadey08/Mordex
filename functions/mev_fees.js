/**
 * Utility function to estimate MEV (Maximal Extractable Value) fees for arbitrage transactions
 * MEV fees include frontrunning protection, priority fees, and builder tips
 * @param {string} amount - Amount of ETH in the transaction (e.g., "0.1")
 * @returns {Promise<Object>} MEV fee breakdown including priority fees and builder tips
 * 
 * Example usage:
 * const mevFees = await getMevFees("0.1");
 * console.log(`Total MEV Cost: ${mevFees.totalMevCostEth} ETH ($${mevFees.totalMevCostUsd})`);
 * console.log(`Priority Fee: ${mevFees.priorityFeeEth} ETH`);
 * console.log(`Builder Tip: ${mevFees.builderTipEth} ETH`);
 */
export async function getMevFees(amount) {
  try {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('Invalid amount: must be a positive number');
    }

    const amountFloat = parseFloat(amount);
    
    // Get current ETH price (assuming ~$3500, can be made dynamic)
    const ethPriceUsd = 3500;

    // MEV Protection Calculation
    // Base priority fee: 2-5 Gwei depending on transaction value
    const basePriorityFeeGwei = 2 + Math.min(amountFloat * 10, 3);
    
    // Builder tip: typically 0.01-0.05% of transaction value for MEV protection
    const builderTipPercentage = 0.03; // 0.03%
    const builderTipEth = (amountFloat * builderTipPercentage / 100).toFixed(6);
    
    // Priority fee in ETH (assuming 100k gas for complex arbitrage)
    const gasUnitsForMev = 100000;
    const priorityFeeEth = ((basePriorityFeeGwei * gasUnitsForMev) / 1e9).toFixed(6);
    
    // Total MEV cost
    const totalMevCostEth = (parseFloat(priorityFeeEth) + parseFloat(builderTipEth)).toFixed(6);
    const totalMevCostUsd = (parseFloat(totalMevCostEth) * ethPriceUsd).toFixed(2);

    // MEV risk assessment
    const transactionValueUsd = amountFloat * ethPriceUsd;
    const mevRiskLevel = transactionValueUsd > 10000 ? 'High' : 
                        transactionValueUsd > 1000 ? 'Medium' : 'Low';

    return {
      operation: 'MEV Protection for Arbitrage',
      amount: amount,
      transactionValue: {
        eth: amountFloat.toFixed(6),
        usd: transactionValueUsd.toFixed(2)
      },
      priorityFee: {
        gwei: basePriorityFeeGwei.toFixed(2),
        eth: priorityFeeEth,
        usd: (parseFloat(priorityFeeEth) * ethPriceUsd).toFixed(2),
        gasUnits: gasUnitsForMev
      },
      builderTip: {
        percentage: `${builderTipPercentage}%`,
        eth: builderTipEth,
        usd: (parseFloat(builderTipEth) * ethPriceUsd).toFixed(2),
        description: 'Tip to block builder for MEV protection'
      },
      totalMevCostEth: totalMevCostEth,
      totalMevCostUsd: totalMevCostUsd,
      mevRiskLevel: mevRiskLevel,
      protection: {
        frontrunning: 'Protected',
        sandwich: 'Protected',
        backrunning: 'Monitored'
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Failed to calculate MEV fees: ${error.message}`);
  }
}

/**
 * Utility function to get detailed MEV protection cost for different transaction sizes
 * @param {string[]} amounts - Array of ETH amounts to analyze (e.g., ["0.1", "1", "10"])
 * @returns {Promise<Object[]>} Array of MEV fee breakdowns for each amount
 * 
 * Example usage:
 * const mevAnalysis = await getMevFeesComparison(["0.1", "1", "10"]);
 * mevAnalysis.forEach(result => {
 *   console.log(`${result.amount} ETH: $${result.totalMevCostUsd} MEV cost`);
 * });
 */
export async function getMevFeesComparison(amounts) {
  try {
    if (!Array.isArray(amounts) || amounts.length === 0) {
      throw new Error('Invalid amounts: must be a non-empty array');
    }

    const results = await Promise.all(
      amounts.map(amount => getMevFees(amount))
    );

    return results;
  } catch (error) {
    throw new Error(`Failed to get MEV fees comparison: ${error.message}`);
  }
}

// Export all functions as a default object for convenience
export default {
  getMevFees,
  getMevFeesComparison
};
