'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { 
  mainnet, sepolia,
  arbitrum, arbitrumSepolia,
  base, baseSepolia,
  optimism, optimismSepolia,
  polygon, scroll, linea, blast
} from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { useState, useEffect } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const config = createConfig({
  chains: [
    mainnet, sepolia,
    arbitrum, arbitrumSepolia,
    base, baseSepolia,
    optimism, optimismSepolia,
    polygon, scroll, linea, blast
  ],
  connectors: [injected({ target: 'metaMask' })],
  transports: {
    [mainnet.id]: http('https://eth.llamarpc.com'),
    [sepolia.id]: http('https://ethereum-sepolia-rpc.publicnode.com'),
    [arbitrum.id]: http('https://arb1.arbitrum.io/rpc'),
    [arbitrumSepolia.id]: http('https://sepolia-rollup.arbitrum.io/rpc'),
    [base.id]: http('https://mainnet.base.org'),
    [baseSepolia.id]: http('https://sepolia.base.org'),
    [optimism.id]: http('https://mainnet.optimism.io'),
    [optimismSepolia.id]: http('https://sepolia.optimism.io'),
    [polygon.id]: http('https://polygon-rpc.com'),
    [scroll.id]: http('https://rpc.scroll.io'),
    [linea.id]: http('https://rpc.linea.build'),
    [blast.id]: http('https://rpc.blast.io'),
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {mounted ? children : null}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
