import { type ClassValue, clsx } from 'clsx';
import { formatUnits, parseUnits } from 'viem';

// Tailwind class merger (if clsx is installed, otherwise simple join)
export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(' ');
}

// Format token amount with decimals
export function formatTokenAmount(amount: bigint, decimals: number, precision = 4): string {
  const formatted = formatUnits(amount, decimals);
  const num = parseFloat(formatted);
  
  if (num === 0) return '0';
  if (num < 0.0001) return '< 0.0001';
  if (num < 1) return num.toFixed(6);
  if (num < 1000) return num.toFixed(precision);
  if (num < 1000000) return `${(num / 1000).toFixed(2)}K`;
  if (num < 1000000000) return `${(num / 1000000).toFixed(2)}M`;
  return `${(num / 1000000000).toFixed(2)}B`;
}

// Parse token amount to bigint
export function parseTokenAmount(amount: string, decimals: number): bigint {
  try {
    return parseUnits(amount, decimals);
  } catch {
    return BigInt(0);
  }
}

// Format USD value
export function formatUsd(value: number, showCents = true): string {
  if (value === 0) return '$0';
  if (value < 0.01) return '< $0.01';
  if (value < 1000) return `$${value.toFixed(showCents ? 2 : 0)}`;
  if (value < 1000000) return `$${(value / 1000).toFixed(2)}K`;
  if (value < 1000000000) return `$${(value / 1000000).toFixed(2)}M`;
  return `$${(value / 1000000000).toFixed(2)}B`;
}

// Format APY percentage
export function formatApy(apy: number): string {
  if (apy === 0) return '0%';
  if (apy < 0.01) return '< 0.01%';
  if (apy < 1) return `${(apy * 100).toFixed(4)}%`;
  return `${(apy * 100).toFixed(2)}%`;
}

// Format address for display
export function formatAddress(address: string, chars = 4): string {
  if (!address || address.length < 2 + chars * 2) return address;
  return `${address.slice(0, 2 + chars)}...${address.slice(-chars)}`;
}

// Truncate ENS name if too long
export function formatEnsName(name: string, maxLength = 20): string {
  if (!name || name.length <= maxLength) return name;
  const [label, ...rest] = name.split('.');
  if (label.length > maxLength - 4) {
    return `${label.slice(0, maxLength - 4)}...${rest.length > 0 ? '.' + rest.join('.') : ''}`;
  }
  return name;
}

// Sleep utility
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Retry wrapper with exponential backoff
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; delayMs?: number; backoff?: number } = {}
): Promise<T> {
  const { maxRetries = 3, delayMs = 1000, backoff = 2 } = options;
  
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = delayMs * Math.pow(backoff, attempt);
      await sleep(delay);
    }
  }
  
  throw lastError;
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Chain ID to name mapping (reverse of config)
export const CHAIN_ID_TO_NAME: Record<number, string> = {
  1: 'Ethereum',
  10: 'Optimism',
  137: 'Polygon',
  42161: 'Arbitrum',
  8453: 'Base',
  81457: 'Blast',
  59144: 'Linea',
  534352: 'Scroll',
};

// Chain name to ID
export const CHAIN_NAME_TO_ID: Record<string, number> = Object.entries(CHAIN_ID_TO_NAME).reduce(
  (acc, [id, name]) => ({ ...acc, [name.toLowerCase()]: parseInt(id) }),
  {}
);

// Get chain color for UI
export function getChainColor(chainId: number): string {
  const colors: Record<number, string> = {
    1: '#627EEA',
    10: '#FF0420',
    137: '#8247E5',
    42161: '#28A0F0',
    8453: '#0052FF',
    81457: '#FCFC03',
    59144: '#61DFFF',
    534352: '#E5D07F',
  };
  return colors[chainId] || '#888888';
}

// Validate ENS name format
export function isValidEnsName(name: string): boolean {
  // Basic ENS validation - ends with .eth or other supported TLDs
  const validTlds = ['.eth', '.xyz', '.luxe', '.kred', '.art'];
  return validTlds.some((tld) => name.toLowerCase().endsWith(tld));
}

// Safe JSON parse
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}
