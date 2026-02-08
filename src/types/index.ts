// Local types to replace @defi-butler/types for standalone deployment

// ============ ENS Types ============

export interface UserPreferences {
  preferredChains: string[];
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  maxSlippageBps: number;
  defaultAction: 'deposit' | 'bridge' | 'swap';
  whitelistedProtocols: string[];
  blacklistedProtocols: string[];
  minLiquidityUsd: number;
  strategyFollow?: string;
  autoRebalance: boolean;
  notificationPrefs: {
    email?: string;
    discord?: string;
    telegram?: string;
  };
}

export interface ENSTextRecords {
  'com.yieldintent.preferredChains': string;
  'com.yieldintent.riskTolerance': string;
  'com.yieldintent.maxSlippageBps': string;
  'com.yieldintent.defaultAction': string;
  'com.yieldintent.whitelistedProtocols': string;
  'com.yieldintent.blacklistedProtocols': string;
  'com.yieldintent.minLiquidityUsd': string;
  'com.yieldintent.strategyFollow': string;
  'com.yieldintent.autoRebalance': string;
  'com.yieldintent.notificationPrefs': string;
}

export interface ENSProfile {
  name: string;
  address: `0x${string}`;
  avatar?: string;
  preferences: UserPreferences;
  isFollowingStrategy: boolean;
  followedStrategyOwner?: string;
}

export const ENS_RECORD_KEYS: Record<keyof ENSTextRecords, string> = {
  'com.yieldintent.preferredChains': 'com.yieldintent.preferredChains',
  'com.yieldintent.riskTolerance': 'com.yieldintent.riskTolerance',
  'com.yieldintent.maxSlippageBps': 'com.yieldintent.maxSlippageBps',
  'com.yieldintent.defaultAction': 'com.yieldintent.defaultAction',
  'com.yieldintent.whitelistedProtocols': 'com.yieldintent.whitelistedProtocols',
  'com.yieldintent.blacklistedProtocols': 'com.yieldintent.blacklistedProtocols',
  'com.yieldintent.minLiquidityUsd': 'com.yieldintent.minLiquidityUsd',
  'com.yieldintent.strategyFollow': 'com.yieldintent.strategyFollow',
  'com.yieldintent.autoRebalance': 'com.yieldintent.autoRebalance',
  'com.yieldintent.notificationPrefs': 'com.yieldintent.notificationPrefs',
} as const;

export const RISK_TOLERANCE_MAP: Record<UserPreferences['riskTolerance'], string[]> = {
  conservative: ['aave-v3', 'compound-v3', 'morpho', 'spark'],
  moderate: ['aave-v3', 'compound-v3', 'morpho', 'spark', 'yearn-v3'],
  aggressive: ['aave-v3', 'compound-v3', 'morpho', 'spark', 'yearn-v3', 'pendle', 'silo'],
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  preferredChains: ['base', 'arbitrum', 'optimism'],
  riskTolerance: 'moderate',
  maxSlippageBps: 100,
  defaultAction: 'deposit',
  whitelistedProtocols: [],
  blacklistedProtocols: [],
  minLiquidityUsd: 100000,
  autoRebalance: false,
  notificationPrefs: {},
};

// ============ Yield Types ============

export interface YieldOpportunity {
  id: string;
  protocol: string;
  protocolSlug: string;
  chainId: number;
  chainName: string;
  token: string;
  tokenAddress: `0x${string}`;
  vaultAddress: `0x${string}`;
  apy: number;
  tvlUsd: number;
  riskLevel: 'low' | 'medium' | 'high';
  depositFunction: string;
  depositParams: Array<{
    name: string;
    type: string;
    value?: unknown;
  }>;
  withdrawalFunction: string;
  withdrawalParams: Array<{
    name: string;
    type: string;
    value?: unknown;
  }>;
  metadata: {
    protocolName: string;
    protocolIcon: string;
    tokenIcon: string;
    vaultName: string;
    vaultVersion?: string;
    isAudited: boolean;
    auditInfo?: string[];
  };
}

export interface YieldQueryParams {
  chainId?: number;
  token?: string;
  minApy?: number;
  maxApy?: number;
  minTvlUsd?: number;
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
  whitelistedProtocols?: string[];
  blacklistedProtocols?: string[];
  limit?: number;
}

export interface YieldSourceConfig {
  name: string;
  enabled: boolean;
  weight: number;
  chains: number[];
  baseUrl?: string;
  apiKey?: string;
}

export const SUPPORTED_YIELD_SOURCES: YieldSourceConfig[] = [
  {
    name: 'defillama',
    enabled: true,
    weight: 0.6,
    chains: [1, 10, 137, 42161, 8453, 81457],
    baseUrl: 'https://yields.llama.fi',
  },
  {
    name: 'yearn',
    enabled: true,
    weight: 0.4,
    chains: [1, 10, 137, 42161, 8453],
    baseUrl: 'https://api.yearn.fi/v1/chains',
  },
];

export const CHAIN_ID_TO_NAME: Record<number, string> = {
  1: 'ethereum',
  10: 'optimism',
  137: 'polygon',
  42161: 'arbitrum',
  8453: 'base',
  81457: 'blast',
  59144: 'linea',
  534352: 'scroll',
};

export const CHAIN_NAME_TO_ID: Record<string, number> = Object.entries(CHAIN_ID_TO_NAME).reduce(
  (acc, [id, name]) => ({ ...acc, [name]: parseInt(id) }),
  {}
);

// ============ LiFi Types ============

import type { Route, LiFiStep, StatusResponse } from '@lifi/sdk';

export interface IntentRequest {
  fromChain: number;
  fromToken: string;
  fromAmount: string;
  toChain: number;
  toToken: string;
  userAddress: `0x${string}`;
  ensName?: string;
  slippage?: number;
  preferredProtocols?: string[];
}

export interface ComposedIntent extends IntentRequest {
  targetVault: {
    address: `0x${string}`;
    protocol: string;
    depositFunction: string;
    depositParams: unknown[];
  };
  expectedApy: number;
  totalSteps: number;
  estimatedGasUsd: number;
}

export interface ExecutionStep {
  type: 'bridge' | 'swap' | 'approve' | 'deposit' | 'withdraw';
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  chainId: number;
  txHash?: `0x${string}`;
  explorerUrl?: string;
  message: string;
  timestamp: number;
}

export interface IntentExecution {
  id: string;
  intent: ComposedIntent;
  route: Route;
  steps: ExecutionStep[];
  status: 'pending' | 'executing' | 'completed' | 'failed';
  error?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ComposerAction {
  id: string;
  type: 'swap' | 'bridge' | 'custom';
  fromToken?: string;
  fromAmount?: string;
  toToken?: string;
  toAmount?: string;
  toChain?: number;
  fromChain?: number;
  contractAddress?: `0x${string}`;
  callData?: string;
  value?: string;
}

export interface ComposerRouteRequest {
  fromChainId: number;
  fromAmount: string;
  fromTokenAddress: string;
  toChainId: number;
  toTokenAddress: string;
  toAmount?: string;
  slippage: number;
  userAddress: `0x${string}`;
  actions: ComposerAction[];
}

export interface GasRecommendation {
  type: 'legacy' | 'eip1559';
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  estimatedGas: string;
  estimatedCostUsd: number;
}

export type { Route, LiFiStep, StatusResponse };
