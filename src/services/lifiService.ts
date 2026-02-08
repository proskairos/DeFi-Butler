'use client';

import { createConfig, getRoutes, executeRoute, type Route, type RoutesRequest } from '@lifi/sdk';
import { type Address, parseUnits, formatUnits } from 'viem';
import { mainnet, arbitrum, base, optimism } from 'wagmi/chains';
import { LIFI_CONFIG } from '@/lib/config';

// Initialize LI.FI config once
let isConfigInitialized = false;

const initLiFi = () => {
  if (isConfigInitialized) return;
  createConfig({ integrator: LIFI_CONFIG.integrator });
  isConfigInitialized = true;
};

// Token addresses on mainnets
const TOKEN_ADDRESSES: Record<number, Record<string, Address>> = {
  [mainnet.id]: {
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  },
  [arbitrum.id]: {
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
    WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
  },
  [base.id]: {
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    USDT: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
    DAI: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    WETH: '0x4200000000000000000000000000000000000006',
  },
  [optimism.id]: {
    USDC: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    USDT: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
    WETH: '0x4200000000000000000000000000000000000006',
  },
};

export interface RouteQuote {
  routes: Route[];
  bestRoute: Route | null;
  fromAmount: string;
  toAmount: string;
  gasCostUSD: string;
  estimatedTime: number;
}

export interface ExecutionStatus {
  status: 'pending' | 'loading' | 'success' | 'error';
  txHash?: string;
  error?: string;
  message: string;
}

/**
 * LI.FI Service class
 */
