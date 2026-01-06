# Docker Deployment Guide

This guide covers deploying Task Copilot using Docker and Docker Compose.

## Quick Start

### Using npm scripts (recommended):

```bash
# Start the service
pnpm run docker:up

# View logs
pnpm run docker:logs

# Restart service
pnpm run docker:restart

# Stop the service
pnpm run docker:down
```

### Using scripts directly:

```bash
# Start the service
./scripts/docker-up.sh

# Stop the service (preserves data)
./scripts/docker-down.sh

# Stop and remove all data
./scripts/docker-down.sh --volumes
```

## Configuration

### Environment Variables

Create a `.env` file in the project root to configure the application:

```bash
# Application port (default: 3000)
PORT=3000

# Log level (debug, info, warn, error)
RUST_LOG=info

# Optional: Sentry DSN for error tracking
SENTRY_DSN=https://your-sentry-dsn
```

### Default Configuration

The Docker setup uses the following defaults:
- **Container name**: `task-copilot`
- **Port**: 3000 (configurable via `PORT` env var)
- **Host**: 0.0.0.0 (listens on all interfaces)
- **Restart policy**: unless-stopped
- **Volumes**:
  - `task-copilot-repos`: Git repositories
  - `task-copilot-data`: Application data

## Docker Compose File

The `docker-compose.yml` file defines:
- Multi-stage build using the existing Dockerfile
- Persistent volumes for data and repositories
- Health checks for service monitoring
- Environment variable configuration

## Management Scripts

### docker-up.sh

Starts the Task Copilot service with the following features:
- Automatically detects Docker Compose v1 or v2
- Loads environment variables from `.env` file
- Builds the Docker image
- Starts the service in detached mode
- Waits for health check to pass
- Shows service status and recent logs

### docker-down.sh

Stops the Task Copilot service with options:
- Default: Stops service but preserves data
- `--volumes` flag: Stops service and removes all data

## Remote Server Deployment

### Prerequisites

- Docker and Docker Compose installed on the remote server
- Git access to clone the repository
- Appropriate firewall rules to expose port 3000 (or your configured port)

### Deployment Steps

1. **Clone the repository on the remote server:**
   ```bash
   git clone <repository-url>
   cd vibe-kanban
   ```

2. **Create environment configuration:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   nano .env
   ```

3. **Start the service:**
   ```bash
   ./scripts/docker-up.sh
   ```

4. **Verify the service is running:**
   ```bash
   docker compose ps
   docker compose logs -f task-copilot
   ```

5. **Access the application:**
   - Open your browser to `http://<server-ip>:3000`

### Server Configuration Tips

- **Reverse Proxy**: Use nginx or traefik for HTTPS and domain mapping
- **Firewall**: Configure firewall to allow traffic on the application port
- **Systemd**: Consider creating a systemd service for automatic startup
- **Backups**: Regularly backup Docker volumes

## Monitoring and Logs

### View live logs:
```bash
docker compose logs -f task-copilot
# or
pnpm run docker:logs
```

### Check service health:
```bash
docker compose ps
```

### Inspect volumes:
```bash
docker volume ls | grep task-copilot
docker volume inspect task-copilot-repos
docker volume inspect task-copilot-data
```

## Troubleshooting

### Service won't start

Check logs for errors:
```bash
docker compose logs task-copilot
```

### Port already in use

Change the port in `.env`:
```bash
PORT=8080
```

Then restart:
```bash
./scripts/docker-down.sh
./scripts/docker-up.sh
```

### Reset everything

Stop and remove all data:
```bash
./scripts/docker-down.sh --volumes
./scripts/docker-up.sh
```

### Build issues

Force rebuild without cache:
```bash
docker compose build --no-cache
docker compose up -d
```

## Updating

To update to the latest version:

```bash
# Stop the service
./scripts/docker-down.sh

# Pull latest code
git pull

# Rebuild and start
./scripts/docker-up.sh
```

## Security Considerations

- Change default Sentry configuration in production
- Use environment variables for sensitive data (never commit to git)
- Run behind a reverse proxy with HTTPS in production
- Regularly update the Docker image with security patches
- Consider using Docker secrets for sensitive environment variables

## Backup and Restore

### Backup volumes:
```bash
docker run --rm -v task-copilot-repos:/data -v $(pwd):/backup alpine tar czf /backup/repos-backup.tar.gz /data
docker run --rm -v task-copilot-data:/data -v $(pwd):/backup alpine tar czf /backup/data-backup.tar.gz /data
```

### Restore volumes:
```bash
docker run --rm -v task-copilot-repos:/data -v $(pwd):/backup alpine tar xzf /backup/repos-backup.tar.gz -C /
docker run --rm -v task-copilot-data:/data -v $(pwd):/backup alpine tar xzf /backup/data-backup.tar.gz -C /
```
