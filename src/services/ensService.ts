import {
  type Address,
  namehash,
  encodeFunctionData,
} from 'viem';
import { sepolia } from 'wagmi/chains';
import {
  type UserPreferences,
  type ENSProfile,
  type ENSTextRecords,
  ENS_RECORD_KEYS,
  DEFAULT_PREFERENCES,
  RISK_TOLERANCE_MAP,
} from '@/types';
import { SEPOLIA_ENS_CONFIG, ENS_REGISTRY_ABI, ENS_RESOLVER_ABI, ETH_REGISTRAR_ABI, sepoliaClient } from '@/lib/config';
import { safeJsonParse } from '@/lib/utils';

/**
 * Service for interacting with ENS on Sepolia testnet
 * Handles resolving names, reading/writing text records, and registering names
 */
export class ENSService {
  /**
   * Resolve an ENS name to an Ethereum address (Sepolia)
   */
  async resolveName(name: string): Promise<Address | null> {
    try {
      const normalizedName = name.toLowerCase().trim();
      const address = await sepoliaClient.getEnsAddress({
        name: normalizedName,
      });
      return address;
    } catch (error) {
      console.error('Error resolving ENS name on Sepolia:', error);
      return null;
    }
  }

  /**
   * Reverse resolve an address to an ENS name (Sepolia)
   */
  async lookupAddress(address: Address): Promise<string | null> {
    try {
      const name = await sepoliaClient.getEnsName({
        address,
      });
      return name;
    } catch (error) {
      console.error('Error looking up ENS name on Sepolia:', error);
      return null;
    }
  }

  /**
   * Check if an ENS name is available for registration (Sepolia)
   */
  async isAvailable(name: string): Promise<boolean> {
    try {
      // Remove .eth suffix if present
      const cleanName = name.replace(/\.eth$/, '').toLowerCase().trim();
      
      const available = await sepoliaClient.readContract({
        address: SEPOLIA_ENS_CONFIG.ethRegistrarController,
        abi: ETH_REGISTRAR_ABI,
        functionName: 'available',
        args: [cleanName],
      });
      
      return available;
    } catch (error) {
      console.error('Error checking ENS availability:', error);
      return false;
    }
  }

  /**
   * Get registration price for an ENS name (Sepolia)
   */
  async getRentPrice(name: string, duration: number): Promise<{ base: bigint; premium: bigint } | null> {
    try {
      const cleanName = name.replace(/\.eth$/, '').toLowerCase().trim();
      
      const price = await sepoliaClient.readContract({
        address: SEPOLIA_ENS_CONFIG.ethRegistrarController,
        abi: ETH_REGISTRAR_ABI,
        functionName: 'rentPrice',
        args: [cleanName, BigInt(duration)],
      }) as [bigint, bigint];
      
      return { base: price[0], premium: price[1] };
    } catch (error) {
      console.error('Error getting ENS rent price:', error);
      return null;
    }
  }

  /**
   * Get the resolver address for an ENS name (Sepolia)
   */
  async getResolver(name: string): Promise<Address | null> {
    try {
      const node = namehash(name.toLowerCase().trim());
      const resolver = await sepoliaClient.readContract({
        address: SEPOLIA_ENS_CONFIG.registryAddress,
        abi: ENS_REGISTRY_ABI,
        functionName: 'resolver',
        args: [node],
      });
      
      if (resolver === '0x0000000000000000000000000000000000000000') {
        return null;
      }
      
      return resolver;
    } catch (error) {
      console.error('Error getting resolver:', error);
      return null;
    }
  }

  /**
   * Get the owner of an ENS name (Sepolia)
   */
  async getOwner(name: string): Promise<Address | null> {
    try {
      const node = namehash(name.toLowerCase().trim());
      const owner = await sepoliaClient.readContract({
        address: SEPOLIA_ENS_CONFIG.registryAddress,
        abi: ENS_REGISTRY_ABI,
        functionName: 'owner',
        args: [node],
      });
      
      if (owner === '0x0000000000000000000000000000000000000000') {
        return null;
      }
      
      return owner;
    } catch (error) {
      console.error('Error getting owner:', error);
      return null;
    }
  }

