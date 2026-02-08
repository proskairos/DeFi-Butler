import { useState, useCallback, useEffect } from 'react';
import { useAccount, useEnsName } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import type { ENSProfile, UserPreferences } from '@/types';
import { ensService } from '@/services/ensService';
import { isValidEnsName } from '@/lib/utils';

interface UseENSReturn {
  // State
  profile: ENSProfile | null;
  isLoading: boolean;
  error: string | null;
  inputName: string;
  hasEnsName: boolean;
  sepoliaEnsName: string | null | undefined;
  
  // Actions
  setInputName: (name: string) => void;
  resolveName: (name: string) => Promise<ENSProfile | null>;
  loadConnectedUserProfile: () => Promise<void>;
  clearProfile: () => void;
  
  // Derived
  isValidInput: boolean;
  isOwnProfile: boolean;
}

/**
 * Hook for ENS operations on Sepolia
 */
export function useENS(): UseENSReturn {
  const { address, isConnected } = useAccount();
  
  // Get ENS name from Sepolia
  const { data: sepoliaEnsName, isLoading: isEnsLoading } = useEnsName({
    address,
    chainId: sepolia.id,
  });
  
  // Local state
  const [profile, setProfile] = useState<ENSProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputName, setInputNameState] = useState('');

  /**
   * Resolve an ENS name and load its profile
   */
  const resolveName = useCallback(async (name: string): Promise<ENSProfile | null> => {
    if (!name || !isValidEnsName(name)) {
      setError('Invalid ENS name');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const resolvedProfile = await ensService.getProfile(name);
      
      if (!resolvedProfile) {
        setError(`ENS name "${name}" not found on Sepolia testnet`);
        setProfile(null);
        return null;
      }

      setProfile(resolvedProfile);
      return resolvedProfile;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resolve ENS';
      setError(message);
      setProfile(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Load profile for the currently connected user
   */
  const loadConnectedUserProfile = useCallback(async () => {
    if (!sepoliaEnsName) {
      setError('No ENS name found for your address on Sepolia. Register one at https://sepolia.app.ens.domains/');
      return;
    }

    await resolveName(sepoliaEnsName);
  }, [sepoliaEnsName, resolveName]);

  /**
   * Clear the current profile
   */
  const clearProfile = useCallback(() => {
    setProfile(null);
    setError(null);
    setInputNameState('');
  }, []);

  /**
   * Set input name with validation
   */
  const setInputName = useCallback((name: string) => {
    setInputNameState(name);
    setError(null);
  }, []);

  /**
   * Auto-load connected user's profile on mount
   */
  useEffect(() => {
    if (sepoliaEnsName && !profile && !isLoading && isConnected) {
      resolveName(sepoliaEnsName);
    }
  }, [sepoliaEnsName, profile, isLoading, isConnected, resolveName]);

  // Derived state
  const isValidInput = isValidEnsName(inputName);
  const isOwnProfile = !!(
    profile && 
    address && 
    profile.address.toLowerCase() === address.toLowerCase()
  );
  const hasEnsName = !!sepoliaEnsName;

  return {
    // State
    profile,
    isLoading,
    error,
    inputName,
    hasEnsName,
    sepoliaEnsName,
    
    // Actions
    setInputName,
    resolveName,
    loadConnectedUserProfile,
    clearProfile,
    
    // Derived
    isValidInput,
    isOwnProfile,
  };
}

interface UseENSPreferencesReturn {
  preferences: UserPreferences | null;
  isLoading: boolean;
  error: string | null;
  followedProfile: ENSProfile | null;
}

/**
 * Hook to get preferences from an ENS profile
 */
export function useENSPreferences(ensName: string | null): UseENSPreferencesReturn {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [followedProfile, setFollowedProfile] = useState<ENSProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ensName) {
      setPreferences(null);
      setFollowedProfile(null);
      return;
    }

    const loadPreferences = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const profile = await ensService.getProfile(ensName);
        
        if (!profile) {
          setError('Profile not found on Sepolia');
          return;
        }

        setPreferences(profile.preferences);

        // If following a strategy, load that profile too
        if (profile.isFollowingStrategy && profile.followedStrategyOwner) {
          const followed = await ensService.getProfile(profile.followedStrategyOwner);
          setFollowedProfile(followed);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load preferences');
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [ensName]);

  return {
    preferences,
    isLoading,
    error,
    followedProfile,
  };
}
