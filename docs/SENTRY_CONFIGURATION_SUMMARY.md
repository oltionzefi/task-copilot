# Sentry Frontend Configuration - Setup Complete ✅

## Overview

Sentry has been successfully configured for the frontend application with local development support. This document summarizes the configuration and provides quick reference for using Sentry.

## What Was Configured

### 1. Sentry Services Running
- ✅ Local Sentry instance running on http://localhost:9000
- ✅ PostgreSQL database for Sentry data
- ✅ Redis for caching
- ✅ Sentry worker and cron services
- ✅ Default admin account created

### 2. Frontend Integration
The frontend already has Sentry integration configured in:
- **`frontend/src/main.tsx`**: Main Sentry initialization with React Router integration
- **`frontend/vite.config.ts`**: Sentry Vite plugin for source maps
- **`frontend/package.json`**: `@sentry/react` and `@sentry/vite-plugin` dependencies

**Configuration Features:**
- ✅ Automatic error capturing
- ✅ React ErrorBoundary integration
- ✅ React Router v6 performance monitoring
- ✅ Source map support for production builds
- ✅ Environment-based configuration (dev/production)
- ✅ Conditional enabling based on DSN presence

### 3. New Files Created

1. **`docs/SENTRY_FRONTEND_SETUP.md`**
   - Comprehensive step-by-step setup guide
   - Testing instructions with multiple methods
   - Troubleshooting section
   - Configuration details

2. **`frontend/src/components/dialogs/sentry-test-dialog.tsx`**
   - Interactive test component for Sentry
   - Multiple test buttons for different error types
   - DSN configuration status indicator
   - Available at `/sentry-test` route (dev mode only)

3. **`scripts/setup-sentry-frontend.sh`**
   - Automated setup wizard
   - Guides through DSN configuration
   - Updates .env file automatically
   - Opens Sentry UI in browser

4. **`.env`**
   - Created with placeholders for Sentry DSN
   - Ready to be configured with actual DSN values

### 4. Updated Files

1. **`frontend/src/App.tsx`**
   - Added import for SentryTestDialog
   - Added `/sentry-test` route (dev mode only)

2. **`package.json`**
   - Added `sentry:setup` script for automated configuration

3. **`README.md`**
   - Enhanced Sentry documentation section
   - Added quick start instructions
   - Added links to detailed documentation

## Quick Start Guide

### Option 1: Automated Setup (Recommended)

```bash
pnpm run sentry:setup
```

This interactive wizard will:
1. Start Sentry if not running
2. Open Sentry UI in your browser
3. Guide you through creating a project
4. Automatically update your .env file

### Option 2: Manual Setup

1. **Start Sentry:**
   ```bash
   pnpm run sentry:start
   ```

2. **Access Sentry UI:**
   - URL: http://localhost:9000
   - Email: `admin@vibekanban.local`
   - Password: `admin`

3. **Create Project:**
   - Click "Projects" → "Create Project"
   - Select platform: "JavaScript"
   - Name: `vibe-kanban-frontend`
   - Copy the DSN

4. **Configure Environment:**
   Edit `.env` file:
   ```env
   VITE_SENTRY_DSN=http://YOUR_KEY@localhost:9000/PROJECT_ID
   ```

5. **Start Development:**
   ```bash
   pnpm run dev
   ```

## Testing Sentry Integration

### Method 1: Test Page (Visual Interface)

1. Start the dev server: `pnpm run dev`
2. Open: http://localhost:3000/sentry-test
3. Use the test buttons to trigger different types of events
4. Check Sentry UI for captured events

### Method 2: Browser Console (Quick Test)

1. Open your application in browser
2. Open Developer Console (F12)
3. Execute:
   ```javascript
   Sentry.captureMessage('Test message from console');
   ```
4. Check Sentry UI at http://localhost:9000

### Method 3: Trigger Real Errors

Any uncaught errors in React components will be automatically captured by the ErrorBoundary and sent to Sentry.

## Management Commands

