'use client';

import { useState, useEffect } from 'react';
import { Alert } from './Alert';

export const SepoliaNotice: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the notice
    const dismissed = localStorage.getItem('defi-butler-sepolia-notice');
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('defi-butler-sepolia-notice', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-md z-50">
      <Alert variant="info" title="ENS on Sepolia Testnet">
        <div className="space-y-2">
          <p>
            ENS features use Sepolia testnet for free testing. 
            Your ENS name and text records are stored on Sepolia, not mainnet.
          </p>
          <p className="text-sm">
            LI.FI bridging operates on mainnets (Arbitrum, Base, etc.) for real cross-chain functionality.
          </p>
          <div className="flex gap-2 mt-3">
            <a
              href="https://sepolia.app.ens.domains/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm underline hover:no-underline"
            >
              Get Sepolia ETH
            </a>
            <button
              onClick={handleDismiss}
              className="text-sm underline hover:no-underline ml-auto"
            >
              Dismiss
            </button>
          </div>
        </div>
      </Alert>
    </div>
  );
};
