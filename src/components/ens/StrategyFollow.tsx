import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardContent, Input, Button, Alert, Badge } from '@/components/ui';
import { ensService } from '@/services/ensService';
import { isValidEnsName, formatEnsName } from '@/lib/utils';
import type { ENSProfile } from '@defi-butler/types';
import { useAppStore } from '@/hooks';

interface StrategyFollowProps {
  currentUserProfile?: ENSProfile | null;
}

export const StrategyFollow: React.FC<StrategyFollowProps> = ({
  currentUserProfile,
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewProfile, setPreviewProfile] = useState<ENSProfile | null>(null);

  const { followedStrategies, followStrategy, unfollowStrategy } = useAppStore();

  const handleSearch = useCallback(async () => {
    if (!isValidEnsName(input)) {
      setError('Please enter a valid ENS name');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const profile = await ensService.getProfile(input);
      if (!profile) {
        setError('ENS name not found');
        return;
      }
      setPreviewProfile(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [input]);

  const handleFollow = useCallback(() => {
    if (previewProfile) {
      followStrategy(previewProfile.name);
      setInput('');
      setPreviewProfile(null);
    }
  }, [previewProfile, followStrategy]);

  const handleUnfollow = useCallback((name: string) => {
    unfollowStrategy(name);
  }, [unfollowStrategy]);

  return (
    <Card>
      <CardHeader 
        title="Follow Strategies" 
        subtitle="Mirror the DeFi strategy of any ENS user"
      />
      
      <CardContent>
        {/* Search */}
        <div className="flex gap-2 mb-6">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="vitalik.eth"
            className="flex-1"
          />
          <Button 
            onClick={handleSearch}
            isLoading={isLoading}
            disabled={!input.trim()}
          >
            Search
          </Button>
        </div>

        {error && <Alert variant="error" className="mb-4">{error}</Alert>}

        {/* Preview */}
        {previewProfile && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  {formatEnsName(previewProfile.name)}
                </p>
                <p className="text-sm text-gray-500">
                  Risk: {previewProfile.preferences.riskTolerance} | 
                  Slippage: {(previewProfile.preferences.maxSlippageBps / 100).toFixed(2)}%
                </p>
              </div>
              <Button
                onClick={handleFollow}
                variant="secondary"
                size="sm"
                disabled={followedStrategies.includes(previewProfile.name)}
              >
                {followedStrategies.includes(previewProfile.name) ? 'Following' : 'Follow'}
              </Button>
            </div>
          </div>
        )}

        {/* Following List */}
        {followedStrategies.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">You are following:</p>
            <div className="space-y-2">
              {followedStrategies.map((name) => (
                <div 
                  key={name}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="font-medium">{formatEnsName(name)}</span>
                  <Button
                    onClick={() => handleUnfollow(name)}
                    variant="ghost"
                    size="sm"
                  >
                    Unfollow
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {followedStrategies.length === 0 && !previewProfile && (
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
              />
            </svg>
            <p>Search for an ENS user to follow their strategy</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
