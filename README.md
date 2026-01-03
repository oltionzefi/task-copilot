<p align="center">
  <a href="https://taskcopilot.com">
    <picture>
      <source srcset="frontend/public/task-copilot-logo-dark.svg" media="(prefers-color-scheme: dark)">
      <source srcset="frontend/public/task-copilot-logo.svg" media="(prefers-color-scheme: light)">
      <img src="frontend/public/task-copilot-logo.svg" alt="Task Copilot Logo">
    </picture>
  </a>
</p>

<p align="center">Get 10X more out of Claude Code, Gemini CLI, Codex, Amp and other coding agents...</p>
<p align="center">
  <a href="https://www.npmjs.com/package/task-copilot"><img alt="npm" src="https://img.shields.io/npm/v/task-copilot?style=flat-square" /></a>
  <a href="https://github.com/BloopAI/task-copilot/blob/main/.github/workflows/publish.yml"><img alt="Build status" src="https://img.shields.io/github/actions/workflow/status/BloopAI/task-copilot/.github%2Fworkflows%2Fpublish.yml" /></a>
  <a href="https://deepwiki.com/BloopAI/task-copilot"><img src="https://deepwiki.com/badge.svg" alt="Ask DeepWiki"></a>
</p>

<h1 align="center">
  <a href="https://jobs.polymer.co/task-copilot?source=github"><strong>We're hiring!</strong></a>
</h1>

![](frontend/public/task-copilot-screenshot-overview.png)

## Overview

AI coding agents are increasingly writing the world's code and human engineers now spend the majority of their time planning, reviewing, and orchestrating tasks. Task Copilot streamlines this process, enabling you to:

- Easily switch between different coding agents
- Orchestrate the execution of multiple coding agents in parallel or in sequence
- Quickly review work and start dev servers
- Track the status of tasks that your coding agents are working on
- Centralise configuration of coding agent MCP configs
- Open projects remotely via SSH when running Task Copilot on a remote server
- **Connect with external tools**: Integrate with Jira, Slack, Microsoft Teams, and Outlook for seamless workflow management

You can watch a video overview [here](https://youtu.be/TFT3KnZOOAk).

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

## Installation

Make sure you have authenticated with your favourite coding agent. A full list of supported coding agents can be found in the [docs](https://taskcopilot.com/docs). Then in your terminal run:

```bash
npx task-copilot
```

## Documentation

Please head to the [website](https://taskcopilot.com/docs) for the latest documentation and user guides.

## Support

We use [GitHub Discussions](https://github.com/BloopAI/task-copilot/discussions) for feature requests. Please open a discussion to create a feature request. For bugs please open an issue on this repo.

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

### Build from source (macOS)

1. Run `./local-build.sh`
2. Test with `cd npx-cli && node bin/cli.js`


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

### Local Sentry Setup (Error Tracking & Monitoring)

For local development, you can run a Sentry instance for error tracking and monitoring:

**Quick Start:**
```bash
# Automated setup (recommended)
pnpm run sentry:setup
```

This wizard will:
1. Start Sentry services (if not running)
2. Guide you through creating a project
3. Automatically configure your `.env` file

**Manual Setup:**
```bash
# 1. Start Sentry
pnpm run sentry:start

# 2. Open http://localhost:9000 and login with:
#    Email: admin@vibekanban.local
#    Password: admin

# 3. Create a JavaScript project and copy the DSN

# 4. Add to .env file:
VITE_SENTRY_DSN=http://YOUR_KEY@localhost:9000/PROJECT_ID
```

**Test the Integration:**
- Open http://localhost:3000/sentry-test in your browser (dev mode only)
- Or use the browser console: `Sentry.captureMessage('Test message');`
- Check Sentry UI at http://localhost:9000 for captured events

**Management Commands:**
```bash
pnpm run sentry:start   # Start Sentry services
pnpm run sentry:stop    # Stop Sentry services
pnpm run sentry:status  # Check service status
pnpm run sentry:logs    # View logs
```

**Documentation:**
- **Quick Start**: [docs/SENTRY_QUICK_START.md](docs/SENTRY_QUICK_START.md)
- **Frontend Setup & Testing**: [docs/SENTRY_FRONTEND_SETUP.md](docs/SENTRY_FRONTEND_SETUP.md)
- **Detailed Configuration**: [docs/LOCAL_SENTRY_SETUP.md](docs/LOCAL_SENTRY_SETUP.md)

### Remote Deployment

When running Task Copilot on a remote server (e.g., via systemctl, Docker, or cloud hosting), you can configure your editor to open projects via SSH:

1. **Access via tunnel**: Use Cloudflare Tunnel, ngrok, or similar to expose the web UI
2. **Configure remote SSH** in Settings → Editor Integration:
   - Set **Remote SSH Host** to your server hostname or IP
   - Set **Remote SSH User** to your SSH username (optional)
3. **Prerequisites**:
   - SSH access from your local machine to the remote server
   - SSH keys configured (passwordless authentication)
   - VSCode Remote-SSH extension

When configured, the "Open in VSCode" buttons will generate URLs like `vscode://vscode-remote/ssh-remote+user@host/path` that open your local editor and connect to the remote server.

See the [documentation](https://taskcopilot.com/docs/configuration-customisation/global-settings#remote-ssh-configuration) for detailed setup instructions.
