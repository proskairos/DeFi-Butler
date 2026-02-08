import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ENSProfile, UserPreferences, YieldOpportunity } from '@/types';

// App state interface
interface AppState {
  // User session
  currentProfile: ENSProfile | null;
  isLoadingProfile: boolean;
  profileError: string | null;
  
  // Preferences (cached locally for quick access)
  cachedPreferences: UserPreferences | null;
  
  // Intent builder state
  intentBuilder: {
    fromChain: number | null;
    fromToken: string | null;
    fromAmount: string;
    toChain: number | null;
    toToken: string | null;
    selectedYield: YieldOpportunity | null;
    step: 'input' | 'review' | 'executing' | 'complete';
  };
  
  // Social following
  followedStrategies: string[]; // List of ENS names user follows
  
  // UI state
  ui: {
    showPreferencesModal: boolean;
    showFollowingModal: boolean;
    activeChain: number | null;
  };
  
  // Actions
  setCurrentProfile: (profile: ENSProfile | null) => void;
  setIsLoadingProfile: (loading: boolean) => void;
  setProfileError: (error: string | null) => void;
  setCachedPreferences: (prefs: UserPreferences | null) => void;
  
  // Intent builder actions
  setIntentFrom: (chain: number, token: string, amount: string) => void;
  setIntentTo: (chain: number, token: string) => void;
  setSelectedYield: (yieldOp: YieldOpportunity | null) => void;
  setIntentStep: (step: AppState['intentBuilder']['step']) => void;
  resetIntentBuilder: () => void;
  
  // Social actions
  followStrategy: (ensName: string) => void;
  unfollowStrategy: (ensName: string) => void;
  
  // UI actions
  setShowPreferencesModal: (show: boolean) => void;
  setShowFollowingModal: (show: boolean) => void;
  setActiveChain: (chain: number | null) => void;
  
  // Reset
  reset: () => void;
}

const initialIntentBuilder = {
  fromChain: null,
  fromToken: null,
  fromAmount: '',
  toChain: null,
  toToken: null,
  selectedYield: null,
  step: 'input' as const,
};

const initialUI = {
  showPreferencesModal: false,
  showFollowingModal: false,
  activeChain: null,
};

/**
 * Global app state store using Zustand
 * Persists user preferences and followed strategies
 */
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentProfile: null,
      isLoadingProfile: false,
      profileError: null,
      cachedPreferences: null,
      intentBuilder: { ...initialIntentBuilder },
      followedStrategies: [],
      ui: { ...initialUI },

      // Actions
      setCurrentProfile: (profile) => {
        set({ 
          currentProfile: profile,
          cachedPreferences: profile?.preferences || null,
        });
      },

      setIsLoadingProfile: (loading) => set({ isLoadingProfile: loading }),
      setProfileError: (error) => set({ profileError: error }),
      setCachedPreferences: (prefs) => set({ cachedPreferences: prefs }),

      // Intent builder actions
      setIntentFrom: (chain, token, amount) => {
        set((state) => ({
          intentBuilder: {
            ...state.intentBuilder,
            fromChain: chain,
            fromToken: token,
            fromAmount: amount,
          },
        }));
      },

      setIntentTo: (chain, token) => {
        set((state) => ({
          intentBuilder: {
            ...state.intentBuilder,
            toChain: chain,
            toToken: token,
          },
        }));
      },

      setSelectedYield: (yieldOp) => {
        set((state) => ({
          intentBuilder: {
            ...state.intentBuilder,
            selectedYield: yieldOp,
          },
        }));
      },

      setIntentStep: (step) => {
        set((state) => ({
          intentBuilder: {
            ...state.intentBuilder,
            step,
          },
        }));
      },

      resetIntentBuilder: () => {
        set({ intentBuilder: { ...initialIntentBuilder } });
      },

      // Social actions
      followStrategy: (ensName) => {
        const { followedStrategies } = get();
        if (!followedStrategies.includes(ensName)) {
          set({ followedStrategies: [...followedStrategies, ensName] });
        }
      },

      unfollowStrategy: (ensName) => {
        const { followedStrategies } = get();
        set({
          followedStrategies: followedStrategies.filter((name) => name !== ensName),
        });
      },

      // UI actions
      setShowPreferencesModal: (show) => {
        set((state) => ({
          ui: { ...state.ui, showPreferencesModal: show },
        }));
      },

      setShowFollowingModal: (show) => {
        set((state) => ({
          ui: { ...state.ui, showFollowingModal: show },
        }));
      },

      setActiveChain: (chain) => {
        set((state) => ({
          ui: { ...state.ui, activeChain: chain },
        }));
      },

      // Reset
      reset: () => {
        set({
          currentProfile: null,
          isLoadingProfile: false,
          profileError: null,
          cachedPreferences: null,
          intentBuilder: { ...initialIntentBuilder },
          // Keep followedStrategies and ui preferences
        });
      },
    }),
    {
      name: 'defi-butler-storage',
      partialize: (state) => ({
        // Only persist these fields
        cachedPreferences: state.cachedPreferences,
        followedStrategies: state.followedStrategies,
        ui: {
          ...state.ui,
          showPreferencesModal: false, // Don't persist modal states
          showFollowingModal: false,
        },
      }),
    }
  )
);

// Selectors for better performance
export const selectCurrentProfile = (state: AppState) => state.currentProfile;
export const selectCachedPreferences = (state: AppState) => state.cachedPreferences;
export const selectIntentBuilder = (state: AppState) => state.intentBuilder;
export const selectFollowedStrategies = (state: AppState) => state.followedStrategies;
export const selectUI = (state: AppState) => state.ui;
