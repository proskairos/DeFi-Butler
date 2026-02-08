import React from 'react';
import { Card, CardHeader, CardContent, Badge, Button } from '@/components/ui';
import type { IntentExecution, ExecutionStep } from '@/types';
import { formatAddress } from '@/lib/utils';

interface ExecutionStatusProps {
  execution: IntentExecution;
  onClose?: () => void;
}

export const ExecutionStatus: React.FC<ExecutionStatusProps> = ({
  execution,
  onClose,
}) => {
  const { intent, steps, status, error } = execution;

  const getStepIcon = (step: ExecutionStep) => {
    if (step.status === 'completed') {
      return (
        <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    }
    if (step.status === 'failed') {
      return (
        <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      );
    }
    if (step.status === 'in-progress') {
      return (
        <svg className="h-5 w-5 text-primary-500 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      );
    }
    return (
      <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
    );
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'failed':
        return <Badge variant="error">Failed</Badge>;
      case 'executing':
        return <Badge variant="primary">Executing</Badge>;
      default:
        return <Badge>Pending</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader
        title="Execution Status"
        subtitle={`Intent: ${intent.fromToken} on ${intent.fromChain} → ${intent.toToken} on ${intent.toChain}`}
        action={getStatusBadge()}
      />
      
      <CardContent>
        {/* Summary */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">From:</span>{' '}
              <span className="font-medium">{intent.fromToken} on Chain {intent.fromChain}</span>
            </div>
            <div>
              <span className="text-gray-500">To:</span>{' '}
              <span className="font-medium">{intent.toToken} on Chain {intent.toChain}</span>
            </div>
            <div>
              <span className="text-gray-500">Amount:</span>{' '}
              <span className="font-medium">{intent.fromAmount}</span>
            </div>
            <div>
              <span className="text-gray-500">Target APY:</span>{' '}
              <span className="font-medium text-green-600">
                {(intent.expectedApy * 100).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg border border-gray-100"
            >
              <div className="flex-shrink-0 mt-0.5">{getStepIcon(step)}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">
                  {step.type.charAt(0).toUpperCase() + step.type.slice(1)}
                </p>
                <p className="text-sm text-gray-500">{step.message}</p>
                {step.txHash && (
                  <a
                    href={step.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary-600 hover:underline"
                  >
                    View: {formatAddress(step.txHash)}
                  </a>
                )}
              </div>
              <div className="text-xs text-gray-400">
                {new Date(step.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              <span className="font-medium">Error: </span>
              {error}
            </p>
          </div>
        )}

        {/* Close Button */}
        {(status === 'completed' || status === 'failed') && onClose && (
          <div className="mt-6">
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