class LiFiService {
  private initialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.initialized) return;
    
    createConfig({
      integrator: LIFI_CONFIG.integrator,
      apiUrl: LIFI_CONFIG.apiUrl,
    });
    
    this.initialized = true;
  }

  /**
   * Get LI.FI routes for cross-chain transfer
   */
  async getRoutes(
    fromChain: number,
    toChain: number,
    fromToken: string,
    toToken: string,
    amount: string,
    fromAddress: Address,
    slippage: number = 0.01
  ): Promise<RouteQuote | null> {
    this.init();

    try {
      const fromTokenAddress = TOKEN_ADDRESSES[fromChain]?.[fromToken.toUpperCase()];
      const toTokenAddress = TOKEN_ADDRESSES[toChain]?.[toToken.toUpperCase()];

      if (!fromTokenAddress || !toTokenAddress) {
        throw new Error(`Token not supported on one of the chains: ${fromToken} -> ${toToken}`);
      }

      const amountInWei = parseUnits(amount, 6);

      const params: RoutesRequest = {
        fromChainId: fromChain,
        toChainId: toChain,
        fromTokenAddress,
        toTokenAddress,
        fromAmount: amountInWei.toString(),
        fromAddress,
        toAddress: fromAddress,
        options: {
          slippage: slippage * 100,
          order: 'RECOMMENDED',
          allowSwitchChain: true,
        },
      };

      const response = await getRoutes(params);

      if (!response.routes || response.routes.length === 0) {
        return null;
      }

      const bestRoute = response.routes[0];

      return {
        routes: response.routes,
        bestRoute,
        fromAmount: amount,
        toAmount: formatUnits(BigInt(bestRoute.toAmount), 6),
        gasCostUSD: bestRoute.gasCostUSD || '0',
        estimatedTime: bestRoute.steps.reduce((acc, step) => acc + (step.estimate?.executionDuration || 0), 0),
      };
    } catch (error) {
      console.error('Error getting LI.FI routes:', error);
      throw error;
    }
  }

  /**
   * Get best route for an intent request
   */
  async getBestRoute(request: { fromChain: number; toChain: number; fromToken: string; toToken: string; fromAmount: string; userAddress: Address; slippage?: number }): Promise<Route | null> {
    this.init();

    try {
      const fromTokenAddress = TOKEN_ADDRESSES[request.fromChain]?.[request.fromToken.toUpperCase()];
      const toTokenAddress = TOKEN_ADDRESSES[request.toChain]?.[request.toToken.toUpperCase()];

      if (!fromTokenAddress || !toTokenAddress) {
        throw new Error(`Token not supported on one of the chains: ${request.fromToken} -> ${request.toToken}`);
      }

      const amountInWei = parseUnits(request.fromAmount, 6);

      const params: RoutesRequest = {
        fromChainId: request.fromChain,
        toChainId: request.toChain,
        fromTokenAddress,
        toTokenAddress,
        fromAmount: amountInWei.toString(),
        fromAddress: request.userAddress,
        toAddress: request.userAddress,
        options: {
          slippage: (request.slippage || 0.01) * 100,
          order: 'RECOMMENDED',
          allowSwitchChain: true,
        },
      };

      const response = await getRoutes(params);

      if (!response.routes || response.routes.length === 0) {
        return null;
      }

      return response.routes[0];
    } catch (error) {
      console.error('Error getting LI.FI best route:', error);
      throw error;
    }
  }

  /**
   * Compose an intent with vault deposit
   */
  async composeIntentWithDeposit(
    request: { fromChain: number; toChain: number; fromToken: string; toToken: string; fromAmount: string; userAddress: Address },
    targetYield: { protocol: string; vaultAddress: Address; apy: number; depositFunction?: string; depositParams?: unknown[] }
  ): Promise<{
    fromChain: number;
    toChain: number;
    fromToken: string;
    toToken: string;
    fromAmount: string;
    userAddress: Address;
    targetVault: { address: Address; protocol: string; depositFunction: string; depositParams: unknown[] };
    expectedApy: number;
    totalSteps: number;
    estimatedGasUsd: number;
  }> {
    this.init();

    // Compose the intent with vault deposit
    return {
      ...request,
      targetVault: {
        address: targetYield.vaultAddress,
        protocol: targetYield.protocol,
        depositFunction: targetYield.depositFunction || 'deposit',
        depositParams: targetYield.depositParams || [request.fromAmount, request.userAddress],
      },
      expectedApy: targetYield.apy,
      totalSteps: 2, // Bridge/Swap + Deposit
      estimatedGasUsd: 0, // Would need real gas estimation
    };
  }

  /**
   * Execute a composed intent (placeholder - would integrate with LI.FI Composer)
   */
  async executeComposedIntent<T extends { userAddress: Address }>(
    composedIntent: T,
    route: Route,
    _walletClient: unknown
  ) {
    this.init();

    const now = Date.now();

    // Execute the LI.FI route
    await this.executeRoute(route);

    // Return execution result
    return {
      id: Math.random().toString(36).substring(7),
      intent: composedIntent as T & { fromChain: number; toChain: number; fromToken: string; toToken: string; fromAmount: string },
      route,
      steps: [],
      status: 'completed' as const,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Execute a LI.FI route
   */
  async executeRoute(
    route: Route,
    onUpdate?: (status: ExecutionStatus) => void
  ): Promise<Route> {
    this.init();

    try {
      onUpdate?.({
        status: 'loading',
        message: 'Starting cross-chain transaction...',
      });

      // Execute route - simplified to avoid SDK type issues
      const executedRoute = await executeRoute(route);

      onUpdate?.({
        status: 'success',
        message: 'Transaction completed successfully!',
      });

      return executedRoute;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Execution failed';
      onUpdate?.({
        status: 'error',
        error: errorMessage,
        message: errorMessage,
      });
      throw error;
    }
  }

  /**
   * Format route for display
   */
  formatRouteDisplay(route: Route) {
    const steps = route.steps.map(step => ({
      type: step.type,
      fromChain: step.action.fromChainId.toString(),
      toChain: step.action.toChainId.toString(),
      fromToken: step.action.fromToken.symbol,
      toToken: step.action.toToken.symbol,
      tool: step.toolDetails.name,
    }));

    const totalSeconds = route.steps.reduce((acc, step) => 
      acc + (step.estimate?.executionDuration || 0), 0
    );
    
    const totalTime = totalSeconds > 60 
      ? `${Math.ceil(totalSeconds / 60)} min` 
      : `${totalSeconds} sec`;

    return {
      steps,
      totalTime,
      totalGas: `$${parseFloat(route.gasCostUSD || '0').toFixed(2)}`,
    };
  }
}

// Export singleton instance
export const lifiService = new LiFiService();

// Also export individual functions for direct use
export const getLiFiRoutes = (...args: Parameters<LiFiService['getRoutes']>) => 
  lifiService.getRoutes(...args);

export const executeLiFiRoute = (...args: Parameters<LiFiService['executeRoute']>) =>
  lifiService.executeRoute(...args);

export const formatRouteDisplay = (...args: Parameters<LiFiService['formatRouteDisplay']>) =>
  lifiService.formatRouteDisplay(...args);
