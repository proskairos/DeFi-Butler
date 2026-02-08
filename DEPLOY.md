# DeFi Butler - Deployment Guide

## Prerequisites

- Node.js 18+ 
- npm or yarn
- A WalletConnect Project ID (get one at https://cloud.walletconnect.com)

## Environment Setup

1. Copy the environment template:
```bash
cp .env.production .env.local
```

2. Edit `.env.local` and add your WalletConnect Project ID:
```bash
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id_here
```

## Build

```bash
npm install
npm run build
```

## Start Production Server

```bash
npm run start
```

The app will be available at `http://localhost:3000`

## Docker Deployment (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
```

## Vercel Deployment

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## Features

- **ENS Integration**: Read/write preferences on Sepolia testnet
- **LI.FI Integration**: Cross-chain bridging/swapping on mainnets
- **Supported Chains**: Ethereum, Arbitrum, Base, Optimism
- **Wallet**: MetaMask via injected connector

## Bundle Size

- First Load JS: ~214 kB
- Main Page: ~86 kB
