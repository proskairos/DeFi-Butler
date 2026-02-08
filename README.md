# DeFi Butler - Cross-Chain Yield Intent Manager

A hackathon project that combines **ENS** and **LI.FI** to create a powerful cross-chain DeFi intent engine. Users can deposit assets from any chain into the highest-yielding vaults on their target chain with a single transaction.

## Overview

**DeFi Butler** solves the fragmentation problem in DeFi by providing:

1. **ENS-Powered Profiles**: Store your risk tolerance, preferred chains, and protocol whitelists in your ENS text records
2. **Dynamic Yield Discovery**: Query multiple sources (DefiLlama, Yearn) to find the best yields
3. **LI.FI Composer Integration**: Bridge, swap, and deposit in a single atomic transaction
4. **Social Strategy Following**: Follow other users' strategies by referencing their ENS name

## Architecture

```
defi-butler/                   # Next.js frontend
│       ├── src/
│       │   ├── app/           # Next.js app router
│       │   ├── components/    # React components
│       │   │   ├── ui/       # Base UI components
│       │   │   ├── ens/      # ENS-related components
│       │   │   ├── lifi/     # LI.FI intent components
│       │   │   └── yield/    # Yield display components
│       │   ├── hooks/        # React hooks (wagmi, ENS, yield, intent)
│       │   ├── services/     # Business logic services
│       │   │   ├── ensService.ts
│       │   │   ├── lifiService.ts
│       │   │   └── yieldService.ts
│       │   ├── lib/          # Utilities and config
│       │   └── types/        # TypeScript types
```

## Key Features

### 1. ENS Text Records for Preferences

Store your DeFi preferences in your ENS name:

```
com.yieldintent.preferredChains: ["base", "arbitrum", "optimism"]
com.yieldintent.riskTolerance: "moderate"
com.yieldintent.maxSlippageBps: "100"
com.yieldintent.whitelistedProtocols: ["aave-v3", "compound-v3"]
com.yieldintent.strategyFollow: "vitalik.eth"  # Follow another user's strategy
```

### 2. Multi-Source Yield Discovery

Aggregates yield data from:
- **DefiLlama**: Comprehensive yield data across protocols
- **Yearn Finance**: Vault yields

### 3. LI.FI Composer Execution

Uses LI.FI Composer to execute complex cross-chain intents:
1. Bridge/swap from source chain to destination chain
2. Approve tokens for vault deposit
3. Deposit into the target yield vault

All in a single user-signed transaction.

### 4. Social Strategy Following

Users can set `com.yieldintent.strategyFollow` to mirror another user's preferences:

```typescript
// alice.eth sets:
com.yieldintent.strategyFollow: "bob.eth"

// Now alice.eth uses bob.eth's preferences automatically
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- WalletConnect Project ID

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example apps/web/.env.local

# Edit .env.local with your API keys
```

### Development

```bash
# Run the development server
npm run dev

# Or from the web app directory
cd apps/web && npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
# Build all packages
npm run build

# Build only the web app
cd apps/web && npm run build
```

## Usage Flow

1. **Connect Wallet**: Connect your MetaMask or other wallet
2. **Load ENS Profile**: Enter your ENS name (e.g., `alice.eth`)
3. **Set Intent**: 
   - Select source chain and token
   - Enter amount
   - Select destination chain
4. **Review**: See the best yield opportunity found
5. **Execute**: Sign one transaction to bridge and deposit

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Web3**: Wagmi, Viem, RainbowKit
- **Cross-Chain**: LI.FI SDK
- **ENS**: Viem ENS utilities
- **State**: Zustand
- **Data**: DefiLlama API, Yearn API 

## Prize Requirements

### LI.FI Prize Requirements

- [x] Uses LI.FI SDK for cross-chain actions
- [x] Supports >2 EVM chains (8 chains supported)
- [x] Working frontend with intent builder
- [x] Uses LI.FI Composer for complex transactions

### ENS Prize Requirements

- [x] Specific code for reading ENS text records
- [x] Stores and retrieves complex user preferences
- [x] Central to product functionality
- [x] Social following feature using ENS

## Future Enhancements

- [ ] Write preferences back to ENS (requires resolver integration)
- [ ] Gas abstraction using paymasters
- [ ] Rebalancing alerts and auto-rebalancing
- [ ] More yield sources (Aave, Compound direct integration)
- [ ] Position tracking across vaults
- [ ] Mobile app

## License

MIT License - see LICENSE file for details

## Acknowledgments

- **ENS**: For the decentralized identity and text records system
- **LI.FI**: For the powerful cross-chain execution infrastructure
- **DefiLlama**: For comprehensive yield data
- **Yearn**: For vault yield APIs
