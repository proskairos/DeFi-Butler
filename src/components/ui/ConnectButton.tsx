'use client';

import { useAccount, useConnect, useDisconnect, useEnsName, useChainId, useSwitchChain } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { Button } from './Button';
import { formatAddress } from '@/lib/utils';

export const ConnectButton: React.FC = () => {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors, error } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  
  // Get ENS name from Sepolia
  const { data: ensName, isLoading: isEnsLoading } = useEnsName({
    address,
    chainId: sepolia.id,
  });

  const metaMaskConnector = connectors.find((c) => c.id === 'io.metamask') || connectors[0];
  const isWrongChain = chainId !== sepolia.id && isConnected;

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        {/* ENS Status */}
        <div className="hidden sm:flex flex-col items-end mr-2">
          {isEnsLoading ? (
            <span className="text-xs text-gray-400">Loading ENS...</span>
          ) : ensName ? (
            <span className="text-sm font-medium text-ens-700">{ensName}</span>
          ) : (
            <a
              href="https://sepolia.app.ens.domains/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-orange-600 hover:underline"
            >
              No ENS - Register
            </a>
          )}
          <span className="text-xs text-gray-500">
            {formatAddress(address)}
          </span>
        </div>

        {/* Mobile view - just show address */}
        <span className="sm:hidden text-sm text-gray-600">
          {formatAddress(address)}
        </span>

        {/* Wrong Chain Warning */}
        {isWrongChain && (
          <Button
            variant="warning"
            size="sm"
            onClick={() => switchChain?.({ chainId: sepolia.id })}
          >
            Switch to Sepolia
          </Button>
        )}

        <Button variant="outline" size="sm" onClick={() => disconnect()}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={() => connect({ connector: metaMaskConnector })}
        isLoading={isConnecting}
        disabled={isConnecting}
      >
        {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
      </Button>
      {error && (
        <span className="text-xs text-red-500 max-w-[200px]">
          {error.message}
        </span>
      )}
    </div>
  );
};
