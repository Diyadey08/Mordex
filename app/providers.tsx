'use client';

import { getDefaultConfig, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@rainbow-me/rainbowkit/styles.css';
import { useState } from 'react';

// ============ Wagmi Config ============

const config = getDefaultConfig({
  appName: 'Arbfarm',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'arbfarm-demo',
  chains: [baseSepolia],
  ssr: false, // Disable SSR to avoid indexedDB issues
});

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
