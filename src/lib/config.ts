import { 
  mainnet, sepolia, 
  arbitrum, arbitrumSepolia, 
  base, baseSepolia, 
  optimism, optimismSepolia,
  polygon, scroll, linea, blast 
} from 'wagmi/chains';
import { createPublicClient, createWalletClient, custom, http as viemHttp } from 'viem';

// ============================================
// CHAIN CONFIGURATION
// ============================================

// Chains for LI.FI operations (mainnets - real bridging)
export const LIFI_CHAINS = [
  mainnet,
  arbitrum,
  base,
  optimism,
  polygon,
  scroll,
  linea,
  blast,
] as const;

// Chains for wallet connection
export const SUPPORTED_CHAINS = [
  mainnet,
  sepolia,
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  optimism,
  optimismSepolia,
  polygon,
  scroll,
  linea,
  blast,
] as const;

export type SupportedChain = (typeof SUPPORTED_CHAINS)[number];

// Chain configuration with public RPCs
export const CHAIN_RPCS: Record<number, string> = {
  // Mainnets
  [mainnet.id]: 'https://eth.llamarpc.com',
  [arbitrum.id]: 'https://arb1.arbitrum.io/rpc',
  [base.id]: 'https://mainnet.base.org',
  [optimism.id]: 'https://mainnet.optimism.io',
  [polygon.id]: 'https://polygon-rpc.com',
  [scroll.id]: 'https://rpc.scroll.io',
  [linea.id]: 'https://rpc.linea.build',
  [blast.id]: 'https://rpc.blast.io',
  // Testnets
  [sepolia.id]: 'https://rpc.sepolia.org',
  [arbitrumSepolia.id]: 'https://sepolia-rollup.arbitrum.io/rpc',
  [baseSepolia.id]: 'https://sepolia.base.org',
  [optimismSepolia.id]: 'https://sepolia.optimism.io',
};

// Create Viem public clients for each chain
export const publicClients = SUPPORTED_CHAINS.reduce(
  (acc, chain) => {
    acc[chain.id] = createPublicClient({
      chain,
      transport: viemHttp(CHAIN_RPCS[chain.id]),
    }) as ReturnType<typeof createPublicClient>;
    return acc;
  },
  {} as Record<number, ReturnType<typeof createPublicClient>>
);

// Get wallet client for a chain
export function getWalletClient(chainId: number, provider: unknown) {
  const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId);
  if (!chain) throw new Error(`Chain ${chainId} not supported`);

  return createWalletClient({
    chain,
    transport: custom(provider as { request: (...args: unknown[]) => Promise<unknown> }),
  });
}

// ============================================
// SEPOLIA ENS CONFIGURATION (FOR TESTING)
// ============================================

// Sepolia ENS addresses
export const SEPOLIA_ENS_CONFIG = {
  // ENS Registry on Sepolia
  registryAddress: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e' as `0x${string}`,
  // Public Resolver on Sepolia
  publicResolverAddress: '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD' as `0x${string}`,
  // Universal Resolver on Sepolia
  universalResolverAddress: '0xE4Acdd618DEED2e9d8f77fc26717f38c82b319aE' as `0x${string}`,
  // ETH Registrar Controller on Sepolia
  ethRegistrarController: '0xFED6a969AaA60E4961FCD3EBF1A2e8913ac65B72' as `0x${string}`,
  // Name Wrapper on Sepolia
  nameWrapperAddress: '0x0635513f179D50A207757E05759bD106b7B26A15' as `0x${string}`,
};

// Sepolia client for ENS operations
export const sepoliaClient = createPublicClient({
  chain: sepolia,
  transport: viemHttp('https://ethereum-sepolia-rpc.publicnode.com'),
});

// ============================================
// ABIS
// ============================================

// ENS ETH Registrar Controller ABI (for registering names)
export const ETH_REGISTRAR_ABI = [
  {
    name: 'register',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'owner', type: 'address' },
      { name: 'duration', type: 'uint256' },
      { name: 'secret', type: 'bytes32' },
      { name: 'resolver', type: 'address' },
      { name: 'data', type: 'bytes[]' },
      { name: 'reverseRecord', type: 'bool' },
      { name: 'ownerControlledFuses', type: 'uint16' },
    ],
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    name: 'rentPrice',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'duration', type: 'uint256' },
    ],
    outputs: [
      { name: 'base', type: 'uint256' },
      { name: 'premium', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    name: 'available',
    inputs: [{ name: 'name', type: 'string' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// ENS Registry ABI
export const ENS_REGISTRY_ABI = [
  {
    name: 'resolver',
    inputs: [{ name: 'node', type: 'bytes32' }],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    name: 'owner',
    inputs: [{ name: 'node', type: 'bytes32' }],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    name: 'setResolver',
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'resolver', type: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// ENS Public Resolver ABI (for text records)
export const ENS_RESOLVER_ABI = [
  {
    name: 'text',
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'key', type: 'string' },
    ],
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    name: 'setText',
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'key', type: 'string' },
      { name: 'value', type: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    name: 'multicall',
    inputs: [{ name: 'data', type: 'bytes[]' }],
    outputs: [{ name: 'results', type: 'bytes[]' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// LI.FI Configuration
export const LIFI_CONFIG = {
  apiUrl: process.env.NEXT_PUBLIC_LIFI_API_URL || 'https://li.quest/v1',
  apiKey: process.env.NEXT_PUBLIC_LIFI_API_KEY,
  integrator: 'defi-butler',
  defaultSlippage: 0.01,
  maxSlippage: 0.05,
  maxPriceImpact: 0.1,
};

// Vault ABI
export const VAULT_ABI = [
  {
    inputs: [
      { name: 'assets', type: 'uint256' },
      { name: 'receiver', type: 'address' },
    ],
    name: 'deposit',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'assets', type: 'uint256' },
      { name: 'receiver', type: 'address' },
      { name: 'owner', type: 'address' },
    ],
    name: 'withdraw',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'shares', type: 'uint256' }],
    name: 'convertToAssets',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'asset',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// ERC20 ABI
export const ERC20_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Error messages
export const ERROR_MESSAGES = {
  ENS_NOT_FOUND: 'ENS name not found on Sepolia',
  NO_PREFERENCES: 'No preferences found for this ENS name',
  CHAIN_NOT_SUPPORTED: 'This chain is not supported',
  INSUFFICIENT_BALANCE: 'Insufficient balance for this operation',
  SLIPPAGE_TOO_HIGH: 'Slippage exceeds your preferences',
  NO_YIELD_OPPORTUNITIES: 'No yield opportunities found matching your criteria',
  ROUTE_NOT_FOUND: 'No route found for this intent',
  EXECUTION_FAILED: 'Transaction execution failed',
  USER_REJECTED: 'User rejected the transaction',
  NOT_ENS_OWNER: 'You do not own this ENS name',
  ENS_NOT_AVAILABLE: 'ENS name is not available for registration',
  WRONG_CHAIN: 'Please switch to Sepolia to manage ENS',
} as const;
