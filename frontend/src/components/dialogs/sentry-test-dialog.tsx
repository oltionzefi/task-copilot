import React, { useState } from 'react';
import * as Sentry from '@sentry/react';
import { Button } from '@/components/ui/button';

/**
 * SentryTestDialog - A dialog component for testing Sentry integration
 * This component provides buttons to trigger different types of errors and events
 * to verify that Sentry is properly configured and capturing events.
 */
export const SentryTestDialog: React.FC = () => {
  const [lastAction, setLastAction] = useState<string>('');

  const handleCaptureMessage = () => {
    Sentry.captureMessage('Test message from Sentry Test Dialog', 'info');
    setLastAction('Captured test message - check Sentry UI');
  };

  const handleCaptureError = () => {
    try {
      throw new Error('Test error from Sentry Test Dialog');
    } catch (error) {
      Sentry.captureException(error);
      setLastAction('Captured test error - check Sentry UI');
    }
  };

  const handleThrowError = () => {
    // This will be caught by the ErrorBoundary
    throw new Error('Uncaught error to test ErrorBoundary');
  };

  const handleCaptureWarning = () => {
    Sentry.captureMessage('Test warning from Sentry Test Dialog', 'warning');
    setLastAction('Captured test warning - check Sentry UI');
  };

  const handleCaptureWithContext = () => {
    Sentry.captureException(new Error('Error with custom context'), {
      level: 'error',
      tags: {
        test_type: 'context_test',
        component: 'SentryTestDialog',
      },
      extra: {
        timestamp: new Date().toISOString(),
        user_action: 'manual_test',
      },
    });
    setLastAction('Captured error with context - check Sentry UI');
  };

  const isDsnConfigured = !!import.meta.env.VITE_SENTRY_DSN;

  return (
    <div className="space-y-4 p-6 border rounded-lg bg-background">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Sentry Integration Test</h2>
        <p className="text-muted-foreground">
          Use these buttons to test if Sentry is properly configured and
          capturing events.
        </p>
        <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
          <div
            className={`w-3 h-3 rounded-full ${
              isDsnConfigured ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-sm font-medium">
            Sentry DSN: {isDsnConfigured ? 'Configured' : 'Not Configured'}
          </span>
        </div>
        {!isDsnConfigured && (
          <div className="p-3 border border-yellow-500 rounded-md bg-yellow-50 dark:bg-yellow-950">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Warning:</strong> VITE_SENTRY_DSN is not configured. Add
              it to your .env file to enable Sentry.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Test Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Button
            onClick={handleCaptureMessage}
            variant="outline"
            disabled={!isDsnConfigured}
          >
            Send Test Message
          </Button>
          <Button
            onClick={handleCaptureError}
            variant="outline"
            disabled={!isDsnConfigured}
          >
            Send Test Error
          </Button>
          <Button
            onClick={handleCaptureWarning}
            variant="outline"
            disabled={!isDsnConfigured}
          >
            Send Test Warning
          </Button>
          <Button
            onClick={handleCaptureWithContext}
            variant="outline"
            disabled={!isDsnConfigured}
          >
            Send Error with Context
          </Button>
          <Button
            onClick={handleThrowError}
            variant="destructive"
            disabled={!isDsnConfigured}
          >
            Throw Error (Tests ErrorBoundary)
          </Button>
        </div>
      </div>

      {lastAction && (
        <div className="p-3 border rounded-md bg-muted">
          <p className="text-sm">
            <strong>Last Action:</strong> {lastAction}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Check your Sentry UI at{' '}
            <a
              href="http://localhost:9000"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              http://localhost:9000
            </a>{' '}
            to see the captured event.
          </p>
        </div>
      )}

      <div className="space-y-2 text-sm text-muted-foreground">
        <p>
          <strong>How to use:</strong>
        </p>
        <ol className="list-decimal list-inside space-y-1 pl-2">
          <li>Make sure Sentry is running (pnpm run sentry:start)</li>
          <li>Configure VITE_SENTRY_DSN in your .env file</li>
          <li>Restart the dev server</li>
          <li>Click any button above</li>
          <li>
            Open Sentry UI at{' '}
            <a
              href="http://localhost:9000"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              http://localhost:9000
            </a>
          </li>
          <li>Check the Issues section for captured events</li>
        </ol>
      </div>
    </div>
  );
};
