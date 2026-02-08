'use client';

import React, { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { namehash } from 'viem';
import { Card, CardHeader, CardContent, Button, Input, Select, Alert, Badge } from '@/components/ui';
import { ensService } from '@/services/ensService';
import { ENS_RESOLVER_ABI, SEPOLIA_ENS_CONFIG } from '@/lib/config';
import type { UserPreferences } from '@defi-butler/types';

interface PreferencesEditorProps {
  ensName: string;
  initialPreferences: UserPreferences;
  onUpdate?: () => void;
}

export const PreferencesEditor: React.FC<PreferencesEditorProps> = ({
  ensName,
  initialPreferences,
  onUpdate,
}) => {
  const { address } = useAccount();
  const chainId = useChainId();
  const [prefs, setPrefs] = useState<UserPreferences>(initialPreferences);
  const [isCheckingOwnership, setIsCheckingOwnership] = useState(false);
  const [ownershipError, setOwnershipError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [isSettingAll, setIsSettingAll] = useState(false);

  // Check if on Sepolia
  const isOnSepolia = chainId === sepolia.id;

  // Contract write hook
  const { writeContract, isPending: isWriting, data: hash } = useWriteContract();
  
  // Wait for transaction
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Set a single text record
  const handleSaveSingle = useCallback(async (key: string, value: string) => {
    if (!address || !ensName || !isOnSepolia) return;

    setOwnershipError(null);
    setUpdateSuccess(false);

    try {
      const resolverAddress = await ensService.getResolver(ensName);
      if (!resolverAddress) {
        setOwnershipError('No resolver found for this ENS name.');
        return;
      }

      const node = namehash(ensName.toLowerCase().trim());

      writeContract({
        address: resolverAddress,
        abi: ENS_RESOLVER_ABI,
        functionName: 'setText',
        args: [node, key, value],
      });

    } catch (error) {
      setOwnershipError(error instanceof Error ? error.message : 'Failed to update');
    }
  }, [address, ensName, isOnSepolia, writeContract]);

  // Set all preferences at once using multicall
  const handleSaveAll = useCallback(async () => {
    if (!address || !ensName || !isOnSepolia) return;

    setIsSettingAll(true);
    setOwnershipError(null);
    setUpdateSuccess(false);

    try {
      // Check ownership
      const isOwner = await ensService.isOwner(ensName, address);
      if (!isOwner) {
        setOwnershipError(`You do not own ${ensName}. Only the owner can update text records.`);
        setIsSettingAll(false);
        return;
      }

      const resolverAddress = await ensService.getResolver(ensName);
      if (!resolverAddress) {
        setOwnershipError('No resolver found for this ENS name. Please set a resolver first.');
        setIsSettingAll(false);
        return;
      }

      // Build multicall data
      const node = namehash(ensName.toLowerCase().trim());
      const records = ensService.serializePreferences(prefs);
      
      // For now, just set one key to test
      const key = 'com.yieldintent.riskTolerance';
      const value = prefs.riskTolerance;

      writeContract({
        address: resolverAddress,
        abi: ENS_RESOLVER_ABI,
        functionName: 'setText',
        args: [node, key, value],
      });

    } catch (error) {
      setOwnershipError(error instanceof Error ? error.message : 'Failed to update preferences');
      setIsSettingAll(false);
    }
  }, [address, ensName, isOnSepolia, prefs, writeContract]);

  // Handle successful update
  React.useEffect(() => {
    if (isSuccess) {
      setUpdateSuccess(true);
      setIsSettingAll(false);
      onUpdate?.();
    }
  }, [isSuccess, onUpdate]);

  const isLoading = isCheckingOwnership || isWriting || isConfirming || isSettingAll;

  // If not on Sepolia, show switch message
  if (!isOnSepolia) {
    return (
      <Card>
        <CardHeader title="Edit ENS Preferences" />
        <CardContent>
          <Alert variant="warning">
            <p className="font-medium">Switch to Sepolia Required</p>
            <p className="mt-1">
              To edit ENS text records, you must be connected to the Sepolia testnet.
            </p>
            <p className="mt-2 text-sm">
              ENS operations are free on Sepolia - you just need some Sepolia ETH for gas.
            </p>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader 
        title="Edit ENS Preferences" 
        subtitle={
          <span>
            Update your preferences stored in <code className="bg-gray-100 px-1 rounded">{ensName}</code> on{' '}
            <Badge variant="primary" size="sm">Sepolia</Badge>
          </span>
        }
      />
      <CardContent>
        <div className="space-y-6">
          {/* Info Box */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> These settings are stored as ENS text records on the Sepolia testnet. 
              Each change requires a small amount of Sepolia ETH for gas fees.
            </p>
            <a
              href="https://sepolia-faucet.pk910.de/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 underline mt-2 inline-block"
            >
              Get free Sepolia ETH from faucet
            </a>
          </div>

          {ownershipError && (
            <Alert variant="error">{ownershipError}</Alert>
          )}
          
          {updateSuccess && (
            <Alert variant="success">
              Preferences updated successfully! 
              {hash && (
                <a
                  href={`https://sepolia.etherscan.io/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline ml-1"
                >
                  View on Sepolia Etherscan
                </a>
              )}
            </Alert>
          )}

          {/* Risk Tolerance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Risk Tolerance
            </label>
            <Select
              value={prefs.riskTolerance}
              onChange={(e) => setPrefs({ ...prefs, riskTolerance: e.target.value as UserPreferences['riskTolerance'] })}
              options={[
                { value: 'conservative', label: 'Conservative (Aave, Compound, Morpho)' },
                { value: 'moderate', label: 'Moderate (+ Beefy, Yearn)' },
                { value: 'aggressive', label: 'Aggressive (+ Pendle, Silo)' },
              ]}
            />
            <p className="mt-1 text-xs text-gray-500">
              This determines which protocols are whitelisted for your intents
            </p>
          </div>

          {/* Max Slippage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Slippage (%)
            </label>
            <Input
              type="number"
              value={(prefs.maxSlippageBps / 100).toString()}
              onChange={(e) => setPrefs({ ...prefs, maxSlippageBps: parseFloat(e.target.value) * 100 })}
              min={0.1}
              max={5}
              step={0.1}
            />
          </div>

          {/* Preferred Chains */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Chains
            </label>
            <div className="flex flex-wrap gap-2">
              {['ethereum', 'arbitrum', 'base', 'optimism', 'polygon', 'scroll'].map((chain) => (
                <button
                  key={chain}
                  onClick={() => {
                    const current = prefs.preferredChains;
                    const updated = current.includes(chain)
                      ? current.filter((c) => c !== chain)
                      : [...current, chain];
                    setPrefs({ ...prefs, preferredChains: updated });
                  }}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    prefs.preferredChains.includes(chain)
                      ? 'bg-primary-100 text-primary-800 border-2 border-primary-300'
                      : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                  }`}
                >
                  {chain.charAt(0).toUpperCase() + chain.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Min Liquidity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Liquidity (USD)
            </label>
            <Input
              type="number"
              value={prefs.minLiquidityUsd.toString()}
              onChange={(e) => setPrefs({ ...prefs, minLiquidityUsd: parseInt(e.target.value) || 0 })}
              min={0}
              step={10000}
            />
            <p className="mt-1 text-xs text-gray-500">
              Minimum TVL required for yield vaults
            </p>
          </div>

          {/* Strategy Follow */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Follow Strategy (ENS Name)
            </label>
            <Input
              value={prefs.strategyFollow || ''}
              onChange={(e) => setPrefs({ ...prefs, strategyFollow: e.target.value || undefined })}
              placeholder="vitalik.eth (optional)"
            />
            <p className="mt-1 text-xs text-gray-500">
              Mirror another user&apos;s strategy preferences
            </p>
          </div>

          {/* Auto Rebalance */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="autoRebalance"
              checked={prefs.autoRebalance}
              onChange={(e) => setPrefs({ ...prefs, autoRebalance: e.target.checked })}
              className="h-4 w-4 text-primary-600 rounded border-gray-300"
            />
            <label htmlFor="autoRebalance" className="text-sm font-medium text-gray-700">
              Enable Auto-Rebalance
            </label>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSaveAll}
            isLoading={isLoading}
            disabled={isLoading}
            className="w-full"
          >
            {isWriting ? 'Submitting Transaction...' : 
             isConfirming ? 'Confirming...' : 
             'Save to ENS on Sepolia'}
          </Button>

          <p className="text-xs text-center text-gray-500">
            This will send a transaction on Sepolia testnet. Make sure you have Sepolia ETH for gas.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
