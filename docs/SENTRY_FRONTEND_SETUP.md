# Sentry Frontend Setup and Testing Guide

This guide provides step-by-step instructions for configuring and testing Sentry integration with the frontend in your local development environment.

## Prerequisites

- Docker and Docker Compose installed
- Node.js and pnpm installed
- Project dependencies installed (`pnpm install`)

## Step 1: Start Local Sentry Instance

The project includes a local Sentry instance that runs in Docker containers.

```bash
pnpm run sentry:start
```

This command will:
- Start Sentry web UI (port 9000)
- Start PostgreSQL database
- Start Redis for caching
- Start Sentry worker and cron services
- Create a default admin user

**Default Credentials:**
- URL: http://localhost:9000
- Email: `admin@vibekanban.local`
- Password: `admin`

## Step 2: Create a Sentry Project

1. Open your browser and navigate to http://localhost:9000
2. Log in with the default credentials above
3. On first login, you may see a welcome screen. Click "Start"
4. Create a new project:
   - Click "Projects" in the left sidebar
   - Click "Create Project" button
   - Select platform: **"JavaScript"** (for React frontend)
   - Enter project name: `vibe-kanban-frontend` (or any name you prefer)
   - Click "Create Project"

5. After creating the project, you'll see the project setup page with your DSN
6. Copy the DSN - it will look like:
   ```
   http://abc123def456@localhost:9000/1
   ```

## Step 3: Configure Environment Variables

Create a `.env` file in the project root directory:

```bash
# Copy from example
cp .env.example .env
```

Edit the `.env` file and add your Sentry DSN:

```env
# Frontend Sentry DSN (from Step 2)
VITE_SENTRY_DSN=http://YOUR_KEY@localhost:9000/PROJECT_ID

# Backend Sentry DSN (optional, for backend error tracking)
SENTRY_DSN=http://YOUR_KEY@localhost:9000/PROJECT_ID

# Other configurations
BACKEND_PORT=8080
HOST=127.0.0.1
```

**Important:** Replace `YOUR_KEY@localhost:9000/PROJECT_ID` with the actual DSN you copied from Sentry UI.

## Step 4: Start the Development Server

```bash
pnpm run dev
```

This will start both the frontend and backend servers.

## Step 5: Test Sentry Integration

### Option A: Use Browser Console (Quick Test)

1. Open the application in your browser (usually http://localhost:3000)
2. Open the browser's Developer Console (F12 or Cmd+Option+I on Mac)
3. Type and execute the following command:

```javascript
Sentry.captureMessage('Test message from console');
```

4. Go to your Sentry UI (http://localhost:9000)
5. Navigate to "Issues" - you should see the test message appear

### Option B: Trigger a Test Error (Component Test)

1. Open any page in the application
2. Open browser console and trigger a test error:

```javascript
// Test error capture
throw new Error('Test error for Sentry integration');
```

3. The error should appear in Sentry UI under "Issues"

### Option C: Use the ErrorBoundary

The application is wrapped with a Sentry ErrorBoundary. Any uncaught errors in React components will be automatically captured.

To test this:

1. Temporarily modify any component to throw an error:
```typescript
// In any component
const SomeComponent = () => {
  throw new Error('Testing Sentry ErrorBoundary');
  return <div>Component</div>;
};
```

2. When this component renders, the error will be caught and sent to Sentry
3. The user will see the ErrorBoundary fallback UI

## Step 6: Verify in Sentry UI

1. Go to http://localhost:9000
2. Click on your project name
3. Click "Issues" in the left sidebar
4. You should see all captured errors and messages with:
   - Error details
   - Stack traces
   - Browser information
   - User actions (breadcrumbs)
   - Source maps (for production builds)

## Current Sentry Configuration

The frontend Sentry integration is configured in `frontend/src/main.tsx`:

- **DSN**: Loaded from `VITE_SENTRY_DSN` environment variable
- **Enabled**: Only when DSN is provided (automatically disabled if no DSN)
- **Environment**: Automatically set based on build mode (dev/production)
- **Traces Sample Rate**: 100% (captures all performance data)
- **Integrations**:
  - React Router v6 Browser Tracing (performance monitoring)
  - Error Boundary (catches React component errors)
- **Source Tag**: "frontend" (helps distinguish frontend vs backend errors)

## Additional Features

### Performance Monitoring

Sentry is configured with React Router integration for performance monitoring:
- Page load times
- Navigation performance
- Component render times
- API request performance

### Error Context

Errors captured by Sentry include:
- Full stack trace
- Component tree (for React errors)
- Browser information
- User interactions (breadcrumbs)
- Custom tags and context

### Source Maps

For production builds, source maps are generated automatically by Vite and can be uploaded to Sentry using the Sentry Vite plugin (already configured in `vite.config.ts`).

## Troubleshooting

### Sentry Not Capturing Errors

1. **Check DSN is set:**
   ```bash
   echo $VITE_SENTRY_DSN
   ```

2. **Check Sentry is running:**
   ```bash
   pnpm run sentry:status
   ```

3. **Check browser console for Sentry errors:**
   Look for any Sentry-related error messages

4. **Verify environment variable in browser:**
   ```javascript
   console.log(import.meta.env.VITE_SENTRY_DSN);
   ```

### Sentry Services Not Starting

1. **Check Docker is running:**
   ```bash
   docker ps
   ```

2. **Check port 9000 is available:**
   ```bash
   lsof -i :9000
   ```

3. **View Sentry logs:**
   ```bash
   pnpm run sentry:logs
   ```

4. **Reset Sentry (if needed):**
   ```bash
   pnpm run sentry:stop
   docker compose -f docker-compose.dev.yml down -v
   pnpm run sentry:start
   ```

### Events Not Appearing in UI

1. **Check network tab** in browser DevTools for failed requests to Sentry
2. **Verify project ID** in DSN matches the project in Sentry UI
3. **Check Sentry worker logs** for processing errors:
   ```bash
   docker logs vibe-kanban-sentry-worker
   ```

## Management Commands

```bash
# Start Sentry
pnpm run sentry:start

# Stop Sentry
pnpm run sentry:stop

# View logs
pnpm run sentry:logs

# Check status
pnpm run sentry:status

# Reset (removes all data)
bash scripts/sentry-local.sh reset
```

## Production Deployment

For production environments:

1. Use a managed Sentry service (https://sentry.io) or properly secured self-hosted instance
2. Set strong passwords and secret keys
3. Configure SSL/TLS
4. Set appropriate rate limits
5. Configure email notifications
6. Set up alerting rules
7. Consider data retention policies
8. Upload source maps for better stack traces

See `docs/LOCAL_SENTRY_SETUP.md` for more details about the Sentry Docker setup.

## Additional Resources

- [Sentry React Documentation](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Sentry Vite Plugin](https://docs.sentry.io/platforms/javascript/sourcemaps/uploading/vite/)
- [Local Sentry Setup](./LOCAL_SENTRY_SETUP.md)
- [Sentry Quick Start](./SENTRY_QUICK_START.md)
