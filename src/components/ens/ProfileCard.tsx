'use client';

import React from 'react';
import { useAccount } from 'wagmi';
import { Card, CardHeader, CardContent, Badge, RiskBadge, Button } from '@/components/ui';
import { formatAddress, formatEnsName } from '@/lib/utils';
import type { ENSProfile } from '@/types';

interface ProfileCardProps {
  profile: ENSProfile;
  showPreferences?: boolean;
  isCompact?: boolean;
  onEditPreferences?: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  showPreferences = true,
  isCompact = false,
  onEditPreferences,
}) => {
  const { address: connectedAddress } = useAccount();
  const { preferences, isFollowingStrategy, followedStrategyOwner } = profile;
  
  // Check if this is the user's own profile
  const isOwnProfile = connectedAddress && 
    profile.address.toLowerCase() === connectedAddress.toLowerCase();

  // Check if preferences are default/empty
  const hasCustomPreferences = 
    preferences.preferredChains.length > 0 ||
    preferences.whitelistedProtocols.length > 0 ||
    preferences.maxSlippageBps !== 100 ||
    preferences.minLiquidityUsd !== 100000;

  if (isCompact) {
    return (
      <div className="flex items-center gap-3">
        {profile.avatar ? (
          <img
            src={profile.avatar}
            alt={profile.name}
            className="h-10 w-10 rounded-full"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-ens-100 flex items-center justify-center">
            <span className="text-ens-700 font-bold text-lg">
              {profile.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <p className="font-medium text-gray-900">{formatEnsName(profile.name)}</p>
          <p className="text-sm text-gray-500">{formatAddress(profile.address)}</p>
        </div>
        {isFollowingStrategy && (
          <Badge variant="ens" size="sm">Following</Badge>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader
        title={formatEnsName(profile.name)}
        subtitle={formatAddress(profile.address)}
        action={isOwnProfile ? <Badge variant="success">Your Profile</Badge> : null}
      />
      
      <CardContent>
        {isFollowingStrategy && followedStrategyOwner && (
          <div className="mb-4 p-3 bg-ens-50 rounded-lg">
            <p className="text-sm text-ens-800">
              Following strategy from{' '}
              <span className="font-medium">{followedStrategyOwner}</span>
            </p>
          </div>
        )}

        {showPreferences && (
          <div className="space-y-4">
            {/* No Preferences Warning */}
            {!hasCustomPreferences && isOwnProfile && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm font-medium text-orange-800 mb-2">
                  No Preferences Set
                </p>
                <p className="text-xs text-orange-600 mb-3">
                  Set up your yield preferences to get personalized recommendations.
                </p>
                {onEditPreferences && (
                  <Button onClick={onEditPreferences} size="sm" variant="warning">
                    Set Up Preferences
                  </Button>
                )}
              </div>
            )}

            {/* Following Warning */}
            {!hasCustomPreferences && !isOwnProfile && !isFollowingStrategy && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  This user has no custom preferences set.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Risk Tolerance</p>
                <RiskBadge level={preferences.riskTolerance === 'conservative' ? 'low' : 
                                  preferences.riskTolerance === 'moderate' ? 'medium' : 'high'} />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Max Slippage</p>
                <p className="font-medium">{(preferences.maxSlippageBps / 100).toFixed(2)}%</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Preferred Chains</p>
              <div className="flex flex-wrap gap-2">
                {preferences.preferredChains.length > 0 ? (
                  preferences.preferredChains.map((chain) => (
                    <Badge key={chain} variant="primary" size="sm">
                      {chain.charAt(0).toUpperCase() + chain.slice(1)}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-gray-400">Not set</span>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Whitelisted Protocols</p>
              <div className="flex flex-wrap gap-2">
                {preferences.whitelistedProtocols.length > 0 ? (
                  <>
                    {preferences.whitelistedProtocols.slice(0, 6).map((protocol) => (
                      <Badge key={protocol} variant="default" size="sm">
                        {protocol}
                      </Badge>
                    ))}
                    {preferences.whitelistedProtocols.length > 6 && (
                      <Badge variant="default" size="sm">
                        +{preferences.whitelistedProtocols.length - 6} more
                      </Badge>
                    )}
                  </>
                ) : (
                  <span className="text-sm text-gray-400">Not set (using defaults)</span>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Min. Liquidity</p>
              <p className="font-medium">
                ${preferences.minLiquidityUsd.toLocaleString()}
              </p>
            </div>

            {isOwnProfile && onEditPreferences && hasCustomPreferences && (
              <Button onClick={onEditPreferences} variant="outline" className="w-full mt-4">
                Edit Preferences
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
