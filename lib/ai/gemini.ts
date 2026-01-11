/**
 * 🧠 Arbfarm AI Layer — Execution-Aware Risk Engine
 * 
 * This is NOT buzzword AI.
 * This is decision intelligence for execution risk.
 * 
 * The AI layer is a risk-filter that decides whether an arbitrage 
 * opportunity should be executed AFTER accounting for:
 * - Slippage under real liquidity
 * - Gas volatility
 * - MEV risk (sandwich attacks)
 * - Execution safety margin
 * 
 * What the AI does:
 * - Receives deterministic, numeric inputs (no hallucination)
 * - Returns binary decision: EXECUTE or SKIP
 * - Provides analytical reasoning
 * - Does NOT predict prices
 * - Does NOT trade
 * 
 * The AI's edge is judgment, not speed.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// ============ Types ============

export interface SimulationData {
  spread: number;           // Price spread percentage
  gasCostUsd: number;       // Gas cost in USD
  slippageUsd: number;      // Slippage cost in USD
  feesUsd: number;          // Swap fees in USD
  netProfitUsd: number;     // Net profit after all costs
  liquidityDepth: 'low' | 'medium' | 'high';
  amountInEth: number;      // Trade size in ETH
}

export interface AIDecision {
  decision: 'EXECUTE' | 'SKIP';
  reason: string;
  confidence: number;
  riskAnalysis: {
    gasRisk: 'low' | 'medium' | 'high';
    slippageRisk: 'low' | 'medium' | 'high';
    mevRisk: 'low' | 'medium' | 'high';
    profitMargin: 'thin' | 'acceptable' | 'safe';
  };
}

// ============ Enhanced Prompt (Judge-Grade) ============

const SYSTEM_PROMPT = `You are a DeFi arbitrage execution risk engine.

Your ONLY job is to decide whether an arbitrage trade should execute after considering execution risks.

You are NOT:
- A price predictor
- A trading signal generator
- A market analyst

You ARE:
- A risk filter
- An execution safety validator
- A cost-benefit analyzer

Analyze each trade for:
1. Gas risk: Will gas spikes eliminate profit?
2. Slippage risk: Is liquidity sufficient for trade size?
3. MEV risk: Is the trade attractive to sandwich bots?
4. Profit margin: Is there buffer against execution variance?

Return ONLY valid JSON. No markdown. No explanations outside JSON.`;

function buildDecisionPrompt(data: SimulationData): string {
  const totalCosts = data.gasCostUsd + data.slippageUsd + data.feesUsd;
  const grossProfit = data.netProfitUsd + totalCosts;
  const gasCostRatio = grossProfit > 0 ? (data.gasCostUsd / grossProfit) * 100 : 100;
  const slippageRatio = grossProfit > 0 ? (data.slippageUsd / grossProfit) * 100 : 100;
  
  return `You are a DeFi arbitrage execution risk engine.

Analyze this opportunity and decide: EXECUTE or SKIP

TRADE PARAMETERS:
- Trade Size: ${data.amountInEth.toFixed(4)} ETH
- Price Spread: ${data.spread.toFixed(3)}%
- Liquidity Depth: ${data.liquidityDepth}

COST BREAKDOWN:
- Gas Cost: $${data.gasCostUsd.toFixed(2)} (${gasCostRatio.toFixed(1)}% of gross profit)
- Slippage: $${data.slippageUsd.toFixed(2)} (${slippageRatio.toFixed(1)}% of gross profit)
- Swap Fees: $${data.feesUsd.toFixed(2)}
- Total Costs: $${totalCosts.toFixed(2)}

PROFIT:
- Gross Profit: $${grossProfit.toFixed(2)}
- Net Profit: $${data.netProfitUsd.toFixed(2)}

RISK EVALUATION:
1. Gas Risk Assessment:
   - If gas cost > 50% of gross profit → HIGH risk
   - If gas cost 30-50% → MEDIUM risk
   - If gas cost < 30% → LOW risk

2. Slippage Risk Assessment:
   - If liquidity is "low" AND slippage > $1 → HIGH risk
   - If slippage > 25% of gross profit → MEDIUM risk
   - Otherwise → LOW risk

3. MEV Risk Assessment:
   - If trade size > 0.1 ETH AND liquidity is "low" → HIGH risk
   - If slippage > $2 AND net profit < $10 → MEDIUM risk
   - Otherwise → LOW risk

4. Profit Margin Assessment:
   - If net profit < $2 → "thin"
   - If net profit $2-$10 → "acceptable"
   - If net profit > $10 → "safe"

DECISION RULES:
- SKIP if net profit ≤ 0
- SKIP if gas risk is HIGH
- SKIP if profit margin is "thin" AND (slippage risk HIGH OR mev risk HIGH)
- SKIP if anomalous spread (> 5%)
- EXECUTE if net profit > 0 AND risks are manageable

Respond with ONLY this JSON structure (no markdown, no code blocks):
{
  "decision": "EXECUTE" or "SKIP",
  "reason": "one clear sentence explaining why",
  "confidence": 0.0 to 1.0,
  "riskAnalysis": {
    "gasRisk": "low" or "medium" or "high",
    "slippageRisk": "low" or "medium" or "high",
    "mevRisk": "low" or "medium" or "high",
    "profitMargin": "thin" or "acceptable" or "safe"
  }
}`;
}

/**
 * Get AI decision on whether to execute arbitrage
 * Execution-aware risk classification with detailed analysis
 */
