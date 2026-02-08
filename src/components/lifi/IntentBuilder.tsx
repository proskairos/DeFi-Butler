'use client';

import React, { useState, useCallback } from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { mainnet, arbitrum, base, optimism } from 'wagmi/chains';
import { Card, CardHeader, CardContent, Button, Input, Select, Alert, Badge, Loading } from '@/components/ui';
import { getLiFiRoutes, executeLiFiRoute, formatRouteDisplay, type RouteQuote, type ExecutionStatus } from '@/services/lifiService';
import type { UserPreferences } from '@/types';

const TOKEN_OPTIONS = [
  { value: 'USDC', label: 'USDC' },
  { value: 'USDT', label: 'USDT' },
  { value: 'DAI', label: 'DAI' },
  { value: 'WETH', label: 'WETH' },
];

const CHAIN_OPTIONS = [
  { value: mainnet.id.toString(), label: 'Ethereum Mainnet', chain: mainnet },
  { value: arbitrum.id.toString(), label: 'Arbitrum', chain: arbitrum },
  { value: base.id.toString(), label: 'Base', chain: base },
  { value: optimism.id.toString(), label: 'Optimism', chain: optimism },
];

interface IntentBuilderProps {
  preferences: UserPreferences;
  userAddress: `0x${string}`;
  ensName?: string;
}

