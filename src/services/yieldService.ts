import type {
  YieldOpportunity,
  YieldQueryParams,
  YieldSourceConfig,
} from '@/types';
import { SUPPORTED_YIELD_SOURCES, CHAIN_ID_TO_NAME } from '@/types';
import { withRetry } from '@/lib/utils';

// Protocol metadata for display with embedded SVG icons
const PROTOCOL_METADATA: Record<
  string,
  { name: string; icon: string; riskLevel: 'low' | 'medium' | 'high' }
> = {
  'aave-v3': {
    name: 'Aave V3',
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23650FDA"/><path d="M50 20 L70 50 L50 60 L30 50 Z" fill="white"/><path d="M50 60 L70 50 L50 80 L30 50 Z" fill="white" opacity="0.7"/></svg>',
    riskLevel: 'low',
  },
  'compound-v3': {
    name: 'Compound V3',
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%2300D395"/><path d="M30 35 L50 25 L70 35 L70 45 L50 35 L30 45 Z" fill="white"/><path d="M30 55 L50 45 L70 55 L70 65 L50 55 L30 65 Z" fill="white" opacity="0.8"/><circle cx="50" cy="75" r="8" fill="white"/></svg>',
    riskLevel: 'low',
  },
  'morpho': {
    name: 'Morpho',
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%231C1C1C"/><circle cx="35" cy="40" r="12" fill="url(%23morphoGrad)"/><circle cx="65" cy="40" r="12" fill="url(%23morphoGrad)"/><circle cx="50" cy="65" r="12" fill="url(%23morphoGrad)"/><defs><linearGradient id="morphoGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%234478F4"/><stop offset="100%" stop-color="%23F447F4"/></linearGradient></defs></svg>',
    riskLevel: 'low',
  },
  'spark': {
    name: 'Spark',
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23F05A28"/><path d="M50 15 L60 40 L85 40 L65 55 L75 80 L50 65 L25 80 L35 55 L15 40 L40 40 Z" fill="white"/></svg>',
    riskLevel: 'low',
  },
  'yearn-v3': {
    name: 'Yearn V3',
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%2300E0FF"/><path d="M50 20 L65 40 L55 40 L55 60 L65 60 L50 80 L35 60 L45 60 L45 40 L35 40 Z" fill="%2306517E"/><circle cx="50" cy="50" r="15" fill="none" stroke="%2306517E" stroke-width="3"/></svg>',
    riskLevel: 'medium',
  },
  'pendle': {
    name: 'Pendle',
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%230B0B0B"/><path d="M30 30 L50 20 L70 30 L70 50 L50 60 L30 50 Z" fill="url(%23pendleGrad)"/><path d="M30 50 L50 60 L70 50 L70 70 L50 80 L30 70 Z" fill="url(%23pendleGrad)" opacity="0.7"/><defs><linearGradient id="pendleGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23F5C342"/><stop offset="100%" stop-color="%23F542A4"/></linearGradient></defs></svg>',
    riskLevel: 'high',
  },
  'silo': {
    name: 'Silo',
    icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%232D1F4C"/><rect x="30" y="25" width="15" height="50" rx="3" fill="%235F4B8B"/><rect x="55" y="25" width="15" height="50" rx="3" fill="%238B4B8B"/><circle cx="37.5" cy="40" r="5" fill="white"/><circle cx="62.5" cy="60" r="5" fill="white"/></svg>',
    riskLevel: 'high',
  },
};

// Token icons with embedded SVGs
const TOKEN_ICONS: Record<string, string> = {
  USDC: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%232775CA"/><circle cx="50" cy="50" r="35" fill="white"/><text x="50" y="58" text-anchor="middle" font-size="24" font-weight="bold" fill="%232775CA">$</text></svg>',
  USDT: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%2326A17B"/><circle cx="50" cy="50" r="35" fill="white"/><text x="50" y="58" text-anchor="middle" font-size="22" font-weight="bold" fill="%2326A17B">T</text></svg>',
  DAI: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23F5AC37"/><circle cx="50" cy="50" r="35" fill="white"/><path d="M50 25 L60 45 L50 55 L40 45 Z" fill="%23F5AC37"/><path d="M50 55 L60 45 L50 75 L40 45 Z" fill="%23F5AC37" opacity="0.7"/></svg>',
  WETH: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23627EEA"/><path d="M50 20 L65 50 L50 60 L35 50 Z" fill="white"/><path d="M50 60 L65 50 L50 80 L35 50 Z" fill="white" opacity="0.7"/><circle cx="50" cy="50" r="20" fill="none" stroke="white" stroke-width="2"/></svg>',
  WBTC: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23F7931A"/><text x="50" y="62" text-anchor="middle" font-size="36" font-weight="bold" fill="white">₿</text></svg>',
};

/**
 * Service for discovering and querying yield opportunities
 * Aggregates data from multiple sources: DefiLlama, Yearn
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
   * Fetch all yields from all enabled sources
   */
  async fetchAllYields(): Promise<YieldOpportunity[]> {
    const cacheKey = 'all-yields';
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    const [defiLlamaYields, yearnYields] = await Promise.all([
      this.fetchDefiLlamaYields(),
      this.fetchYearnYields(),
    ]);

    // Combine and deduplicate
    const allYields = [...defiLlamaYields, ...yearnYields];

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
