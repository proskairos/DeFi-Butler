import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DeFi Butler - Cross-Chain Yield Intent Manager',
  description: 'Your ENS-powered cross-chain DeFi intent engine. Deposit from any chain into the best yield vaults with one click.',
  keywords: ['DeFi', 'ENS', 'LI.FI', 'cross-chain', 'yield', 'intent'],
  authors: [{ name: 'DeFi Butler Team' }],
  openGraph: {
    title: 'DeFi Butler',
    description: 'Cross-chain yield optimization powered by ENS',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
