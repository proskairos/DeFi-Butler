import type {
  YieldOpportunity,
  YieldQueryParams,
  YieldSourceConfig,
} from '@defi-butler/types';
import { SUPPORTED_YIELD_SOURCES, CHAIN_ID_TO_NAME } from '@defi-butler/types';
import { withRetry } from '@/lib/utils';

// Protocol metadata for display
const PROTOCOL_METADATA: Record<
  string,
  { name: string; icon: string; riskLevel: 'low' | 'medium' | 'high' }
> = {
  'aave-v3': {
    name: 'Aave V3',
    icon: 'https://icons.llamao.fi/protocols/aave-v3',
    riskLevel: 'low',
  },
  'compound-v3': {
    name: 'Compound V3',
    icon: 'https://icons.llamao.fi/protocols/compound-v3',
    riskLevel: 'low',
  },
  'morpho': {
    name: 'Morpho',
    icon: 'https://icons.llamao.fi/protocols/morpho',
    riskLevel: 'low',
  },
  'spark': {
    name: 'Spark',
    icon: 'https://icons.llamao.fi/protocols/spark',
    riskLevel: 'low',
  },
  'beefy': {
    name: 'Beefy',
    icon: 'https://icons.llamao.fi/protocols/beefy',
    riskLevel: 'medium',
  },
  'yearn-v3': {
    name: 'Yearn V3',
    icon: 'https://icons.llamao.fi/protocols/yearn-v3',
    riskLevel: 'medium',
  },
  'pendle': {
    name: 'Pendle',
    icon: 'https://icons.llamao.fi/protocols/pendle',
    riskLevel: 'high',
  },
  'silo': {
    name: 'Silo',
    icon: 'https://icons.llamao.fi/protocols/silo',
    riskLevel: 'high',
  },
};

// Token icons
const TOKEN_ICONS: Record<string, string> = {
  USDC: 'https://tokens.1inch.io/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
  USDT: 'https://tokens.1inch.io/0xdac17f958d2ee523a2206206994597c13d831ec7.png',
  DAI: 'https://tokens.1inch.io/0x6b175474e89094c44da98b954eedeac495271d0f.png',
  WETH: 'https://tokens.1inch.io/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.png',
  WBTC: 'https://tokens.1inch.io/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.png',
};

/**
 * Service for discovering and querying yield opportunities
 * Aggregates data from multiple sources: DefiLlama, Yearn, Beefy
 */
