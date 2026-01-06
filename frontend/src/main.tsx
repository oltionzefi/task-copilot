import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './styles/index.css';
import { ClickToComponent } from 'click-to-react-component';
import { VibeKanbanWebCompanion } from 'vibe-kanban-web-companion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from '@sentry/react';
import i18n from './i18n';
// Import modal type definitions
import './types/modals';

import {
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
} from 'react-router-dom';

const sentryDsn = import.meta.env.VITE_SENTRY_DSN || '';
const isSentryEnabled = Boolean(sentryDsn);

try {
  Sentry.init({
    dsn: sentryDsn,
    enabled: isSentryEnabled,
    tracesSampleRate: 1.0,
    environment: import.meta.env.MODE === 'development' ? 'dev' : 'production',
    integrations: [
      Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect: React.useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),
    ],
    beforeSend(event) {
      // If Sentry API has issues, fail gracefully
      return event;
    },
  });
  
  if (isSentryEnabled) {
    Sentry.setTag('source', 'frontend');
  }
} catch (error) {
  // Fail silently if Sentry initialization fails
  console.warn('Sentry initialization failed:', error);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode> // Temporarily disabled to reduce WebSocket noise in dev
    <QueryClientProvider client={queryClient}>
      <Sentry.ErrorBoundary
        fallback={<p>{i18n.t('common:states.error')}</p>}
        showDialog={isSentryEnabled}
        onError={(error) => {
          // Log to console if Sentry fails
          console.error('Error caught by boundary:', error);
        }}
      >
        <ClickToComponent />
        <VibeKanbanWebCompanion />
        <App />
        {/*<TanStackDevtools plugins={[FormDevtoolsPlugin()]} />*/}
        {/* <ReactQueryDevtools initialIsOpen={false} /> */}
      </Sentry.ErrorBoundary>
    </QueryClientProvider>
  // </React.StrictMode>
);
