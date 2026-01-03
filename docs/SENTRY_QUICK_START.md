# Quick Start: Local Sentry Setup

## 1. Start Sentry
```bash
pnpm run sentry:start
```

## 2. Access Sentry UI
- URL: http://localhost:9000
- Login: `admin@vibekanban.local` / `admin`

## 3. Create Project & Get DSN
1. Click "Projects" → "Create Project"
2. Select "JavaScript" or "Rust" 
3. Copy the DSN (looks like: `http://KEY@localhost:9000/PROJECT_ID`)

## 4. Configure Environment
Create `.env` file in project root:
```env
SENTRY_DSN=http://YOUR_KEY@localhost:9000/PROJECT_ID
VITE_SENTRY_DSN=http://YOUR_KEY@localhost:9000/PROJECT_ID
```

## 5. Start Development
```bash
pnpm run dev
```

## Management Commands
```bash
pnpm run sentry:start   # Start Sentry
pnpm run sentry:stop    # Stop Sentry
pnpm run sentry:logs    # View logs
pnpm run sentry:status  # Check status
```

## Additional Help
See [docs/LOCAL_SENTRY_SETUP.md](LOCAL_SENTRY_SETUP.md) for detailed documentation.
