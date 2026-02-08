import { useState, useCallback, useEffect, useRef } from 'react';
import type { YieldOpportunity, YieldQueryParams, UserPreferences } from '@/types';
import { yieldService } from '@/services/yieldService';
import { debounce } from '@/lib/utils';

interface UseYieldReturn {
  // State
  opportunities: YieldOpportunity[];
  bestOpportunity: YieldOpportunity | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchYields: (params: YieldQueryParams) => Promise<void>;
  findBestYield: (
    chainId: number,
    token: string,
    preferences: UserPreferences
  ) => Promise<YieldOpportunity | null>;
  refresh: () => void;
  clear: () => void;
}

/**
 * Hook for fetching and managing yield opportunities
 */
export function useYield(): UseYieldReturn {
  const [opportunities, setOpportunities] = useState<YieldOpportunity[]>([]);
  const [bestOpportunity, setBestOpportunity] = useState<YieldOpportunity | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to track if component is mounted
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Fetch yield opportunities with filters
   */
  const fetchYields = useCallback(async (params: YieldQueryParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const results = await yieldService.queryYields(params);
      
      if (isMountedRef.current) {
        setOpportunities(results);
        setBestOpportunity(results[0] || null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch yields');
        setOpportunities([]);
        setBestOpportunity(null);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  /**
   * Find the best yield opportunity matching user preferences
   */
  const findBestYield = useCallback(async (
    chainId: number,
    token: string,
    preferences: UserPreferences
  ): Promise<YieldOpportunity | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await yieldService.getBestYield(
        chainId,
        token,
        preferences.riskTolerance,
        preferences.minLiquidityUsd
      );

      if (isMountedRef.current) {
        setBestOpportunity(result);
      }

      return result;
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to find best yield');
      }
      return null;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  /**
   * Refresh yields by clearing cache and refetching
   */
  const refresh = useCallback(() => {
    yieldService.clearCache();
    setOpportunities([]);
    setBestOpportunity(null);
  }, []);

  /**
   * Clear all yield data
   */
  const clear = useCallback(() => {
    setOpportunities([]);
    setBestOpportunity(null);
    setError(null);
  }, []);

  return {
    opportunities,
    bestOpportunity,
    isLoading,
    error,
    fetchYields,
    findBestYield,
    refresh,
    clear,
  };
}

interface UseYieldForIntentReturn {
  targetYield: YieldOpportunity | null;
  isLoading: boolean;
  error: string | null;
  findTargetYield: (
    destinationChain: number,
    token: string,
    preferences: UserPreferences
  ) => Promise<void>;
}

/**
 * Hook specifically for finding yield opportunities for an intent
 * Optimized for the cross-chain deposit flow
 */
export function useYieldForIntent(): UseYieldForIntentReturn {
  const [targetYield, setTargetYield] = useState<YieldOpportunity | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findTargetYield = useCallback(async (
    destinationChain: number,
    token: string,
    preferences: UserPreferences
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const params: YieldQueryParams = {
        chainId: destinationChain,
        token,
        riskTolerance: preferences.riskTolerance,
        minTvlUsd: preferences.minLiquidityUsd,
        whitelistedProtocols: preferences.whitelistedProtocols,
        blacklistedProtocols: preferences.blacklistedProtocols,
        limit: 5, // Get top 5 for user to choose
      };

      const results = await yieldService.queryYields(params);
      setTargetYield(results[0] || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find yield opportunities');
      setTargetYield(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    targetYield,
    isLoading,
    error,
    findTargetYield,
  };
}
