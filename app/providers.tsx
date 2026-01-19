'use client';

import { getDefaultConfig, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@rainbow-me/rainbowkit/styles.css';
import { useState } from 'react';

// ============ Wagmi Config ============

// Get WalletConnect project ID with proper validation
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

// Only create config if we have a valid project ID
const config = walletConnectProjectId ? getDefaultConfig({
  appName: 'Arbfarm',
  projectId: walletConnectProjectId,
  chains: [baseSepolia],
  ssr: false, // Disable SSR to avoid indexedDB issues
}) : null;

// ============ React Query ============

// Create QueryClient inside component to avoid SSR issues
const makeQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
    },
  },
});

// ============ Provider Component ============

export function Web3Provider({ children }: { children: React.ReactNode }) {
  // Create a new QueryClient for each request to avoid sharing state
  const [queryClient] = useState(() => makeQueryClient());
  
  // If no valid WalletConnect project ID, show setup message
  if (!config) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-red-400">WalletConnect Setup Required</h2>
          <p className="text-zinc-400 mb-4">
            Please set up your WalletConnect project ID to enable wallet connections.
          </p>
          <div className="text-left bg-zinc-900 p-4 rounded-lg text-sm">
            <p className="text-green-400 mb-2">Steps:</p>
            <ol className="list-decimal list-inside text-zinc-300 space-y-1">
              <li>Visit <span className="text-blue-400">https://cloud.walletconnect.com</span></li>
              <li>Create a free account and project</li>
              <li>Copy your Project ID</li>
              <li>Set <span className="text-yellow-400">NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID</span> in .env.local</li>
              <li>Restart the development server</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#10b981',
            accentColorForeground: 'white',
            borderRadius: 'medium',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