export async function getAIDecision(data: SimulationData): Promise<AIDecision> {
  const apiKey = process.env.GEMINI_API_KEY!;
  
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not set, using fallback logic');
    return getFallbackDecision(data);
  }
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = buildDecisionPrompt(data);
    
    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
        { role: 'model', parts: [{ text: 'Understood. I will analyze arbitrage execution risk and respond with JSON decisions only.' }] },
        { role: 'user', parts: [{ text: prompt }] },
      ],
      generationConfig: {
        temperature: 0.1, // Low temperature for consistent, deterministic decisions
        maxOutputTokens: 300,
      },
    });
    
    const response = result.response.text();
    
    // Parse JSON response (strip markdown if present)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Failed to parse AI response:', response);
      return getFallbackDecision(data);
    }
    
    const parsed = JSON.parse(jsonMatch[0]) as AIDecision;
    
    // Validate response structure
    if (!['EXECUTE', 'SKIP'].includes(parsed.decision)) {
      return getFallbackDecision(data);
    }
    
    // Ensure risk analysis exists
    if (!parsed.riskAnalysis) {
      parsed.riskAnalysis = calculateRiskAnalysis(data);
    }
    
    return {
      decision: parsed.decision,
      reason: parsed.reason || 'No reason provided',
      confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
      riskAnalysis: parsed.riskAnalysis,
    };
    
  } catch (error) {
    console.error('Gemini API error:', error);
    return getFallbackDecision(data);
  }
}

// ============ Risk Analysis Helpers ============

/**
 * Calculate risk analysis from simulation data
 * Used when AI doesn't provide risk breakdown or as fallback
 */
