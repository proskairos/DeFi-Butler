import React, { useState, useCallback } from 'react';
import { Input, Button, Alert } from '@/components/ui';
import { isValidEnsName, formatEnsName } from '@/lib/utils';
import { ensService } from '@/services/ensService';
import type { ENSProfile } from '@defi-butler/types';

interface ENSInputProps {
  onProfileLoaded: (profile: ENSProfile) => void;
  initialValue?: string;
  placeholder?: string;
}

export const ENSInput: React.FC<ENSInputProps> = ({
  onProfileLoaded,
  initialValue = '',
  placeholder = 'alice.eth',
}) => {
  const [input, setInput] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setError(null);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidEnsName(input)) {
      setError('Please enter a valid ENS name (e.g., alice.eth)');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const profile = await ensService.getProfile(input);
      
      if (!profile) {
        setError(`ENS name "${input}" not found or not registered`);
        return;
      }

      onProfileLoaded(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve ENS name');
    } finally {
      setIsLoading(false);
    }
  }, [input, onProfileLoaded]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="flex-1"
          leftIcon={
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
        />
        <Button 
          type="submit" 
          isLoading={isLoading}
          disabled={!input.trim()}
        >
          Load
        </Button>
      </div>
      
      {error && <Alert variant="error">{error}</Alert>}
    </form>
  );
};