export const IntentBuilder: React.FC<IntentBuilderProps> = ({
  preferences,
  userAddress,
  ensName,
}) => {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { isConnected } = useAccount();
  
  // Form state
  const [fromChain, setFromChain] = useState<number>(arbitrum.id);
  const [fromToken, setFromToken] = useState('USDC');
  const [fromAmount, setFromAmount] = useState('');
  const [toChain, setToChain] = useState<number>(base.id);
  const [toToken, setToToken] = useState('USDC');
  
  // Execution state
  const [routeQuote, setRouteQuote] = useState<RouteQuote | null>(null);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  const needsChainSwitch = chainId !== fromChain;
  const isSameChain = fromChain === toChain;
  const isValidInput = fromAmount && parseFloat(fromAmount) > 0;

  const handleGetRoutes = useCallback(async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) return;

    setIsLoadingRoutes(true);
    setRouteError(null);
    setRouteQuote(null);
    setExecutionStatus(null);

    try {
      const quote = await getLiFiRoutes(
        fromChain,
        toChain,
        fromToken,
        toToken,
        fromAmount,
        userAddress,
        preferences.maxSlippageBps / 10000
      );

      if (!quote) {
        setRouteError('No routes found. Try adjusting your amount or tokens.');
        return;
      }

      setRouteQuote(quote);
    } catch (error) {
      setRouteError(error instanceof Error ? error.message : 'Failed to get routes');
    } finally {
      setIsLoadingRoutes(false);
    }
  }, [fromChain, fromToken, toChain, toToken, fromAmount, userAddress, preferences.maxSlippageBps]);

  const handleExecute = useCallback(async () => {
    if (!routeQuote?.bestRoute) return;

    setExecutionStatus({ status: 'pending', message: 'Preparing transaction...' });

    try {
      await executeLiFiRoute(routeQuote.bestRoute, (status) => {
        setExecutionStatus(status);
      });
    } catch (error) {
      // Error is already set in status callback
    }
  }, [routeQuote]);

  const formatChainName = (chainId: number) => {
    return CHAIN_OPTIONS.find(c => parseInt(c.value) === chainId)?.label || `Chain ${chainId}`;
  };

  return (
    <Card>
      <CardHeader 
        title="Cross-Chain Intent" 
        subtitle={ensName ? `Building intent for ${ensName}` : 'Bridge and deposit in one transaction'}
      />
      
      <CardContent>
        <div className="space-y-6">
          {/* From Section */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-700">From</p>
              {needsChainSwitch && (
                <Badge variant="warning">Switch Chain Required</Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Chain"
                value={fromChain.toString()}
                onChange={(e) => setFromChain(parseInt(e.target.value))}
                options={CHAIN_OPTIONS}
              />
              <Select
                label="Token"
                value={fromToken}
                onChange={(e) => setFromToken(e.target.value)}
                options={TOKEN_OPTIONS}
              />
            </div>
            <div className="mt-3">
              <Input
                label="Amount"
                type="number"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                placeholder="0.00"
                rightElement={<span className="text-gray-500">{fromToken}</span>}
              />
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="p-2 bg-gray-100 rounded-full">
              <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>

          {/* To Section */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-3">To</p>
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Chain"
                value={toChain.toString()}
                onChange={(e) => setToChain(parseInt(e.target.value))}
                options={CHAIN_OPTIONS}
              />
              <Select
                label="Token"
                value={toToken}
                onChange={(e) => setToToken(e.target.value)}
                options={TOKEN_OPTIONS}
              />
            </div>
          </div>

          {/* Route Display */}
          {isLoadingRoutes && (
            <div className="p-8 text-center">
              <Loading size="lg" />
              <p className="mt-4 text-gray-600">Finding best routes...</p>
            </div>
          )}

          {routeError && (
            <Alert variant="error">{routeError}</Alert>
          )}

          {routeQuote && routeQuote.bestRoute && (
            <div className="p-4 border-2 border-green-200 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-3">Best Route Found</h4>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">You Send:</span>
                  <span className="font-medium">{routeQuote.fromAmount} {fromToken}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">You Receive:</span>
                  <span className="font-medium">{parseFloat(routeQuote.toAmount).toFixed(6)} {toToken}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Gas Cost:</span>
                  <span className="font-medium">{routeQuote.gasCostUSD}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Estimated Time:</span>
                  <span className="font-medium">{Math.ceil(routeQuote.estimatedTime / 60)} min</span>
                </div>
              </div>

              {/* Route Steps */}
              <div className="bg-white rounded p-3 mb-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Route Steps:</p>
                <div className="space-y-2">
                  {formatRouteDisplay(routeQuote.bestRoute).steps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-medium">
                        {idx + 1}
                      </span>
                      <span className="text-gray-600">
                        {(step.type as string) === 'cross' || (step.type as string) === 'bridge' ? 'Bridge' : 'Swap'} {step.fromToken} → {step.toToken}
                      </span>
                      <span className="text-xs text-gray-400">via {step.tool}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Execution Status */}
              {executionStatus && (
                <div className={`p-3 rounded mb-4 ${
                  executionStatus.status === 'success' ? 'bg-green-100 text-green-800' :
                  executionStatus.status === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  <p className="text-sm font-medium">{executionStatus.message}</p>
                  {executionStatus.txHash && (
                    <a
                      href={`https://explorer.li.fi/tx/${executionStatus.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs underline mt-1 inline-block"
                    >
                      View on LI.FI Explorer
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!routeQuote ? (
              <Button
                onClick={handleGetRoutes}
                isLoading={isLoadingRoutes}
                disabled={!isValidInput || !isConnected || isLoadingRoutes}
                className="flex-1"
              >
                {isSameChain ? 'Find Best Route' : 'Find Bridge Route'}
              </Button>
            ) : (
              <>
                {needsChainSwitch ? (
                  <Button
                    onClick={() => switchChain?.({ chainId: fromChain })}
                    variant="warning"
                    className="flex-1"
                  >
                    Switch to {formatChainName(fromChain)}
                  </Button>
                ) : executionStatus?.status === 'success' ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setRouteQuote(null);
                      setExecutionStatus(null);
                      setFromAmount('');
                    }}
                    className="flex-1"
                  >
                    Start New Intent
                  </Button>
                ) : (
                  <Button
                    onClick={handleExecute}
                    disabled={executionStatus?.status === 'loading'}
                    isLoading={executionStatus?.status === 'loading'}
                    className="flex-1"
                  >
                    {executionStatus?.status === 'loading' ? 'Executing...' : 'Execute Intent'}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    setRouteQuote(null);
                    setExecutionStatus(null);
                  }}
                >
                  Reset
                </Button>
              </>
            )}
          </div>

          {!isConnected && (
            <Alert variant="warning">Please connect your wallet to continue</Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
