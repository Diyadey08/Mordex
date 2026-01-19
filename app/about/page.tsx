'use client';

import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-pure-black p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="py-6">
          <Link href="/" className="text-text-secondary hover:text-white text-sm">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mt-2">About Arbfarm</h1>
          <p className="text-text-secondary mt-1">Technical overview for judges</p>
          <div className="divider mt-6" />
        </header>

        {/* What is Arbfarm */}
        <section className="glass-card p-6">
          <h2 className="text-lg font-bold mb-4">What is Arbfarm?</h2>
          
          <div className="space-y-4 text-text-secondary">
            <p>
              Arbfarm is an <strong className="text-white">AI-gated arbitrage executor</strong> for 
              Uniswap V3. It detects price discrepancies, simulates execution costs, and uses 
              AI to decide whether a trade should execute.
            </p>
            
            <p>
              The key innovation is <strong className="text-white">execution awareness</strong>: 
              we don't just find arbitrage opportunities—we model the actual costs (gas, slippage, 
              fees) and only execute trades that are profitable <em>after</em> those costs.
            </p>

            <div className="p-4 bg-charcoal rounded border border-steel-gray mt-4">
              <div className="text-xs uppercase text-text-tertiary mb-2">The Flow</div>
              <div className="mono text-sm space-y-1">
                <div>1. Fetch prices from Uniswap pools</div>
                <div>2. Calculate spread and opportunity</div>
                <div>3. Simulate gas + slippage + fees</div>
                <div>4. AI decides: EXECUTE or SKIP</div>
                <div>5. User signs transaction (if EXECUTE)</div>
                <div>6. Contract enforces profit on-chain</div>
              </div>
            </div>
          </div>
        </section>

        {/* How AI is Used */}
        <section className="glass-card p-6">
          <h2 className="text-lg font-bold mb-4">How AI is Used</h2>
          
          <div className="space-y-4 text-text-secondary">
            <p>
              We use <strong className="text-white">Google Gemini</strong> as a 
              decision classifier—not a price predictor.
            </p>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-4 bg-charcoal rounded border border-steel-gray">
                <div className="text-xs uppercase text-profit mb-2">AI Does</div>
                <ul className="text-sm space-y-1">
                  <li>✓ Analyze cost breakdown</li>
                  <li>✓ Assess risk factors</li>
                  <li>✓ Output EXECUTE or SKIP</li>
                  <li>✓ Provide reasoning</li>
                </ul>
              </div>
              <div className="p-4 bg-charcoal rounded border border-steel-gray">
                <div className="text-xs uppercase text-loss mb-2">AI Does NOT</div>
                <ul className="text-sm space-y-1">
                  <li>✗ Predict prices</li>
                  <li>✗ Generate signals</li>
                  <li>✗ Touch blockchain</li>
                  <li>✗ Hold private keys</li>
                </ul>
              </div>
            </div>

            <div className="p-4 bg-charcoal rounded border border-steel-gray mt-4">
              <div className="text-xs uppercase text-text-tertiary mb-2">Sample AI Input</div>
              <pre className="text-xs mono overflow-x-auto">{`{
  "spread": 0.15,
  "gasCostUsd": 0.85,
  "slippageUsd": 0.21,
  "feesUsd": 0.42,
  "netProfitUsd": 2.12,
  "liquidityDepth": "high"
}`}</pre>
            </div>

            <div className="p-4 bg-charcoal rounded border border-steel-gray">
              <div className="text-xs uppercase text-text-tertiary mb-2">Sample AI Output</div>
              <pre className="text-xs mono overflow-x-auto">{`{
  "decision": "EXECUTE",
  "reason": "Positive net profit with acceptable gas costs and high liquidity"
}`}</pre>
            </div>
          </div>
        </section>

        {/* On-Chain Profit Enforcement */}
        <section className="glass-card p-6">
          <h2 className="text-lg font-bold mb-4">On-Chain Profit Enforcement</h2>
          
          <div className="space-y-4 text-text-secondary">
            <p>
              The smart contract is <strong className="text-white">dumb and deterministic</strong>. 
              All intelligence stays off-chain. The contract only does one thing: 
              <strong className="text-white"> enforce profit</strong>.
            </p>

            <div className="p-4 bg-charcoal rounded border border-steel-gray">
              <div className="text-xs uppercase text-text-tertiary mb-2">Core Logic</div>
              <pre className="text-xs mono overflow-x-auto text-metallic-silver">{`function executeArb(uint256 amountIn, uint256 minProfit) {
    uint256 ethBefore = userBalances[msg.sender];
    
    // Execute swaps: ETH → USDC → ETH
    
    uint256 ethAfter = /* balance after swaps */;
    uint256 profit = ethAfter - ethBefore;
    
    require(profit >= minProfit, "Trade not profitable");
    
    userBalances[msg.sender] += profit;
}`}</pre>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-3 bg-charcoal rounded text-center">
                <div className="text-2xl mb-1">✓</div>
                <div className="text-sm">Reverts if not profitable</div>
              </div>
              <div className="p-3 bg-charcoal rounded text-center">
                <div className="text-2xl mb-1">✓</div>
                <div className="text-sm">User never loses funds</div>
              </div>
              <div className="p-3 bg-charcoal rounded text-center">
                <div className="text-2xl mb-1">✓</div>
                <div className="text-sm">Profit goes to user</div>
              </div>
              <div className="p-3 bg-charcoal rounded text-center">
                <div className="text-2xl mb-1">✓</div>
                <div className="text-sm">On-chain verifiable</div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Testnet */}
        <section className="glass-card p-6">
          <h2 className="text-lg font-bold mb-4">Why Testnet Only?</h2>
          
          <div className="space-y-4 text-text-secondary">
            <p>
              This is a <strong className="text-white">hackathon demo</strong>. We run on 
              Base Sepolia testnet for several reasons:
            </p>

            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-profit">1.</span>
                <span><strong className="text-white">Safety</strong> — No risk of losing real funds</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-profit">2.</span>
                <span><strong className="text-white">Free testing</strong> — Faucet ETH for unlimited demos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-profit">3.</span>
                <span><strong className="text-white">Judge-friendly</strong> — Judges can try it without risk</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-profit">4.</span>
                <span><strong className="text-white">Honest</strong> — We show what works, not fake profits</span>
              </li>
            </ul>

            <div className="p-4 bg-charcoal rounded border border-steel-gray mt-4">
              <div className="text-xs uppercase text-text-tertiary mb-2">Network Details</div>
              <div className="space-y-1 text-sm mono">
                <div>Chain: Base Sepolia</div>
                <div>Chain ID: 84532</div>
                <div>Explorer: sepolia.basescan.org</div>
              </div>
            </div>
          </div>
        </section>

        {/* Tech Stack */}
        <section className="glass-card p-6">
          <h2 className="text-lg font-bold mb-4">Tech Stack</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-charcoal rounded">
              <div className="text-xs uppercase text-text-tertiary mb-1">Frontend</div>
              <div className="text-sm">Next.js 14 + TypeScript</div>
            </div>
            <div className="p-3 bg-charcoal rounded">
              <div className="text-xs uppercase text-text-tertiary mb-1">Wallet</div>
              <div className="text-sm">wagmi + RainbowKit</div>
            </div>
            <div className="p-3 bg-charcoal rounded">
              <div className="text-xs uppercase text-text-tertiary mb-1">Smart Contracts</div>
              <div className="text-sm">Solidity + Hardhat</div>
            </div>
            <div className="p-3 bg-charcoal rounded">
              <div className="text-xs uppercase text-text-tertiary mb-1">AI</div>
              <div className="text-sm">Google Gemini</div>
            </div>
            <div className="p-3 bg-charcoal rounded">
              <div className="text-xs uppercase text-text-tertiary mb-1">DEX</div>
              <div className="text-sm">Uniswap V3</div>
            </div>
            <div className="p-3 bg-charcoal rounded">
              <div className="text-xs uppercase text-text-tertiary mb-1">Network</div>
              <div className="text-sm">Base Sepolia</div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-8 text-text-secondary text-sm">
          <p>We don't chase arbitrage. We execute only what survives reality.</p>
        </footer>

      </div>
    </div>
  );
}
