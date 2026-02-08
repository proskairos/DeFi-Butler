import React from 'react';
import { Card, CardContent, Badge, RiskBadge, Button } from '@/components/ui';
import type { YieldOpportunity } from '@defi-butler/types';
import { formatApy, formatUsd, formatAddress, CHAIN_ID_TO_NAME } from '@/lib/utils';

interface YieldCardProps {
  opportunity: YieldOpportunity;
  isSelected?: boolean;
  onSelect?: () => void;
  showSelect?: boolean;
  isCompact?: boolean;
}

export const YieldCard: React.FC<YieldCardProps> = ({
  opportunity,
  isSelected = false,
  onSelect,
  showSelect = true,
  isCompact = false,
}) => {
  const { protocol, chainName, token, apy, tvlUsd, riskLevel, metadata } = opportunity;

  if (isCompact) {
    return (
      <div
        className={`p-3 rounded-lg border cursor-pointer transition-all ${
          isSelected
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}
        onClick={onSelect}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {metadata.protocolIcon && (
              <img
                src={metadata.protocolIcon}
                alt={protocol}
                className="h-6 w-6 rounded-full"
              />
            )}
            <div>
              <p className="font-medium text-sm">{protocol}</p>
              <p className="text-xs text-gray-500">{token}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-green-600">{formatApy(apy)}</p>
            <p className="text-xs text-gray-500">{formatUsd(tvlUsd)} TVL</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className={isSelected ? 'ring-2 ring-primary-500' : ''}>
      <CardContent>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {metadata.protocolIcon && (
              <img
                src={metadata.protocolIcon}
                alt={protocol}
                className="h-10 w-10 rounded-full"
              />
            )}
            <div>
              <p className="font-semibold text-gray-900">{metadata.vaultName}</p>
              <p className="text-sm text-gray-500">
                {protocol} on {chainName}
              </p>
            </div>
          </div>
          <RiskBadge level={riskLevel} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">APY</p>
            <p className="text-xl font-bold text-green-600">{formatApy(apy)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">TVL</p>
            <p className="text-xl font-bold text-gray-900">{formatUsd(tvlUsd)}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Badge variant="default" size="sm">{token}</Badge>
          {metadata.isAudited && (
            <Badge variant="success" size="sm">Audited</Badge>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 font-mono">
            Vault: {formatAddress(opportunity.vaultAddress)}
          </p>
        </div>

        {showSelect && (
          <Button
            onClick={onSelect}
            variant={isSelected ? 'secondary' : 'primary'}
            className="w-full mt-4"
          >
            {isSelected ? 'Selected' : 'Select'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
