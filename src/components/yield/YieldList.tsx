import React from 'react';
import { Card, CardHeader, CardContent, Loading, Alert } from '@/components/ui';
import { YieldCard } from './YieldCard';
import { useYield } from '@/hooks';
import type { UserPreferences } from '@defi-butler/types';

interface YieldListProps {
  chainId?: number;
  token?: string;
  preferences: UserPreferences;
  onSelect?: (opportunityId: string) => void;
  selectedId?: string;
  limit?: number;
}

export const YieldList: React.FC<YieldListProps> = ({
  chainId,
  token,
  preferences,
  onSelect,
  selectedId,
  limit = 10,
}) => {
  const { opportunities, isLoading, error, fetchYields } = useYield();

  React.useEffect(() => {
    fetchYields({
      chainId,
      token,
      riskTolerance: preferences.riskTolerance,
      minTvlUsd: preferences.minLiquidityUsd,
      whitelistedProtocols: preferences.whitelistedProtocols,
      blacklistedProtocols: preferences.blacklistedProtocols,
      limit,
    });
  }, [chainId, token, preferences, limit, fetchYields]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader title="Yield Opportunities" />
        <CardContent>
          <div className="flex justify-center py-12">
            <Loading size="lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader title="Yield Opportunities" />
        <CardContent>
          <Alert variant="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  if (opportunities.length === 0) {
    return (
      <Card>
        <CardHeader title="Yield Opportunities" />
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <svg 
              className="mx-auto h-12 w-12 text-gray-300 mb-3" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" 
              />
            </svg>
            <p>No yield opportunities found matching your criteria</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader 
        title="Yield Opportunities" 
        subtitle={`Found ${opportunities.length} opportunities matching your preferences`}
      />
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {opportunities.map((opportunity) => (
            <YieldCard
              key={opportunity.id}
              opportunity={opportunity}
              isSelected={selectedId === opportunity.id}
              onSelect={() => onSelect?.(opportunity.id)}
              isCompact
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
