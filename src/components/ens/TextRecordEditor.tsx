'use client';

import React, { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { namehash } from 'viem';
import { Card, CardHeader, CardContent, Button, Input, Alert, Badge } from '@/components/ui';
import { ENS_RESOLVER_ABI, SEPOLIA_ENS_CONFIG } from '@/lib/config';
import { ensService } from '@/services/ensService';
import type { UserPreferences } from '@defi-butler/types';
import { ENS_RECORD_KEYS, RISK_TOLERANCE_MAP } from '@defi-butler/types';

interface TextRecordEditorProps {
  ensName: string;
  initialRecords: Record<string, string>;
  onUpdate?: () => void;
}

// Preset keys for yield intent
const PRESET_KEYS = [
  { key: ENS_RECORD_KEYS['com.yieldintent.preferredChains'], label: 'Preferred Chains', type: 'json', example: '["base", "arbitrum"]' },
  { key: ENS_RECORD_KEYS['com.yieldintent.riskTolerance'], label: 'Risk Tolerance', type: 'select', options: ['conservative', 'moderate', 'aggressive'] },
  { key: ENS_RECORD_KEYS['com.yieldintent.maxSlippageBps'], label: 'Max Slippage (BPS)', type: 'number', example: '100' },
  { key: ENS_RECORD_KEYS['com.yieldintent.whitelistedProtocols'], label: 'Whitelisted Protocols', type: 'json', example: '["aave-v3", "compound-v3"]' },
  { key: ENS_RECORD_KEYS['com.yieldintent.blacklistedProtocols'], label: 'Blacklisted Protocols', type: 'json', example: '["protocol-to-avoid"]' },
  { key: ENS_RECORD_KEYS['com.yieldintent.minLiquidityUsd'], label: 'Min Liquidity (USD)', type: 'number', example: '100000' },
  { key: ENS_RECORD_KEYS['com.yieldintent.strategyFollow'], label: 'Follow Strategy (ENS)', type: 'text', example: 'vitalik.eth' },
  { key: ENS_RECORD_KEYS['com.yieldintent.autoRebalance'], label: 'Auto Rebalance', type: 'boolean', example: 'false' },
];

export const TextRecordEditor: React.FC<TextRecordEditorProps> = ({
  ensName,
  initialRecords,
  onUpdate,
}) => {
  const { address } = useAccount();
  const [records, setRecords] = useState<Record<string, string>>(initialRecords);
  const [customKey, setCustomKey] = useState('');
  const [customValue, setCustomValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  // Contract write
  const { writeContract, isPending: isWriting, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleSave = useCallback(async (key: string, value: string) => {
    if (!address || !ensName) return;

    setError(null);
    setSuccess(null);

    try {
      const resolverAddress = await ensService.getResolver(ensName);
      if (!resolverAddress) {
        setError('No resolver found for this ENS name.');
        return;
      }

      const isOwner = await ensService.isOwner(ensName, address);
      if (!isOwner) {
        setError(`You do not own ${ensName}`);
        return;
      }

      const node = namehash(ensName.toLowerCase().trim());

      writeContract({
        address: resolverAddress,
        abi: ENS_RESOLVER_ABI,
        functionName: 'setText',
        args: [node, key, value],
      });

      // Update local state
      setRecords(prev => ({ ...prev, [key]: value }));
      setEditingKey(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  }, [address, ensName, writeContract]);

  const handleAddCustom = useCallback(() => {
    if (!customKey.trim()) return;
    handleSave(customKey.trim(), customValue);
    setCustomKey('');
    setCustomValue('');
  }, [customKey, customValue, handleSave]);

  React.useEffect(() => {
    if (isSuccess) {
      setSuccess('Transaction confirmed! Text record updated.');
      onUpdate?.();
    }
  }, [isSuccess, onUpdate]);

  const isLoading = isWriting || isConfirming;

  const getInputType = (preset: typeof PRESET_KEYS[0]) => {
    switch (preset.type) {
      case 'boolean':
        return (
          <select
            value={records[preset.key] || 'false'}
            onChange={(e) => setRecords(prev => ({ ...prev, [preset.key]: e.target.value }))}
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        );
      case 'select':
        return (
          <select
            value={records[preset.key] || 'moderate'}
            onChange={(e) => setRecords(prev => ({ ...prev, [preset.key]: e.target.value }))}
            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            {preset.options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      default:
        return (
          <Input
            value={records[preset.key] || ''}
            onChange={(e) => setRecords(prev => ({ ...prev, [preset.key]: e.target.value }))}
            placeholder={preset.example}
          />
        );
    }
  };

  return (
    <Card>
      <CardHeader 
        title="Edit ENS Text Records" 
        subtitle={
          <span>
            Editing <code className="bg-gray-100 px-1 rounded">{ensName}</code> on{' '}
            <Badge variant="primary" size="sm">Sepolia</Badge>
          </span>
        }
      />
      <CardContent>
        <div className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          {success && (
            <Alert variant="success">
              {success}
              {hash && (
                <a
                  href={`https://sepolia.etherscan.io/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline ml-2"
                >
                  View on Etherscan
                </a>
              )}
            </Alert>
          )}

          {/* Info */}
          <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
            <p>Edit your yield intent preferences directly. Each change requires a transaction on Sepolia.</p>
            <a href="https://sepolia-faucet.pk910.de/" target="_blank" rel="noopener noreferrer" className="underline mt-1 inline-block">
              Get Sepolia ETH
            </a>
          </div>

          {/* Preset Keys */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Yield Intent Records</h4>
            {PRESET_KEYS.map((preset) => (
              <div key={preset.key} className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {preset.label}
                    <code className="ml-2 text-gray-400 font-normal">{preset.key}</code>
                  </label>
                  {editingKey === preset.key ? (
                    <div className="space-y-2">
                      {getInputType(preset)}
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleSave(preset.key, records[preset.key] || '')}
                          isLoading={isLoading}
                        >
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingKey(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 truncate">
                        {records[preset.key] ? (
                          <span className="font-mono text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                            {records[preset.key].slice(0, 50)}
                            {records[preset.key].length > 50 ? '...' : ''}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Not set</span>
                        )}
                      </span>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setEditingKey(preset.key)}
                      >
                        {records[preset.key] ? 'Edit' : 'Set'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Custom Record */}
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Add Custom Record</h4>
            <div className="space-y-2">
              <Input
                placeholder="Custom key (e.g., com.myapp.setting)"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
              />
              <Input
                placeholder="Value"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
              />
              <Button 
                onClick={handleAddCustom}
                disabled={!customKey.trim() || isLoading}
                isLoading={isLoading}
                className="w-full"
              >
                Add Custom Record
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
