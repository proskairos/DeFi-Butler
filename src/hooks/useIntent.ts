import { useState, useCallback } from 'react';
import type { Route } from '@lifi/sdk';
import type {
  IntentRequest,
  ComposedIntent,
  IntentExecution,
  YieldOpportunity,
  UserPreferences,
} from '@/types';
import { lifiService } from '@/services/lifiService';
import { yieldService } from '@/services/yieldService';
import { generateId } from '@/lib/utils';

type IntentStep = 
  | 'input'
  | 'fetching-route'
  | 'finding-yield'
  | 'composing'
  | 'ready'
  | 'executing'
  | 'completed'
  | 'failed';

interface IntentState {
  step: IntentStep;
  route: Route | null;
  targetYield: YieldOpportunity | null;
  composedIntent: ComposedIntent | null;
  execution: IntentExecution | null;
  error: string | null;
}

interface UseIntentReturn {
  // State
  state: IntentState;
  
  // Actions
  buildIntent: (
    request: IntentRequest,
    preferences: UserPreferences
  ) => Promise<void>;
  executeIntent: (walletClient: unknown) => Promise<void>;
  reset: () => void;
  
  // Derived
  canExecute: boolean;
  isProcessing: boolean;
}

const initialState: IntentState = {
  step: 'input',
  route: null,
  targetYield: null,
  composedIntent: null,
  execution: null,
  error: null,
};

/**
 * Hook for building and executing cross-chain intents
 * Orchestrates the full flow: routing -> yield discovery -> composition -> execution
 */
export function useIntent(): UseIntentReturn {
  const [state, setState] = useState<IntentState>(initialState);

  /**
   * Build a complete intent with route and yield target
   */
  const buildIntent = useCallback(async (
    request: IntentRequest,
    preferences: UserPreferences
  ) => {
    setState((prev) => ({ ...prev, step: 'fetching-route', error: null }));

    try {
      // Step 1: Get LI.FI route for bridge/swap
      const route = await lifiService.getBestRoute(request);
      
      if (!route) {
        throw new Error('No route found for this intent');
      }

      // Slippage is already enforced by LI.FI SDK in route options
      setState((prev) => ({ ...prev, route, step: 'finding-yield' }));

      // Step 2: Find best yield opportunity on destination chain
      const targetYield = await yieldService.getBestYield(
        request.toChain,
        request.toToken,
        preferences.riskTolerance,
        preferences.minLiquidityUsd
      );

      if (!targetYield) {
        throw new Error(
          'No yield opportunities found matching your criteria on the destination chain'
        );
      }

      // Check if protocol is blacklisted
      if (preferences.blacklistedProtocols.includes(targetYield.protocolSlug)) {
        throw new Error(
          `The best yield opportunity is from ${targetYield.protocol}, which is in your blacklist`
        );
      }

      setState((prev) => ({ ...prev, targetYield, step: 'composing' }));

      // Step 3: Compose the intent with vault deposit
      const composedIntent = await lifiService.composeIntentWithDeposit(
        request,
        targetYield
      );

      setState((prev) => ({
        ...prev,
        composedIntent,
        step: 'ready',
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        step: 'failed',
        error: error instanceof Error ? error.message : 'Failed to build intent',
      }));
    }
  }, []);

  /**
   * Execute the composed intent
   */
  const executeIntent = useCallback(async (walletClient: unknown) => {
    const { route, composedIntent } = state;
    
    if (!route || !composedIntent) {
      setState((prev) => ({
        ...prev,
        step: 'failed',
        error: 'No intent to execute',
      }));
      return;
    }

    setState((prev) => ({ ...prev, step: 'executing', error: null }));

    try {
      const execution = await lifiService.executeComposedIntent(
        composedIntent,
        route,
        walletClient
      );

      setState((prev) => ({
        ...prev,
        execution,
        step: execution.status === 'completed' ? 'completed' : 'failed',
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        step: 'failed',
        error: error instanceof Error ? error.message : 'Execution failed',
      }));
    }
  }, [state]);

  /**
   * Reset the intent state
   */
  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  // Derived state
  const canExecute = state.step === 'ready' && !!state.composedIntent && !!state.route;
  const isProcessing = ['fetching-route', 'finding-yield', 'composing', 'executing'].includes(
    state.step
  );

  return {
    state,
    buildIntent,
    executeIntent,
    reset,
    canExecute,
    isProcessing,
  };
}

interface QuickIntentParams {
  fromChain: number;
  fromToken: string;
  fromAmount: string;
  toChain: number;
  toToken: string;
  userAddress: `0x${string}`;
  ensName?: string;
}

interface UseQuickIntentReturn {
  execute: (
    params: QuickIntentParams,
    preferences: UserPreferences,
    walletClient: unknown
  ) => Promise<void>;
  isExecuting: boolean;
  error: string | null;
  lastExecution: IntentExecution | null;
}

/**
 * Hook for quick one-click intent execution
 * Simplified interface for the main user flow
 */
export function useQuickIntent(): UseQuickIntentReturn {
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastExecution, setLastExecution] = useState<IntentExecution | null>(null);

  const execute = useCallback(async (
    params: QuickIntentParams,
    preferences: UserPreferences,
    walletClient: unknown
  ) => {
    setIsExecuting(true);
    setError(null);

    try {
      const request: IntentRequest = {
        fromChain: params.fromChain,
        fromToken: params.fromToken,
        fromAmount: params.fromAmount,
        toChain: params.toChain,
        toToken: params.toToken,
        userAddress: params.userAddress,
        ensName: params.ensName,
        slippage: preferences.maxSlippageBps / 10000,
      };

      // Get route
      const route = await lifiService.getBestRoute(request);
      if (!route) {
        throw new Error('No route found');
      }

      // Get best yield
      const targetYield = await yieldService.getBestYield(
        params.toChain,
        params.toToken,
        preferences.riskTolerance,
        preferences.minLiquidityUsd
      );
      if (!targetYield) {
        throw new Error('No yield opportunities found');
      }

      // Compose and execute
      const composedIntent = await lifiService.composeIntentWithDeposit(
        request,
        targetYield
      );

      const execution = await lifiService.executeComposedIntent(
        composedIntent,
        route,
        walletClient
      );

      setLastExecution(execution);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Execution failed');
      throw err;
    } finally {
      setIsExecuting(false);
    }
  }, []);

  return {
    execute,
    isExecuting,
    error,
    lastExecution,
  };
}