```bash
# Setup (automated wizard)
pnpm run sentry:setup

# Service management
pnpm run sentry:start    # Start Sentry
pnpm run sentry:stop     # Stop Sentry
pnpm run sentry:status   # Check status
pnpm run sentry:logs     # View logs

# Development
pnpm run dev             # Start dev server
```

## Configuration Details

### Current Sentry Configuration

**Location:** `frontend/src/main.tsx`

```typescript
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || '',
  enabled: !!import.meta.env.VITE_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: import.meta.env.MODE === 'development' ? 'dev' : 'production',
  integrations: [
    Sentry.reactRouterV6BrowserTracingIntegration({...}),
  ],
});
```

**Key Features:**
- Automatically disabled if DSN not provided
- Environment-aware (dev/production)
- Full performance monitoring (100% trace sampling)
- React Router integration for page tracking
- ErrorBoundary for catching React errors

### Environment Variables

**Required for Sentry:**
- `VITE_SENTRY_DSN` - Frontend Sentry DSN (from Sentry project settings)

**Optional:**
- `SENTRY_DSN` - Backend Sentry DSN (for backend error tracking)

## Documentation

| Document | Description |
|----------|-------------|
| [SENTRY_FRONTEND_SETUP.md](./SENTRY_FRONTEND_SETUP.md) | Comprehensive setup and testing guide |
| [SENTRY_QUICK_START.md](./SENTRY_QUICK_START.md) | Quick reference for basic operations |
| [LOCAL_SENTRY_SETUP.md](./LOCAL_SENTRY_SETUP.md) | Detailed Docker setup documentation |

## Verification Checklist

Use this checklist to verify Sentry is working correctly:

- [ ] Sentry services are running (`pnpm run sentry:status`)
- [ ] Can access Sentry UI at http://localhost:9000
- [ ] Created a project in Sentry UI
- [ ] `VITE_SENTRY_DSN` is set in `.env` file
- [ ] Dev server starts without errors (`pnpm run dev`)
- [ ] Can access test page at http://localhost:3000/sentry-test
- [ ] Test buttons show DSN as "Configured"
- [ ] Clicking "Send Test Message" creates an event in Sentry UI
- [ ] Event appears in Sentry UI Issues section
- [ ] Event includes proper source information and tags

## Troubleshooting

### Issue: Events Not Appearing in Sentry

**Check:**
1. DSN is correctly set in `.env` file
2. Dev server was restarted after adding DSN
3. Browser console for any Sentry errors
4. Sentry worker logs: `docker logs vibe-kanban-sentry-worker`

### Issue: Sentry Services Not Starting

**Solutions:**
1. Check if port 9000 is available: `lsof -i :9000`
2. View logs: `pnpm run sentry:logs`
3. Reset and restart:
   ```bash
   pnpm run sentry:stop
   docker compose -f docker-compose.dev.yml down -v
   pnpm run sentry:start
   ```

### Issue: "DSN Not Configured" in Test Page

**Solutions:**
1. Verify `.env` file exists in project root
2. Verify `VITE_SENTRY_DSN` is set (not empty)
3. Restart dev server to reload environment variables

## Production Considerations

**Important:** Current setup is for local development only.

For production:
1. Use managed Sentry service (https://sentry.io)
2. Configure proper security and authentication
3. Set up SSL/TLS
4. Configure rate limits and quotas
5. Set up alerting rules
6. Configure release tracking
7. Enable source map uploading
8. Set appropriate data retention policies

## Next Steps

1. **Configure DSN** (if not already done):
   ```bash
   pnpm run sentry:setup
   ```

2. **Test Integration**:
   Visit http://localhost:3000/sentry-test

3. **Review Captured Events**:
   Check http://localhost:9000

4. **Integrate into Workflow**:
   - Monitor errors during development
   - Review stack traces and context
   - Fix issues based on Sentry reports

## Additional Resources

- [Sentry React Documentation](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Sentry Vite Plugin](https://docs.sentry.io/platforms/javascript/sourcemaps/uploading/vite/)
- [Sentry Best Practices](https://docs.sentry.io/product/best-practices/)

---

**Configuration Status:** ✅ Complete and Ready to Use

**Next Action:** Run `pnpm run sentry:setup` to configure your DSN and start testing!
