import {
  calculateBaseDepositGasFees,
  calculateArbitrumSwapGasFees,
  calculateArbitrumWithdrawGasFees
} from '@/services/gasFeeService';

/**
 * Utility function to get gas fees for depositing ETH to Base L2
 * @param {string} amount - Amount of ETH to deposit (e.g., "0.1")
 * @returns {Promise<Object>} Gas fee details including cost in ETH and USD
 * 
 * Example usage:
 * const fees = await getBaseDepositGasFees("0.1");
 * console.log(`Gas cost: ${fees.gasCostEth} ETH ($${fees.gasCostUsd})`);
 */
export async function getBaseDepositGasFees(amount) {
  try {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('Invalid amount: must be a positive number');
    }

    const gasFees = await calculateBaseDepositGasFees(amount);
    
    return {
      operation: 'Deposit ETH to Base',
      amount: amount,
      chain: gasFees.chain,
      bridgeTo: gasFees.bridgeTo,
      gasEstimate: gasFees.gasEstimate,
      gasPrice: gasFees.gasPrice,
      gasCostEth: gasFees.gasCostEth,
      gasCostUsd: gasFees.gasCostUsd,
      eip1559: gasFees.eip1559,
      timestamp: gasFees.timestamp
    };
  } catch (error) {
    throw new Error(`Failed to get Base deposit gas fees: ${error.message}`);
  }
}

/**
 * Utility function to get gas fees for swapping ETH to USDC on Arbitrum chain
 * @param {string} amount - Amount of ETH to swap (e.g., "0.1")
 * @param {number} feeTier - Fee tier (optional, default: 3000) - Valid values: 500, 3000, 10000
 * @returns {Promise<Object>} Gas fee details including cost and expected output
 * 
 * Example usage:
 * const fees = await getArbitrumSwapGasFees("0.1", 3000);
 * console.log(`Gas cost: ${fees.gasCostEth} ETH ($${fees.gasCostUsd})`);
 * console.log(`Expected output: ${fees.expectedOutput} USDC`);
 */
export async function getArbitrumSwapGasFees(amount, feeTier = 3000) {
  try {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('Invalid amount: must be a positive number');
    }

    if (![500, 3000, 10000].includes(feeTier)) {
      throw new Error('Invalid feeTier: must be 500, 3000, or 10000');
    }

    const gasFees = await calculateArbitrumSwapGasFees(amount, feeTier);
    
    return {
      operation: 'Swap ETH to USDC on Arbitrum',
      amount: amount,
      chain: gasFees.chain,
      protocol: gasFees.protocol,
      tokenIn: gasFees.tokenIn,
      tokenOut: gasFees.tokenOut,
      feeTier: gasFees.feeTier,
      expectedOutput: gasFees.expectedOutput,
      gasEstimate: gasFees.gasEstimate,
      gasPrice: gasFees.gasPrice,
      gasCostEth: gasFees.gasCostEth,
      gasCostUsd: gasFees.gasCostUsd,
      eip1559: gasFees.eip1559,
      timestamp: gasFees.timestamp
    };
  } catch (error) {
    throw new Error(`Failed to get Arbitrum swap gas fees: ${error.message}`);
  }
}

/**
 * Utility function to get gas fees for withdrawing ETH/USDC from Arbitrum chain
 * @param {string} amount - Amount of ETH to withdraw (e.g., "0.1")
 * @returns {Promise<Object>} Gas fee details including cost in ETH and USD
 * 
 * Example usage:
 * const fees = await getArbitrumWithdrawGasFees("0.1");
 * console.log(`Gas cost: ${fees.gasCostEth} ETH ($${fees.gasCostUsd})`);
 * console.log(`Note: ${fees.note}`);
 */
export async function getArbitrumWithdrawGasFees(amount) {
  try {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('Invalid amount: must be a positive number');
    }

    const gasFees = await calculateArbitrumWithdrawGasFees(amount);
    
    return {
      operation: 'Withdraw from Arbitrum',
      amount: amount,
      chain: gasFees.chain,
      bridgeTo: gasFees.bridgeTo,
      gasEstimate: gasFees.gasEstimate,
      gasPrice: gasFees.gasPrice,
      gasCostEth: gasFees.gasCostEth,
      gasCostUsd: gasFees.gasCostUsd,
      eip1559: gasFees.eip1559,
      note: gasFees.note,
      timestamp: gasFees.timestamp
    };
  } catch (error) {
    throw new Error(`Failed to get Arbitrum withdraw gas fees: ${error.message}`);
  }
}

/**
 * Utility function to get gas fees for the complete flow:
 * 1. Deposit ETH to Base
 * 2. Bridge from Base to Arbitrum
 * 3. Swap ETH to USDC on Arbitrum
 * 
 * @param {string} amount - Amount of ETH for the complete flow (e.g., "0.1")
 * @param {number} feeTier - Fee tier for swap (optional, default: 3000)
 * @returns {Promise<Object>} Combined gas fee details for all operations
 * 
 * Example usage:
 * const fees = await getCompleteFlowGasFees("0.1");
 * console.log(`Total gas cost: ${fees.totalGasCostEth} ETH ($${fees.totalGasCostUsd})`);
 */
export async function getCompleteFlowGasFees(amount, feeTier = 3000) {
  try {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('Invalid amount: must be a positive number');
    }

    if (![500, 3000, 10000].includes(feeTier)) {
      throw new Error('Invalid feeTier: must be 500, 3000, or 10000');
    }

    // Get fees for each step
    const depositFees = await getBaseDepositGasFees(amount);
    const swapFees = await getArbitrumSwapGasFees(amount, feeTier);

    // Calculate total costs
    const totalGasCostEth = (
      parseFloat(depositFees.gasCostEth) +
      parseFloat(swapFees.gasCostEth)
    ).toFixed(6);

    const totalGasCostUsd = (
      parseFloat(depositFees.gasCostUsd) +
      parseFloat(swapFees.gasCostUsd)
    ).toFixed(2);

    return {
      operation: 'Complete Flow (Deposit → Bridge → Swap)',
      amount: amount,
      steps: {
        deposit: depositFees,
        swap: swapFees
      },
      totalGasCostEth: totalGasCostEth,
      totalGasCostUsd: totalGasCostUsd,
      expectedUsdcOutput: swapFees.expectedOutput,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Failed to get complete flow gas fees: ${error.message}`);
  }
}

// Export all functions as a default object for convenience
export default {
  getBaseDepositGasFees,
  getArbitrumSwapGasFees,
  getArbitrumWithdrawGasFees,
  getCompleteFlowGasFees
};
