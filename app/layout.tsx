import type { Metadata } from 'next';
import { Web3Provider } from './providers';
import Navbar from '@/components/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: ' Arbiata - Execution-Aware DeFi Arbitrage',
  description: 'Execution-aware arbitrage with provable on-chain profit enforcement - Base Sepolia Testnet',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-pure-black text-white antialiased">
        <Web3Provider>
          <Navbar />
          <main className="pt-16">
            {children}
          </main>
        </Web3Provider>
      </body>
    </html>
  );
}
