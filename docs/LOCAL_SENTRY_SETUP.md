# Local Sentry Setup

This project includes a local Sentry instance for development and error tracking. The setup runs Sentry in Docker containers alongside your development environment.

## Quick Start

### 1. Start the Local Sentry Instance

```bash
docker compose -f docker-compose.dev.yml up -d
```

This will start:
- **Sentry Web UI** (port 9000)
- **PostgreSQL** database for Sentry
- **Redis** for caching
- **Sentry Worker** for background jobs
- **Sentry Cron** for scheduled tasks

### 2. Initial Setup

On first run, Sentry will automatically:
- Run database migrations
- Create a default superuser account:
  - Email: `admin@vibekanban.local`
  - Password: `admin`

### 3. Access Sentry UI

Open your browser to [http://localhost:9000](http://localhost:9000)

Login with the default credentials above.

### 4. Create a Project and Get DSN

1. After logging in, create a new project:
   - Click "Projects" → "Create Project"
   - Select "JavaScript" for frontend or "Rust" for backend
   - Name it (e.g., "task-copilot-dev")
   - Click "Create Project"

2. Copy the DSN from the project settings:
   - It will look like: `http://YOUR_KEY@localhost:9000/PROJECT_ID`

### 5. Configure Environment Variables

Create a `.env` file in the project root with:

```env
# Backend (Rust) Sentry Configuration
SENTRY_DSN=http://YOUR_KEY@localhost:9000/PROJECT_ID

# Frontend (React) Sentry Configuration
VITE_SENTRY_DSN=http://YOUR_KEY@localhost:9000/PROJECT_ID
```

**Note:** You can use the same DSN for both frontend and backend, or create separate projects in Sentry UI for better organization.

### 6. Start Development

```bash
pnpm run dev
```

Your application will now send error reports and traces to your local Sentry instance!

## Managing the Sentry Instance

### View Logs

```bash
# All services
docker compose -f docker-compose.dev.yml logs -f

# Specific service
docker compose -f docker-compose.dev.yml logs -f sentry
```

### Stop Sentry

```bash
docker compose -f docker-compose.dev.yml down
```

### Stop and Remove All Data

```bash
docker compose -f docker-compose.dev.yml down -v
```

**Warning:** This will delete all Sentry data including projects, issues, and events.

### Restart Sentry

```bash
docker compose -f docker-compose.dev.yml restart
```

## Configuration Details

### Environment Variables

You can customize the Sentry instance using environment variables:

- `SENTRY_SECRET_KEY`: Secret key for Sentry (default: auto-generated for dev)
  
To set custom values, create a `.env` file or export them before running docker compose.

### Volumes

The setup uses Docker volumes to persist data:
- `sentry-postgres-data`: PostgreSQL database
- `sentry-redis-data`: Redis cache
- `sentry-data`: Sentry files and uploads

## Troubleshooting

### Sentry Not Starting

1. Check if ports are available:
   ```bash
   lsof -i :9000
   ```

2. View logs:
   ```bash
   docker compose -f docker-compose.dev.yml logs sentry
   ```

### Reset Everything

If you encounter issues, you can completely reset:

```bash
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d
```

### Cannot Access Sentry UI

Make sure the containers are running:

```bash
docker compose -f docker-compose.dev.yml ps
```

All services should show "Up" status.

## Production Considerations

**Important:** This setup is for local development only. For production:

1. Use a managed Sentry service (sentry.io) or properly secured self-hosted instance
2. Set strong passwords and secret keys
3. Configure proper SSL/TLS
4. Set up proper backup strategies
5. Configure email notifications
6. Review and adjust rate limits

## Integration Points

The application integrates Sentry in:

1. **Backend (Rust)**
   - `crates/utils/src/sentry.rs`: Sentry initialization and configuration
   - `crates/server/src/main.rs`: Main application server
   - `crates/server/src/bin/mcp_task_server.rs`: MCP task server

2. **Frontend (React)**
   - `frontend/src/main.tsx`: Sentry initialization with React Router integration

Both use environment variables for DSN configuration, allowing easy switching between local and production Sentry instances.
