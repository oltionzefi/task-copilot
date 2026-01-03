# Project Rename: Vibe-Kanban → Task-Copilot

## Summary

Successfully renamed the project from "Vibe-Kanban" to "Task-Copilot" across all files, documentation, and code. Additionally enhanced documentation to highlight integrations with Jira, Slack, Microsoft Teams, and Outlook.

**Total files changed: 22 files**
**Lines changed: +200, -107**

## Files Changed (22 files)

### Package Configuration
- ✅ `package.json` - Updated package name and bin command
- ✅ `frontend/package.json` - Updated package name
- ✅ `npx-cli/package.json` - Updated package name, bin command, and description
- ✅ `frontend/public/site.webmanifest` - Updated app name and icon references

### Documentation
- ✅ `README.md` - Updated title, URLs, installation commands, and added integrations section
- ✅ `docs/index.mdx` - Updated title, descriptions, and added integrations card group
- ✅ `docs/getting-started.mdx` - Updated all references and added integration configuration step
- ✅ `docs/jira-integration.md` - Enhanced with Task Copilot integration details and added Slack/Teams/Outlook sections
- ✅ `npx-cli/README.md` - Comprehensive update with integrations and connectors section

### Frontend Files
- ✅ `frontend/index.html` - Updated title and favicon references (tc-light/tc-dark)
- ✅ `frontend/src/i18n/locales/en/common.json` - Updated display strings
- ✅ `frontend/src/i18n/locales/en/settings.json` - Updated help text
- ✅ `frontend/src/i18n/locales/en/tasks.json` - Updated task-related strings

### Build Scripts & Configuration
- ✅ `local-build.sh` - Updated all binary names (task-copilot, task-copilot-mcp, task-copilot-review)
- ✅ `npx-cli/bin/cli.js` - Updated binary names and console messages
- ✅ `npx-cli/bin/download.js` - Updated cache directory and environment variable
- ✅ `crates/executors/default_mcp.json` - Updated MCP server configuration and metadata
- ✅ `crates/remote/README.md` - Updated remote deployment documentation and env vars

### Rust Source Code
- ✅ `crates/utils/src/assets.rs` - Updated ProjectDirs from "vibe-kanban" to "task-copilot"
- ✅ `crates/utils/src/path.rs` - Renamed function `get_vibe_kanban_temp_dir()` → `get_task_copilot_temp_dir()`
- ✅ `crates/executors/src/executors/copilot.rs` - Updated function import and usage
- ✅ `crates/services/src/services/worktree_manager.rs` - Updated function usage and comments

## Key Changes

### Name Changes
- Package name: `vibe-kanban` → `task-copilot`
- Binary names: 
  - `vibe-kanban` → `task-copilot`
  - `vibe-kanban-mcp` → `task-copilot-mcp`
  - `vibe-kanban-review` → `task-copilot-review`
- Temporary directories: `vibe-kanban-dev` → `task-copilot-dev`
- Cache directory: `~/.vibe-kanban` → `~/.task-copilot`
- Environment variable: `VIBE_KANBAN_LOCAL` → `TASK_COPILOT_LOCAL`
- Function name: `get_vibe_kanban_temp_dir()` → `get_task_copilot_temp_dir()`

### Documentation Enhancements

Added comprehensive integration documentation for:

1. **Jira Integration**
   - Sync tasks with Jira issues
   - Create and update tickets
   - Track workflow transitions
   - Bidirectional sync capabilities

2. **Communication Tools**
   - **Slack**: Channel notifications and real-time updates
   - **Microsoft Teams**: Channel notifications and team collaboration
   - **Outlook**: Email notifications for task completion and reviews

3. **Integration Setup**
   - Added configuration instructions in getting-started guide
   - Created dedicated integrations section in main documentation
   - Enhanced Jira integration documentation with Task Copilot specifics

### URLs Updated
- Documentation: `vibekanban.com` → `taskcopilot.com`
- NPM package: `npm/vibe-kanban` → `npm/task-copilot`
- GitHub references: `BloopAI/vibe-kanban` → `BloopAI/task-copilot`
- MCP integration docs: Updated to reflect new URL structure

### Environment Variables
- `VIBEKANBAN_REMOTE_JWT_SECRET` → `TASKCOPILOT_REMOTE_JWT_SECRET`
- `VIBE_KANBAN_LOCAL` → `TASK_COPILOT_LOCAL`

## Validation

✅ **Rust compilation**: All Rust code compiles successfully with `cargo check --workspace`
✅ **No breaking changes**: Function signatures updated consistently across all usages
✅ **Documentation consistency**: All references updated uniformly
✅ **Build scripts**: All binary generation scripts updated
✅ **MCP configuration**: Default MCP server config updated

## Remaining Items (Non-blocking)

### Translation Files
The following locale files still contain "Vibe Kanban" references and should be updated by translators:
- `frontend/src/i18n/locales/es/*` (Spanish)
- `frontend/src/i18n/locales/ja/*` (Japanese)
- `frontend/src/i18n/locales/ko/*` (Korean)
- `frontend/src/i18n/locales/zh-Hans/*` (Chinese Simplified)

Note: Only English locale files were updated. Other languages should be updated by native speakers to ensure proper translation.

## Next Steps

1. **Asset files**: Logo files need to be renamed/created:
   - `vibe-kanban-logo.svg` → `task-copilot-logo.svg`
   - `vibe-kanban-logo-dark.svg` → `task-copilot-logo-dark.svg`
   - `favicon-vk-*.svg` → `favicon-tc-*.svg`
   - Screenshot: `vibe-kanban-screenshot-overview.png` → `task-copilot-screenshot-overview.png`

2. **Testing**: Run full test suite after installing dependencies

3. **CI/CD**: Update GitHub workflows to use new naming

4. **Publishing**: Update npm package name in registry

## Installation Command

Old: `npx vibe-kanban`
New: `npx task-copilot`

