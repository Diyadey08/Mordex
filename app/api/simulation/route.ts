import { NextRequest, NextResponse } from 'next/server';
import { getBridgingFees } from '../../../functions/bridging_fees.js';
import { getCompleteFlowGasFees } from '../../../functions/gas_fees.js';
import { getMevFees } from '../../../functions/mev_fees.js';
import { bridgeSlippage, ammSlippageETHtoUSDC } from '../../../functions/slippage_fees.js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, buyPrice, sellPrice } = body;

    // Validate input
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount: must be a positive number' },
        { status: 400 }
      );
    }

    if (!buyPrice || isNaN(parseFloat(buyPrice)) || parseFloat(buyPrice) <= 0) {
      return NextResponse.json(
        { error: 'Invalid buy price: must be a positive number' },
        { status: 400 }
      );
    }

    if (!sellPrice || isNaN(parseFloat(sellPrice)) || parseFloat(sellPrice) <= 0) {
      return NextResponse.json(
        { error: 'Invalid sell price: must be a positive number' },
        { status: 400 }
      );
    }

    const amountFloat = parseFloat(amount);
    const buyPriceFloat = parseFloat(buyPrice);
    const sellPriceFloat = parseFloat(sellPrice);

    // Calculate spread
    const spreadPercent = ((sellPriceFloat - buyPriceFloat) / buyPriceFloat * 100);

    // Fetch all fee calculations in parallel for better performance
    const [
      bridgingFeesData,
      gasFees,
      mevFees,
      bridgeSlippageData,
      ammSlippageData
    ] = await Promise.all([
      getBridgingFees(amount),
      getCompleteFlowGasFees(amount, 3000),
      getMevFees(amount),
      bridgeSlippage(amount),
      ammSlippageETHtoUSDC(amount, 3000)
    ]) as [any, any, any, any, any];

    // Calculate total costs
    const gasCostUsd = parseFloat(gasFees.totalGasCostUsd);
    
    // Calculate slippage
    const bridgeSlippagePercent = parseFloat(
      typeof bridgeSlippageData.totalSlippagePercentage === 'string' 
        ? bridgeSlippageData.totalSlippagePercentage.replace('%', '')
        : bridgeSlippageData.totalSlippagePercentage || '0'
    );
    
    const ammSlippagePercent = parseFloat(
      typeof ammSlippageData.slippagePercentage === 'string'
        ? ammSlippageData.slippagePercentage.replace('%', '')
        : ammSlippageData.slippagePercentage || '0'
    );
    
    const totalSlippagePercent = bridgeSlippagePercent + ammSlippagePercent;
    
    const bridgeSlippageUsd = parseFloat(bridgeSlippageData.totalLossUsd || '0');
    const ammSlippageUsd = parseFloat(ammSlippageData.slippageAmount || '0');
    const slippageUsd = bridgeSlippageUsd + ammSlippageUsd;
    
    const feesUsd = parseFloat(mevFees.totalMevCostUsd);
    const bridgingFeesUsd = parseFloat(bridgingFeesData.totalFeesUsd);

    // Calculate gross profit using user-provided prices
    const grossProfitUsd = amountFloat * (sellPriceFloat - buyPriceFloat);

    // Calculate net profit
    const totalCostsUsd = gasCostUsd + slippageUsd + feesUsd + bridgingFeesUsd;
    const netProfitUsd = grossProfitUsd - totalCostsUsd;

    // Calculate profit margin and ROI
    const tradeSizeUsd = amountFloat * buyPriceFloat;
    const profitMarginPct = (netProfitUsd / tradeSizeUsd) * 100;
    const roiPct = (netProfitUsd / tradeSizeUsd) * 100;

    // Determine if trade should be executed
    const shouldExecute = netProfitUsd > 0;

    // Response structure
    const simulation = {
      // User inputs
      amountInEth: amountFloat,
      buyPrice: buyPriceFloat,
      sellPrice: sellPriceFloat,
      spreadPercent,
      
      // Cost breakdown
      gasCostUsd,
      slippageUsd,
      feesUsd,
      bridgingFeesUsd,
      totalCostsUsd,
      
      // Profit calculations
      grossProfitUsd,
      netProfitUsd,
      profitMarginPct,
      roiPct,
      
      // Execution recommendation
      shouldExecute,
      recommendation: shouldExecute 
        ? ` EXECUTE - Net profit of $${netProfitUsd.toFixed(2)} expected`
        : ` DO NOT EXECUTE - Would result in loss of $${Math.abs(netProfitUsd).toFixed(2)}`,
      
      // Detailed slippage data
      slippageBreakdown: {
        bridge: {
          percent: bridgeSlippagePercent,
          usd: bridgeSlippageUsd,
          details: bridgeSlippageData
        },
        amm: {
          percent: ammSlippagePercent,
          usd: ammSlippageUsd,
          details: ammSlippageData
        },
        total: {
          percent: totalSlippagePercent,
          usd: slippageUsd
        }
      },
      
      // Gas breakdown
      gasBreakdown: gasFees,
      
      // Bridging breakdown
      bridgingBreakdown: bridgingFeesData,
      
      // MEV breakdown
      mevBreakdown: mevFees,
      
      // Liquidity info
      liquidityDepth: 'HIGH', // Mock for now
      tradeSizeUsd,
      
      // Execution steps
      breakdown: {
        step1: `Buy on Base at $${buyPriceFloat.toFixed(2)} per ETH`,
        step2: `Bridge ${amountFloat} ETH from Base to Arbitrum (fees: $${bridgingFeesUsd.toFixed(2)})`,
        step3: `Sell on Arbitrum at $${sellPriceFloat.toFixed(2)} per ETH`,
        step4: `Net profit after all costs: $${netProfitUsd.toFixed(2)}`
      }
    };

    return NextResponse.json({
      success: true,
      simulation
    });

  } catch (error: any) {
    console.error('Simulation API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to run simulation' 
      },
      { status: 500 }
    );
  }
}
