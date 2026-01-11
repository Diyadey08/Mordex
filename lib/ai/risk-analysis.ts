/**
 * 🧠 ArbiMind AI Layer - Specialized Risk Analysis
 * 
 * This module contains specialized AI agents for specific risk dimensions.
 * Each agent has ONE job: evaluate risk in its domain.
 * 
 * Philosophy: AI predicts regret, not profit.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// ============ Slippage Risk Analysis ============

export interface SlippageRiskInput {
  slippageUsd: number;
  tradeSizeUsd: number;
  liquidityUsd: number;
  netProfitUsd: number;
  poolDepth: 'shallow' | 'medium' | 'deep';
}

export interface SlippageRiskOutput {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  reason: string;
  confidence: number;
}

const SLIPPAGE_PROMPT = `You are a DeFi slippage risk analyzer.

Your ONLY job: determine if slippage is acceptable in context.

Context matters:
- $0.10 slippage in $10M pool with $100 profit = LOW risk
- $0.10 slippage in $50K pool with $0.15 profit = HIGH risk

Analyze:
- Slippage as % of profit
- Trade size relative to liquidity
- Pool depth quality

Rules:
- If slippage > 50% of net profit → HIGH
- If slippage > 25% of net profit AND pool is shallow → MEDIUM
- If trade size > 0.1% of pool liquidity → MEDIUM
- Otherwise → LOW

Return ONLY valid JSON:
{
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "reason": "one sentence explaining the risk assessment",
  "confidence": 0.0 to 1.0
}`;

export async function analyzeSlippageRisk(input: SlippageRiskInput): Promise<SlippageRiskOutput> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return fallbackSlippageRisk(input);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const slippagePercent = input.netProfitUsd > 0 ? (input.slippageUsd / input.netProfitUsd) * 100 : 100;
    const tradeSizePercent = (input.tradeSizeUsd / input.liquidityUsd) * 100;

    const prompt = `${SLIPPAGE_PROMPT}

SLIPPAGE ANALYSIS:
- Slippage Cost: $${input.slippageUsd.toFixed(4)}
- Net Profit: $${input.netProfitUsd.toFixed(4)}
- Slippage as % of Profit: ${slippagePercent.toFixed(1)}%

LIQUIDITY CONTEXT:
- Trade Size: $${input.tradeSizeUsd.toFixed(2)}
- Pool Liquidity: $${input.liquidityUsd.toFixed(0)}
- Trade as % of Pool: ${tradeSizePercent.toFixed(4)}%
- Pool Depth: ${input.poolDepth}

Analyze the risk:`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 150,
      },
    });

    const response = result.response.text();
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        riskLevel: parsed.riskLevel || 'MEDIUM',
        reason: parsed.reason || 'Risk analysis completed',
        confidence: Math.min(1, Math.max(0, parsed.confidence || 0.7)),
      };
    }

    return fallbackSlippageRisk(input);
  } catch (error) {
    console.error('Slippage risk analysis error:', error);
    return fallbackSlippageRisk(input);
  }
}

function fallbackSlippageRisk(input: SlippageRiskInput): SlippageRiskOutput {
  const slippagePercent = input.netProfitUsd > 0 ? (input.slippageUsd / input.netProfitUsd) * 100 : 100;
  const tradeSizePercent = (input.tradeSizeUsd / input.liquidityUsd) * 100;

  if (slippagePercent > 50) {
    return {
      riskLevel: 'HIGH',
      reason: `Slippage is ${slippagePercent.toFixed(0)}% of net profit - unacceptable`,
      confidence: 0.9,
    };
  }

  if (slippagePercent > 25 && input.poolDepth === 'shallow') {
    return {
      riskLevel: 'MEDIUM',
      reason: 'Slippage significant relative to profit in shallow pool',
      confidence: 0.8,
    };
  }

  if (tradeSizePercent > 0.1) {
    return {
      riskLevel: 'MEDIUM',
      reason: 'Trade size is large relative to pool liquidity',
      confidence: 0.75,
    };
  }

  return {
    riskLevel: 'LOW',
    reason: 'Slippage is manageable relative to profit and liquidity',
    confidence: 0.85,
  };
}

// ============ MEV Risk Analysis ============

export interface MEVRiskInput {
  tradeSizeUsd: number;
  slippageUsd: number;
  liquidityUsd: number;
  netProfitUsd: number;
  dex: string;
  gasUsd: number;
}

export interface MEVRiskOutput {
  mevRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  reason: string;
  confidence: number;
}

const MEV_PROMPT = `You are a DeFi MEV (Maximal Extractable Value) risk analyzer.

Your ONLY job: estimate if this trade is attractive to MEV bots.

MEV bots look for:
1. High slippage (easy to sandwich)
2. Large trades (profitable to front-run)
3. Thin liquidity (amplifies price impact)
4. Margin > gas cost (worth attacking)

MEV bots DON'T care about:
- Tiny trades (gas cost > profit)
- Deep liquidity (hard to move price)
- Trades with tight slippage protection

Rules:
- If slippage > $2 AND trade > $50 → HIGH
- If profit margin < $5 AND slippage < $1 → LOW
- If trade < 0.01% of pool → LOW
- Consider gas cost as MEV barrier

Return ONLY valid JSON:
{
  "mevRisk": "LOW" | "MEDIUM" | "HIGH",
  "reason": "one sentence explaining MEV attractiveness",
  "confidence": 0.0 to 1.0
}`;

export async function analyzeMEVRisk(input: MEVRiskInput): Promise<MEVRiskOutput> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return fallbackMEVRisk(input);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const tradeSizePercent = (input.tradeSizeUsd / input.liquidityUsd) * 100;
    const profitGasRatio = input.gasUsd > 0 ? input.netProfitUsd / input.gasUsd : 0;

    const prompt = `${MEV_PROMPT}

TRADE CHARACTERISTICS:
- Trade Size: $${input.tradeSizeUsd.toFixed(2)}
- Slippage: $${input.slippageUsd.toFixed(4)}
- Net Profit: $${input.netProfitUsd.toFixed(4)}
- Gas Cost: $${input.gasUsd.toFixed(4)}

LIQUIDITY CONTEXT:
- Pool Liquidity: $${input.liquidityUsd.toFixed(0)}
- Trade as % of Pool: ${tradeSizePercent.toFixed(4)}%
- DEX: ${input.dex}

MEV ATTRACTIVENESS:
- Profit/Gas Ratio: ${profitGasRatio.toFixed(2)}x
- Sandwich Potential: ${input.slippageUsd > 1 ? 'High' : 'Low'}

Analyze MEV risk:`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 150,
      },
    });

    const response = result.response.text();
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        mevRisk: parsed.mevRisk || 'MEDIUM',
        reason: parsed.reason || 'MEV risk analysis completed',
        confidence: Math.min(1, Math.max(0, parsed.confidence || 0.7)),
      };
    }

    return fallbackMEVRisk(input);
  } catch (error) {
    console.error('MEV risk analysis error:', error);
    return fallbackMEVRisk(input);
  }
}

function fallbackMEVRisk(input: MEVRiskInput): MEVRiskOutput {
  const tradeSizePercent = (input.tradeSizeUsd / input.liquidityUsd) * 100;

  // High MEV risk criteria
  if (input.slippageUsd > 2 && input.tradeSizeUsd > 50) {
    return {
      mevRisk: 'HIGH',
      reason: 'Large trade with high slippage is very attractive to sandwich bots',
      confidence: 0.9,
    };
  }

  // Medium MEV risk
  if (input.slippageUsd > 1 || tradeSizePercent > 0.05) {
    return {
      mevRisk: 'MEDIUM',
      reason: 'Trade size or slippage makes sandwich attack possible',
      confidence: 0.8,
    };
  }

  // Low MEV risk
  if (input.netProfitUsd < 5 && input.slippageUsd < 1) {
    return {
      mevRisk: 'LOW',
      reason: 'Small profit and low slippage make attack uneconomical',
      confidence: 0.85,
    };
  }

  return {
    mevRisk: 'LOW',
    reason: 'Trade characteristics unlikely to attract MEV bots',
    confidence: 0.75,
  };
}

// ============ Timing Risk Analysis ============

export interface TimingRiskInput {
  gasUsd: number;
  netProfitUsd: number;
  chain: string;
  blockTime: number; // seconds
  gasPriceVolatility?: number; // 0-1 scale
}

export interface TimingRiskOutput {
  timingRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  reason: string;
  confidence: number;
}

const TIMING_PROMPT = `You are a DeFi execution timing risk analyzer.

Your ONLY job: assess if the execution window is stable enough.

Timing risks:
1. Gas price volatility (can spike between simulation and execution)
2. Block congestion (delays execution)
3. Profit margin vs gas cost (thin margins vulnerable to gas spikes)

A trade that looks profitable now can become unprofitable if:
- Gas spikes 50% before execution
- Profit margin < 2x gas cost

Rules:
- If gas cost > 50% of net profit → HIGH
- If gas cost > 30% of net profit → MEDIUM
- If profit margin > 5x gas cost → LOW
- Consider chain's block time stability

Return ONLY valid JSON:
{
  "timingRisk": "LOW" | "MEDIUM" | "HIGH",
  "reason": "one sentence explaining timing stability",
  "confidence": 0.0 to 1.0
}`;

export async function analyzeTimingRisk(input: TimingRiskInput): Promise<TimingRiskOutput> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return fallbackTimingRisk(input);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const gasProfitRatio = input.netProfitUsd > 0 ? (input.gasUsd / input.netProfitUsd) * 100 : 100;
    const profitGasMultiple = input.gasUsd > 0 ? input.netProfitUsd / input.gasUsd : 0;

    const prompt = `${TIMING_PROMPT}

TIMING ANALYSIS:
- Gas Cost: $${input.gasUsd.toFixed(4)}
- Net Profit: $${input.netProfitUsd.toFixed(4)}
- Gas as % of Profit: ${gasProfitRatio.toFixed(1)}%
- Profit/Gas Multiple: ${profitGasMultiple.toFixed(2)}x

EXECUTION CONTEXT:
- Chain: ${input.chain}
- Block Time: ${input.blockTime}s
- Gas Volatility: ${input.gasPriceVolatility ? 'High' : 'Normal'}

VULNERABILITY:
- If gas spikes 50%, profit becomes: $${(input.netProfitUsd - input.gasUsd * 0.5).toFixed(4)}

Analyze timing risk:`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 150,
      },
    });

    const response = result.response.text();
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        timingRisk: parsed.timingRisk || 'MEDIUM',
        reason: parsed.reason || 'Timing risk analysis completed',
        confidence: Math.min(1, Math.max(0, parsed.confidence || 0.7)),
      };
    }

    return fallbackTimingRisk(input);
  } catch (error) {
    console.error('Timing risk analysis error:', error);
    return fallbackTimingRisk(input);
  }
}

function fallbackTimingRisk(input: TimingRiskInput): TimingRiskOutput {
  const gasProfitRatio = input.netProfitUsd > 0 ? (input.gasUsd / input.netProfitUsd) : 1;
  const profitGasMultiple = input.gasUsd > 0 ? input.netProfitUsd / input.gasUsd : 0;

  if (gasProfitRatio > 0.5) {
    return {
      timingRisk: 'HIGH',
      reason: `Gas cost is ${(gasProfitRatio * 100).toFixed(0)}% of profit - vulnerable to gas spikes`,
      confidence: 0.9,
    };
  }

  if (gasProfitRatio > 0.3) {
    return {
      timingRisk: 'MEDIUM',
      reason: 'Profit margin thin relative to gas cost - moderate timing risk',
      confidence: 0.8,
    };
  }

  if (profitGasMultiple > 5) {
    return {
      timingRisk: 'LOW',
      reason: 'Strong profit margin provides buffer against gas volatility',
      confidence: 0.85,
    };
  }

  return {
    timingRisk: 'LOW',
    reason: 'Execution timing window appears stable',
    confidence: 0.75,
  };
}
