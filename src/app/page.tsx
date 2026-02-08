'use client';

import { useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { ENSInput, ProfileCard, StrategyFollow, TextRecordEditor } from '@/components/ens';
import { IntentBuilder } from '@/components/lifi';
import { YieldList } from '@/components/yield';
import { Card, Alert, ConnectButton, SepoliaNotice, Logo, Button } from '@/components/ui';
import { useENS, useAppStore } from '@/hooks';
import type { ENSProfile } from '@defi-butler/types';

export default function Home() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { 
    profile, 
    isLoading, 
    error, 
    setInputName, 
    resolveName,
    hasEnsName,
    sepoliaEnsName,
  } = useENS();
  const [activeTab, setActiveTab] = useState<'intent' | 'yields' | 'following' | 'preferences'>('intent');
  
  const followedStrategies = useAppStore((state) => state.followedStrategies);

  const isOwnProfile = profile && address && 
    profile.address.toLowerCase() === address.toLowerCase();

  const isOnSepolia = chainId === sepolia.id;

  const hasPreferences = profile?.preferences && (
    profile.preferences.preferredChains.length > 0 ||
    profile.preferences.whitelistedProtocols.length > 0
  );

  const handleProfileLoaded = async (loadedProfile: ENSProfile) => {
    // Profile loaded
  };

  const handleEditPreferences = () => {
    setActiveTab('preferences');
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo size="md" showText />
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex justify-center mb-6">
              <Logo size="lg" showText={false} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Cross-Chain Yield Intent Manager
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Your personal DeFi butler. Store preferences in ENS on Sepolia, 
              execute cross-chain intents via LI.FI on mainnets.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isConnected ? (
          <Card className="text-center py-16">
            <div className="flex justify-center mb-6">
              <Logo size="lg" showText={false} />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Connect Your Wallet</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Connect MetaMask to access your ENS profile on Sepolia and build cross-chain yield intents.
            </p>
            <div className="flex justify-center gap-4">
              <ConnectButton />
            </div>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - ENS Profile */}
            <div className="space-y-6">
              {/* No ENS Warning */}
              {!hasEnsName && (
                <Card className="border-orange-300 bg-orange-50">
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <h3 className="text-lg font-semibold text-orange-900">
                        No ENS Name Found
                      </h3>
                    </div>
                    <p className="text-sm text-orange-700 mb-4">
                      You need an ENS name on Sepolia to store your yield preferences. 
                      Register one for free using testnet ETH.
                    </p>
                    <div className="flex gap-2">
                      <a
                        href="https://sepolia.app.ens.domains/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        Register ENS
                        <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                      <a
                        href="https://sepolia-faucet.pk910.de/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-white text-orange-700 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors"
                      >
                        Get Sepolia ETH
                      </a>
                    </div>
                  </div>
                </Card>
              )}

              {/* Setup Preferences CTA */}
              {isOwnProfile && hasEnsName && !hasPreferences && (
                <Card className="border-primary-300 bg-primary-50">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-primary-900 mb-2">
                      Set Up Your Preferences
                    </h3>
                    <p className="text-sm text-primary-700 mb-4">
                      You have an ENS name but no preferences set. 
                      Configure your yield strategy to get personalized recommendations.
                    </p>
                    <Button onClick={handleEditPreferences}>
                      Set Up Preferences
                    </Button>
                  </div>
                </Card>
              )}

              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Load ENS Profile
                  </h3>
                  <ENSInput onProfileLoaded={handleProfileLoaded} />
                </div>
              </Card>

              {profile && (
                <ProfileCard 
                  profile={profile} 
                  showPreferences 
                  onEditPreferences={isOwnProfile ? handleEditPreferences : undefined}
                />
              )}

              {followedStrategies.length > 0 && (
                <Card>
                  <div className="p-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Following ({followedStrategies.length})
                    </h3>
                    <div className="space-y-2">
                      {followedStrategies.map((name) => (
                        <div 
                          key={name}
                          className="text-sm text-primary-600 hover:underline cursor-pointer"
                          onClick={() => resolveName(name)}
                        >
                          {name}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Right Column - Main App */}
            <div className="lg:col-span-2 space-y-6">
              {/* Wrong Chain Warning for ENS */}
              {activeTab === 'preferences' && !isOnSepolia && (
                <Alert variant="warning">
                  <span className="font-medium">Switch to Sepolia Required</span>
                  <p className="mt-1">
                    To edit ENS text records, please switch your wallet to Sepolia testnet.
                  </p>
                </Alert>
              )}

              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8">
                  {[
                    { id: 'intent', label: 'New Intent' },
                    { id: 'yields', label: 'Browse Yields' },
                    { id: 'following', label: 'Social Strategy' },
                    ...(isOwnProfile ? [{ id: 'preferences' as const, label: 'Edit Preferences' }] : []),
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              {activeTab === 'intent' && (
                <div className="space-y-6">
                  {profile ? (
                    <IntentBuilder
                      preferences={profile.preferences}
                      userAddress={profile.address}
                      ensName={profile.name}
                    />
                  ) : (
                    <Alert variant="info">
                      <span className="font-medium">Load an ENS Profile</span>
                      <p className="mt-1">
                        Enter an ENS name to see personalized yield recommendations 
                        based on preferences stored in ENS text records.
                      </p>
                    </Alert>
                  )}
                </div>
              )}

              {activeTab === 'yields' && (
                <YieldList
                  preferences={profile?.preferences || {
                    preferredChains: ['base', 'arbitrum', 'optimism'],
                    riskTolerance: 'moderate',
                    maxSlippageBps: 100,
                    defaultAction: 'deposit',
                    whitelistedProtocols: [],
                    blacklistedProtocols: [],
                    minLiquidityUsd: 100000,
                    autoRebalance: false,
                    notificationPrefs: {},
                  }}
                />
              )}

              {activeTab === 'following' && (
                <StrategyFollow currentUserProfile={profile} />
              )}

              {activeTab === 'preferences' && isOwnProfile && profile && (
                <TextRecordEditor 
                  ensName={profile.name} 
                  initialRecords={{}}
                  onUpdate={() => resolveName(profile.name)}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sepolia Notice */}
      <SepoliaNotice />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Logo size="sm" showText={false} />
              <span className="text-sm text-gray-500">
                Built with ENS (Sepolia) and LI.FI (Mainnets)
              </span>
            </div>
            <div className="flex items-center gap-4">
              <a 
                href="https://docs.ens.domains" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ENS Docs
              </a>
              <a 
                href="https://docs.li.fi" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                LI.FI Docs
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