  /**
   * Check if an address owns an ENS name
   */
  async isOwner(name: string, address: Address): Promise<boolean> {
    try {
      const owner = await this.getOwner(name);
      return owner?.toLowerCase() === address.toLowerCase();
    } catch {
      return false;
    }
  }

  /**
   * Get a text record from an ENS name (Sepolia)
   */
  async getTextRecord(name: string, key: string): Promise<string | null> {
    try {
      const normalizedName = name.toLowerCase().trim();
      const record = await sepoliaClient.getEnsText({
        name: normalizedName,
        key,
      });
      return record;
    } catch (error) {
      console.error(`Error getting text record ${key}:`, error);
      return null;
    }
  }

  /**
   * Get all yield intent text records from an ENS name
   */
  async getAllTextRecords(name: string): Promise<Partial<ENSTextRecords>> {
    const records: Partial<ENSTextRecords> = {};
    
    const keys = Object.values(ENS_RECORD_KEYS);
    
    for (const key of keys) {
      const value = await this.getTextRecord(name, key);
      if (value) {
        (records as Record<string, string>)[key] = value;
      }
    }
    
    return records;
  }

  /**
   * Parse text records into UserPreferences
   */
  parsePreferences(records: Partial<ENSTextRecords>): UserPreferences {
    const prefs: UserPreferences = { ...DEFAULT_PREFERENCES };
    
    // Parse preferred chains
    if (records['com.yieldintent.preferredChains']) {
      try {
        const chains = JSON.parse(records['com.yieldintent.preferredChains']);
        if (Array.isArray(chains)) {
          prefs.preferredChains = chains.map((c: string) => c.toLowerCase());
        }
      } catch {
        // Invalid JSON, use default
      }
    }
    
    // Parse risk tolerance
    if (records['com.yieldintent.riskTolerance']) {
      const risk = records['com.yieldintent.riskTolerance'] as UserPreferences['riskTolerance'];
      if (['conservative', 'moderate', 'aggressive'].includes(risk)) {
        prefs.riskTolerance = risk;
        prefs.whitelistedProtocols = RISK_TOLERANCE_MAP[risk];
      }
    }
    
    // Parse max slippage
    if (records['com.yieldintent.maxSlippageBps']) {
      const slippage = parseInt(records['com.yieldintent.maxSlippageBps'], 10);
      if (!isNaN(slippage) && slippage > 0 && slippage <= 1000) {
        prefs.maxSlippageBps = slippage;
      }
    }
    
    // Parse default action
    if (records['com.yieldintent.defaultAction']) {
      const action = records['com.yieldintent.defaultAction'] as UserPreferences['defaultAction'];
      if (['deposit', 'bridge', 'swap'].includes(action)) {
        prefs.defaultAction = action;
      }
    }
    
    // Parse whitelisted protocols
    if (records['com.yieldintent.whitelistedProtocols']) {
      try {
        const protocols = JSON.parse(records['com.yieldintent.whitelistedProtocols']);
        if (Array.isArray(protocols)) {
          prefs.whitelistedProtocols = protocols;
        }
      } catch {
        // Invalid JSON, keep defaults from risk tolerance
      }
    }
    
    // Parse blacklisted protocols
    if (records['com.yieldintent.blacklistedProtocols']) {
      try {
        const protocols = JSON.parse(records['com.yieldintent.blacklistedProtocols']);
        if (Array.isArray(protocols)) {
          prefs.blacklistedProtocols = protocols;
        }
      } catch {
        // Invalid JSON
      }
    }
    
    // Parse min liquidity
    if (records['com.yieldintent.minLiquidityUsd']) {
      const liquidity = parseInt(records['com.yieldintent.minLiquidityUsd'], 10);
      if (!isNaN(liquidity) && liquidity >= 0) {
        prefs.minLiquidityUsd = liquidity;
      }
    }
    
    // Parse strategy follow
    if (records['com.yieldintent.strategyFollow']) {
      prefs.strategyFollow = records['com.yieldintent.strategyFollow'];
    }
    
    // Parse auto rebalance
    if (records['com.yieldintent.autoRebalance']) {
      prefs.autoRebalance = records['com.yieldintent.autoRebalance'] === 'true';
    }
    
    // Parse notification preferences
    if (records['com.yieldintent.notificationPrefs']) {
      try {
        const notifs = JSON.parse(records['com.yieldintent.notificationPrefs']);
        if (typeof notifs === 'object') {
          prefs.notificationPrefs = notifs;
        }
      } catch {
        // Invalid JSON
      }
    }
    
    return prefs;
  }