function calculateRiskAnalysis(data: SimulationData): AIDecision['riskAnalysis'] {
  const totalCosts = data.gasCostUsd + data.slippageUsd + data.feesUsd;
  const grossProfit = data.netProfitUsd + totalCosts;
  const gasCostRatio = grossProfit > 0 ? data.gasCostUsd / grossProfit : 1;
  const slippageRatio = grossProfit > 0 ? data.slippageUsd / grossProfit : 1;
  
  // Gas Risk
  let gasRisk: 'low' | 'medium' | 'high' = 'low';
  if (gasCostRatio > 0.5) gasRisk = 'high';
  else if (gasCostRatio > 0.3) gasRisk = 'medium';
  
  // Slippage Risk
  let slippageRisk: 'low' | 'medium' | 'high' = 'low';
  if (data.liquidityDepth === 'low' && data.slippageUsd > 1) slippageRisk = 'high';
  else if (slippageRatio > 0.25) slippageRisk = 'medium';
  
  // MEV Risk
  let mevRisk: 'low' | 'medium' | 'high' = 'low';
  if (data.amountInEth > 0.1 && data.liquidityDepth === 'low') mevRisk = 'high';
  else if (data.slippageUsd > 2 && data.netProfitUsd < 10) mevRisk = 'medium';
  
  // Profit Margin
  let profitMargin: 'thin' | 'acceptable' | 'safe' = 'thin';
  if (data.netProfitUsd > 10) profitMargin = 'safe';
  else if (data.netProfitUsd >= 2) profitMargin = 'acceptable';
  
  return { gasRisk, slippageRisk, mevRisk, profitMargin };
}

// ============ Fallback Logic (Deterministic) ============

/**
 * Deterministic fallback when AI is unavailable
 * Rule-based logic with execution risk awareness
 */
function getFallbackDecision(data: SimulationData): AIDecision {
  const { netProfitUsd, gasCostUsd, slippageUsd, liquidityDepth, spread } = data;
  
  const riskAnalysis = calculateRiskAnalysis(data);
  
  // Calculate ratios
  const totalCosts = gasCostUsd + slippageUsd + data.feesUsd;
  const grossProfit = netProfitUsd + totalCosts;
  const gasCostRatio = grossProfit > 0 ? gasCostUsd / grossProfit : 1;
  
  // Rule 1: Must have positive net profit
  if (netProfitUsd <= 0) {
    return {
      decision: 'SKIP',
      reason: 'Net profit is negative or zero after all costs',
      confidence: 0.95,
      riskAnalysis,
    };
  }
  
  // Rule 2: Gas cost dominance check
  if (gasCostRatio > 0.5) {
    return {
      decision: 'SKIP',
      reason: `Gas cost is ${(gasCostRatio * 100).toFixed(0)}% of gross profit - too risky`,
      confidence: 0.90,
      riskAnalysis,
    };
  }
  
  // Rule 3: Thin margin with high risks
  if (riskAnalysis.profitMargin === 'thin') {
    if (riskAnalysis.slippageRisk === 'high' || riskAnalysis.mevRisk === 'high') {
      return {
        decision: 'SKIP',
        reason: 'Profit margin too thin relative to execution risks',
        confidence: 0.85,
        riskAnalysis,
      };
    }
  }
  
  // Rule 4: Minimum profit threshold ($2 USD)
  if (netProfitUsd < 2) {
    return {
      decision: 'SKIP',
      reason: `Net profit of $${netProfitUsd.toFixed(2)} below $2 safety threshold`,
      confidence: 0.80,
      riskAnalysis,
    };
  }
  
  // Rule 5: Anomalous spread (data quality check)
  if (spread > 5) {
    return {
      decision: 'SKIP',
      reason: 'Spread >5% appears anomalous - possible bad data or flash crash',
      confidence: 0.75,
      riskAnalysis,
    };
  }
  
  // Rule 6: Low liquidity with larger trade
  if (liquidityDepth === 'low' && data.amountInEth > 0.05) {
    return {
      decision: 'SKIP',
      reason: 'Trade size too large for low liquidity pool - high MEV risk',
      confidence: 0.80,
      riskAnalysis,
    };
  }
  
  // If all checks pass - EXECUTE
  const confidence = riskAnalysis.profitMargin === 'safe' ? 0.90 : 0.75;
  
  return {
    decision: 'EXECUTE',
    reason: `Net profit $${netProfitUsd.toFixed(2)} with ${riskAnalysis.profitMargin} margin and manageable risks`,
    confidence,
    riskAnalysis,
  };
}
