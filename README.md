<p align="center">
  <a href="https://taskcopilot.com">
    <picture>
      <source srcset="frontend/public/task-copilot-logo-dark.svg" media="(prefers-color-scheme: dark)">
      <source srcset="frontend/public/task-copilot-logo.svg" media="(prefers-color-scheme: light)">
      <img src="frontend/public/task-copilot-logo.svg" alt="Task Copilot Logo">
    </picture>
  </a>
</p>

## Overview

AI coding agents are increasingly writing the world's code and human engineers now spend the majority of their time planning, reviewing, and orchestrating tasks. Task Copilot streamlines this process, enabling you to:

- Easily switch between different coding agents
- Orchestrate the execution of multiple coding agents in parallel or in sequence
- Quickly review work and start dev servers
- Track the status of tasks that your coding agents are working on
- Centralise configuration of coding agent MCP configs
- Open projects remotely via SSH when running Task Copilot on a remote server
- **Connect with external tools**: Integrate with Jira, Slack, Microsoft Teams, and Outlook for seamless workflow management

## Integrations & Connectors

Task Copilot provides native integrations with popular productivity and communication tools:

### Project Management
- **Jira**: Sync tasks with Jira issues, create and update tickets, track workflow transitions
- Support for custom workflows and issue types

### Communication & Notifications
- **Slack**: Send notifications about task status, code reviews, and agent activity
- **Microsoft Teams**: Channel notifications and direct messages for task updates
- **Outlook**: Email notifications for task completion and review requests

These integrations allow you to maintain your existing workflows while leveraging AI coding agents.

## Development

### Prerequisites

- [Rust](https://rustup.rs/) (latest stable)
- [Node.js](https://nodejs.org/) (>=18)
- [pnpm](https://pnpm.io/) (>=8)

Additional development tools:
```bash
cargo install cargo-watch
cargo install sqlx-cli
```

Install dependencies:
```bash
pnpm i
```

### Running with Docker (Production-like)

To run the application in a containerized environment:

```bash
# Start the service
pnpm run docker:up
# or directly:
./scripts/docker-up.sh

# View logs
pnpm run docker:logs

# Restart service
pnpm run docker:restart

# Stop the service (preserves data)
pnpm run docker:down
# or directly:
./scripts/docker-down.sh

# Stop and remove all data
./scripts/docker-down.sh --volumes
```

The service will be available at `http://localhost:3000` (or the port specified in `.env`).

Environment variables can be configured in a `.env` file:
```bash
PORT=3000              # Application port
RUST_LOG=info          # Log level (debug, info, warn, error)
SENTRY_DSN=            # Optional Sentry DSN for error tracking
```

See [DOCKER.md](DOCKER.md) for detailed Docker deployment instructions.

## Migrate to Docker

Migrate from local dev to Docker:

```bash
pnpm run migrate
```

Migrates `dev_assets/` (database, config) to Docker volumes and starts containers on port 3000.

### Running the dev server

```bash
pnpm run dev
```

This will start the backend. A blank DB will be copied from the `dev_assets_seed` folder.

### Building the frontend

To build just the frontend:

```bash
cd frontend
pnpm build
```

### Environment Variables

The following environment variables can be configured at build time or runtime:

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `PORT` | Runtime | Auto-assign | **Production**: Server port. **Dev**: Frontend port (backend uses PORT+1) |
| `BACKEND_PORT` | Runtime | `0` (auto-assign) | Backend server port (dev mode only, overrides PORT+1) |
| `FRONTEND_PORT` | Runtime | `3000` | Frontend dev server port (dev mode only, overrides PORT) |
| `HOST` | Runtime | `127.0.0.1` | Backend server host |
| `SENTRY_DSN` | Runtime | Empty | Sentry DSN for backend error tracking (disables Sentry if empty) |
| `VITE_SENTRY_DSN` | Build/Runtime | Empty | Sentry DSN for frontend error tracking (disables Sentry if empty) |
| `DISABLE_WORKTREE_ORPHAN_CLEANUP` | Runtime | Not set | Disable git worktree cleanup (for debugging) |

**Build-time variables** must be set when running `pnpm run build`. **Runtime variables** are read when the application starts.

For information about error tracking with Sentry in Docker, see [DOCKER.md](./DOCKER.md#error-tracking-with-sentry).