  /**
   * Serialize UserPreferences to text records format
   */
  serializePreferences(prefs: UserPreferences): ENSTextRecords {
    return {
      'com.yieldintent.preferredChains': JSON.stringify(prefs.preferredChains),
      'com.yieldintent.riskTolerance': prefs.riskTolerance,
      'com.yieldintent.maxSlippageBps': prefs.maxSlippageBps.toString(),
      'com.yieldintent.defaultAction': prefs.defaultAction,
      'com.yieldintent.whitelistedProtocols': JSON.stringify(prefs.whitelistedProtocols),
      'com.yieldintent.blacklistedProtocols': JSON.stringify(prefs.blacklistedProtocols),
      'com.yieldintent.minLiquidityUsd': prefs.minLiquidityUsd.toString(),
      'com.yieldintent.strategyFollow': prefs.strategyFollow || '',
      'com.yieldintent.autoRebalance': prefs.autoRebalance.toString(),
      'com.yieldintent.notificationPrefs': JSON.stringify(prefs.notificationPrefs),
    };
  }

  /**
   * Get full ENS profile including preferences (Sepolia)
   */
  async getProfile(name: string): Promise<ENSProfile | null> {
    const normalizedName = name.toLowerCase().trim();
    
    // Resolve address
    const address = await this.resolveName(normalizedName);
    if (!address) {
      return null;
    }
    
    // Get all text records
    const records = await this.getAllTextRecords(normalizedName);
    
    // Check if following another strategy
    let isFollowingStrategy = false;
    let followedStrategyOwner: string | undefined;
    let preferences: UserPreferences;
    
    if (records['com.yieldintent.strategyFollow']) {
      isFollowingStrategy = true;
      followedStrategyOwner = records['com.yieldintent.strategyFollow'];
      
      // Fetch the followed user's preferences
      const followedRecords = await this.getAllTextRecords(followedStrategyOwner);
      preferences = this.parsePreferences(followedRecords);
    } else {
      preferences = this.parsePreferences(records);
    }
    
    // Get avatar
    const avatar = await sepoliaClient.getEnsAvatar({
      name: normalizedName,
    });
    
    return {
      name: normalizedName,
      address,
      avatar: avatar || undefined,
      preferences,
      isFollowingStrategy,
      followedStrategyOwner,
    };
  }

  /**
   * Build transaction data for setting a text record
   */
  async buildSetTextTransaction(
    name: string,
    key: string,
    value: string
  ): Promise<{ resolverAddress: Address; data: `0x${string}` } | null> {
    try {
      const node = namehash(name.toLowerCase().trim());
      const resolverAddress = await this.getResolver(name);
      
      if (!resolverAddress) {
        throw new Error('No resolver found for this ENS name');
      }

      const data = encodeFunctionData({
        abi: ENS_RESOLVER_ABI,
        functionName: 'setText',
        args: [node, key, value],
      });

      return {
        resolverAddress,
        data,
      };
    } catch (error) {
      console.error('Error building setText transaction:', error);
      return null;
    }
  }

  /**
   * Build all transactions to update preferences
   */
  async buildUpdatePreferencesTransactions(
    name: string,
    prefs: UserPreferences
  ): Promise<Array<{ resolverAddress: Address; data: `0x${string}` }> | null> {
    try {
      const records = this.serializePreferences(prefs);
      const transactions = [];

      for (const [key, value] of Object.entries(records)) {
        const tx = await this.buildSetTextTransaction(name, key, value);
        if (tx) {
          transactions.push(tx);
        }
      }

      return transactions;
    } catch (error) {
      console.error('Error building update preferences transactions:', error);
      return null;
    }
  }
}

// Export singleton instance
export const ensService = new ENSService();