export class YieldService {
  private sources: YieldSourceConfig[];
  private cache: Map<string, { data: YieldOpportunity[]; timestamp: number }>;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.sources = SUPPORTED_YIELD_SOURCES.filter((s) => s.enabled);
    this.cache = new Map();
  }

  /**
   * Fetch yields from DefiLlama API
   */
  private async fetchDefiLlamaYields(): Promise<YieldOpportunity[]> {
    const source = this.sources.find((s) => s.name === 'defillama');
    if (!source) return [];

    return withRetry(async () => {
      const response = await fetch(`${source.baseUrl}/pools`);
      if (!response.ok) {
        throw new Error(`DefiLlama API error: ${response.status}`);
      }

      const data = await response.json();
      const opportunities: YieldOpportunity[] = [];

      for (const pool of data.data || []) {
        // Filter for supported protocols only
        const protocolSlug = pool.project?.toLowerCase() || '';
        if (!PROTOCOL_METADATA[protocolSlug]) continue;

        // Map chain name to ID
        const chainId = Object.entries(CHAIN_ID_TO_NAME).find(
          ([, name]) => name === pool.chain?.toLowerCase()
        )?.[0];

        if (!chainId || !source.chains.includes(parseInt(chainId))) continue;

        const metadata = PROTOCOL_METADATA[protocolSlug];

        opportunities.push({
          id: `${pool.chain}-${pool.project}-${pool.symbol}-${pool.pool}`,
          protocol: metadata.name,
          protocolSlug,
          chainId: parseInt(chainId),
          chainName: pool.chain,
          token: pool.symbol,
          tokenAddress: pool.underlyingTokens?.[0] || '0x0000000000000000000000000000000000000000',
          vaultAddress: pool.pool,
          apy: pool.apy / 100, // Convert from percentage to decimal
          tvlUsd: pool.tvlUsd || 0,
          riskLevel: metadata.riskLevel,
          depositFunction: 'deposit',
          depositParams: [
            { name: 'assets', type: 'uint256' },
            { name: 'receiver', type: 'address' },
          ],
          withdrawalFunction: 'withdraw',
          withdrawalParams: [
            { name: 'assets', type: 'uint256' },
            { name: 'receiver', type: 'address' },
            { name: 'owner', type: 'address' },
          ],
          metadata: {
            protocolName: metadata.name,
            protocolIcon: metadata.icon,
            tokenIcon: TOKEN_ICONS[pool.symbol] || '',
            vaultName: pool.poolMeta || `${pool.symbol} Vault`,
            isAudited: true,
          },
        });
      }

      return opportunities;
    }, { maxRetries: 2, delayMs: 1000 });
  }

  /**
   * Fetch yields from Yearn API
   */
  private async fetchYearnYields(): Promise<YieldOpportunity[]> {
    const source = this.sources.find((s) => s.name === 'yearn');
    if (!source) return [];

    const opportunities: YieldOpportunity[] = [];

    for (const chainId of source.chains) {
      try {
        const response = await fetch(
          `${source.baseUrl}/${chainId}/vaults/all`
        );
        if (!response.ok) continue;

        const vaults = await response.json();

        for (const vault of vaults) {
          if (vault.type !== 'v3' || vault.kind !== 'Vault') continue;

          opportunities.push({
            id: `yearn-${chainId}-${vault.address}`,
            protocol: 'Yearn V3',
            protocolSlug: 'yearn-v3',
            chainId,
            chainName: CHAIN_ID_TO_NAME[chainId],
            token: vault.symbol,
            tokenAddress: vault.token?.address || '0x0000000000000000000000000000000000000000',
            vaultAddress: vault.address,
            apy: (vault.apy?.net_apy || 0),
            tvlUsd: (vault.tvl?.tvl || 0),
            riskLevel: 'medium',
            depositFunction: 'deposit',
            depositParams: [
              { name: 'assets', type: 'uint256' },
              { name: 'receiver', type: 'address' },
            ],
            withdrawalFunction: 'withdraw',
            withdrawalParams: [
              { name: 'assets', type: 'uint256' },
              { name: 'receiver', type: 'address' },
              { name: 'owner', type: 'address' },
            ],
            metadata: {
              protocolName: 'Yearn V3',
              protocolIcon: PROTOCOL_METADATA['yearn-v3'].icon,
              tokenIcon: TOKEN_ICONS[vault.token?.symbol] || '',
              vaultName: vault.name,
              vaultVersion: vault.version,
              isAudited: true,
            },
          });
        }
      } catch (error) {
        console.error(`Error fetching Yearn yields for chain ${chainId}:`, error);
      }
    }

    return opportunities;
  }

  /**
   * Fetch yields from Beefy API
   */
  private async fetchBeefyYields(): Promise<YieldOpportunity[]> {
    const source = this.sources.find((s) => s.name === 'beefy');
    if (!source) return [];

    return withRetry(async () => {
      const response = await fetch(`${source.baseUrl}/cow-vaults`);
      if (!response.ok) {
        throw new Error(`Beefy API error: ${response.status}`);
      }

      const vaults = await response.json();
      const opportunities: YieldOpportunity[] = [];

      for (const vault of vaults) {
        // Map Beefy chain IDs to our chain IDs
        const chainId = this.mapBeefyChainToChainId(vault.network);
        if (!chainId || !source.chains.includes(chainId)) continue;

        // Only include single-token vaults for now
        if (vault.assets.length !== 1) continue;

        opportunities.push({
          id: `beefy-${chainId}-${vault.earnContractAddress}`,
          protocol: 'Beefy',
          protocolSlug: 'beefy',
          chainId,
          chainName: CHAIN_ID_TO_NAME[chainId],
          token: vault.assets[0],
          tokenAddress: vault.tokenAddress || '0x0000000000000000000000000000000000000000',
          vaultAddress: vault.earnContractAddress,
          apy: (vault.apy || 0) / 100,
          tvlUsd: vault.tvlUsd || 0,
          riskLevel: 'medium',
          depositFunction: 'deposit',
          depositParams: [{ name: 'amount', type: 'uint256' }],
          withdrawalFunction: 'withdraw',
          withdrawalParams: [{ name: 'shares', type: 'uint256' }],
          metadata: {
            protocolName: 'Beefy',
            protocolIcon: PROTOCOL_METADATA['beefy'].icon,
            tokenIcon: TOKEN_ICONS[vault.assets[0]] || '',
            vaultName: vault.name,
            isAudited: true,
          },
        });
      }

      return opportunities;
    }, { maxRetries: 2, delayMs: 1000 });
  }

  /**
   * Map Beefy chain names to our chain IDs
   */
  private mapBeefyChainToChainId(network: string): number | null {
    const mapping: Record<string, number> = {
      ethereum: 1,
      optimism: 10,
      polygon: 137,
      arbitrum: 42161,
      base: 8453,
      blast: 81457,
      linea: 59144,
      scroll: 534352,
    };
    return mapping[network.toLowerCase()] || null;
  }

  /**
   * Fetch all yields from all enabled sources
   */
  async fetchAllYields(): Promise<YieldOpportunity[]> {
    const cacheKey = 'all-yields';
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    const [defiLlamaYields, yearnYields, beefyYields] = await Promise.all([
      this.fetchDefiLlamaYields(),
      this.fetchYearnYields(),
      this.fetchBeefyYields(),
    ]);

    // Combine and deduplicate
    const allYields = [...defiLlamaYields, ...yearnYields, ...beefyYields];

    // Sort by APY descending
    allYields.sort((a, b) => b.apy - a.apy);

    // Cache the results
    this.cache.set(cacheKey, { data: allYields, timestamp: Date.now() });

    return allYields;
  }

  /**
   * Query yields with filters
   */
  async queryYields(params: YieldQueryParams): Promise<YieldOpportunity[]> {
    let yields = await this.fetchAllYields();

    // Apply filters
    if (params.chainId) {
      yields = yields.filter((y) => y.chainId === params.chainId);
    }

    if (params.token) {
      const tokenUpper = params.token.toUpperCase();
      yields = yields.filter((y) => y.token.toUpperCase() === tokenUpper);
    }

    if (params.minApy !== undefined) {
      yields = yields.filter((y) => y.apy >= params.minApy!);
    }

    if (params.maxApy !== undefined) {
      yields = yields.filter((y) => y.apy <= params.maxApy!);
    }

    if (params.minTvlUsd !== undefined) {
      yields = yields.filter((y) => y.tvlUsd >= params.minTvlUsd!);
    }

    if (params.riskTolerance) {
      const riskLevels: Record<string, string[]> = {
        conservative: ['low'],
        moderate: ['low', 'medium'],
        aggressive: ['low', 'medium', 'high'],
      };
      const allowed = riskLevels[params.riskTolerance] || ['low'];
      yields = yields.filter((y) => allowed.includes(y.riskLevel));
    }

    if (params.whitelistedProtocols?.length) {
      const whitelist = params.whitelistedProtocols.map((p) => p.toLowerCase());
      yields = yields.filter((y) => whitelist.includes(y.protocolSlug));
    }

    if (params.blacklistedProtocols?.length) {
      const blacklist = params.blacklistedProtocols.map((p) => p.toLowerCase());
      yields = yields.filter((y) => !blacklist.includes(y.protocolSlug));
    }

    if (params.limit) {
      yields = yields.slice(0, params.limit);
    }

    return yields;
  }

  /**
   * Get the best yield opportunity for a specific token on a specific chain
   */
  async getBestYield(
    chainId: number,
    token: string,
    riskTolerance?: 'conservative' | 'moderate' | 'aggressive',
    minTvlUsd?: number
  ): Promise<YieldOpportunity | null> {
    const yields = await this.queryYields({
      chainId,
      token,
      riskTolerance,
      minTvlUsd,
      limit: 1,
    });

    return yields[0] || null;
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const yieldService = new YieldService();
