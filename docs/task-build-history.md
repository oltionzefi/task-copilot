# Task Build History

## Overview

The Task Build History model provides comprehensive tracking of all activities, chat messages, and execution steps within a task. This feature ensures that all context is preserved and accessible for debugging, auditing, and understanding the evolution of a task.

## Features

- **Comprehensive Context Storage**: Tracks chat messages, execution steps, agent turns, errors, and status changes
- **Automatic Retention Management**: 
  - Maximum of 100 entries per task (FIFO deletion)
  - Automatic expiration after 20 days
- **Flexible Context Types**: Supports multiple types of history entries
- **Workspace & Session Linking**: Optional references to workspaces and sessions for detailed tracing

## Database Schema

```sql
CREATE TABLE task_build_history (
    id                BLOB PRIMARY KEY,
    task_id           BLOB NOT NULL,
    workspace_id      BLOB,
    session_id        BLOB,
    context_type      TEXT NOT NULL,
    content           TEXT NOT NULL,
    metadata          TEXT,
    created_at        TEXT NOT NULL,
    expires_at        TEXT NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);
```

## Context Types

The model supports the following context types:

- `chat_message`: User or system chat messages
- `execution_step`: Individual steps in task execution
- `agent_turn`: AI agent interactions and turns
- `setup_complete`: Task setup completion events
- `error`: Error messages and failures
- `status_change`: Task status transitions

## Usage Examples

### Creating a Build History Entry (Rust)

```rust
use db::models::task_build_history::{CreateTaskBuildHistory, TaskBuildHistory, TaskBuildHistoryContextType};
use uuid::Uuid;

// Create a chat message entry
let data = CreateTaskBuildHistory {
    task_id: task_id,
    workspace_id: Some(workspace_id),
    session_id: Some(session_id),
    context_type: TaskBuildHistoryContextType::ChatMessage,
    content: "User asked: How do I implement feature X?".to_string(),
    metadata: Some(r#"{"user_id": "user123", "timestamp": "2024-01-01T12:00:00Z"}"#.to_string()),
};

let history = TaskBuildHistory::create(&pool, &data).await?;
```

### Recording an Execution Step

```rust
let data = CreateTaskBuildHistory {
    task_id: task_id,
    workspace_id: Some(workspace_id),
    session_id: Some(session_id),
    context_type: TaskBuildHistoryContextType::ExecutionStep,
    content: "Running npm install".to_string(),
    metadata: Some(r#"{"exit_code": 0, "duration_ms": 1234}"#.to_string()),
};

TaskBuildHistory::create(&pool, &data).await?;
```

### Logging an Error

```rust
let data = CreateTaskBuildHistory {
    task_id: task_id,
    workspace_id: Some(workspace_id),
    session_id: Some(session_id),
    context_type: TaskBuildHistoryContextType::Error,
    content: "Build failed: Module not found".to_string(),
    metadata: Some(r#"{"error_code": "MODULE_NOT_FOUND", "file": "src/main.rs"}"#.to_string()),
};

TaskBuildHistory::create(&pool, &data).await?;
```

### Retrieving Task History

```rust
// Get all history for a task
let history = TaskBuildHistory::find_by_task_id(&pool, task_id).await?;

for entry in history {
    println!("{}: {} - {}", 
        entry.created_at, 
        entry.context_type, 
        entry.content
    );
}

// Get history count
let count = TaskBuildHistory::count_by_task_id(&pool, task_id).await?;
println!("Total history entries: {}", count);

// Get history for a specific workspace
let workspace_history = TaskBuildHistory::find_by_workspace_id(&pool, workspace_id).await?;

// Get history for a specific session
let session_history = TaskBuildHistory::find_by_session_id(&pool, session_id).await?;
```

## Retention Policies

### FIFO Limit (100 entries)

When a new entry is created and the task already has 100 or more entries, the oldest entries are automatically deleted to maintain the limit. This is handled by a database trigger:

```sql
CREATE TRIGGER trg_task_build_history_fifo
AFTER INSERT ON task_build_history
BEGIN
    DELETE FROM task_build_history
    WHERE id IN (
        SELECT id FROM task_build_history
        WHERE task_id = NEW.task_id
        ORDER BY created_at ASC
        LIMIT MAX(0, (SELECT COUNT(*) - 100 FROM task_build_history WHERE task_id = NEW.task_id))
    );
END;
```

### Time-based Expiration (20 days)

Entries are automatically marked with an expiration date 20 days from creation. A trigger automatically cleans up expired entries:

```sql
CREATE TRIGGER trg_task_build_history_cleanup_expired
AFTER INSERT ON task_build_history
BEGIN
    DELETE FROM task_build_history WHERE datetime(expires_at) < datetime('now');
END;
```

You can also manually trigger cleanup:

```rust
let deleted = TaskBuildHistory::cleanup_expired(&pool).await?;
println!("Cleaned up {} expired entries", deleted);
```

## TypeScript Integration

The types are automatically exported to `shared/types.ts`:

```typescript
export type TaskBuildHistory = {
  id: string;
  task_id: string;
  workspace_id: string | null;
  session_id: string | null;
  context_type: TaskBuildHistoryContextType;
  content: string;
  metadata: string | null;
  created_at: string;
  expires_at: string;
};

export type TaskBuildHistoryContextType =
  | "chat_message"
  | "execution_step"
  | "agent_turn"
  | "setup_complete"
  | "error"
  | "status_change";

export type CreateTaskBuildHistory = {
  task_id: string;
  workspace_id: string | null;
  session_id: string | null;
  context_type: TaskBuildHistoryContextType;
  content: string;
  metadata: string | null;
};
```

## Best Practices

1. **Use Metadata for Structure**: Store structured data (like error codes, durations, user IDs) in the `metadata` JSON field
2. **Link to Workspaces/Sessions**: Always provide `workspace_id` and `session_id` when available for better traceability
3. **Choose Appropriate Context Types**: Use specific context types to enable filtering and analysis
4. **Keep Content Concise**: Store detailed data in metadata, use content for human-readable summaries
5. **Regular Cleanup**: While automatic cleanup is enabled, consider periodic manual cleanup during maintenance windows

## Migration

The migration file is located at:
```
crates/db/migrations/20260106000000_create_task_build_history.sql
```

To apply the migration:
```bash
pnpm run prepare-db
```

## Testing

Comprehensive tests are included in `crates/db/src/models/task_build_history.rs`:

```bash
# Run task build history tests
cargo test --package db task_build_history

# Run all tests
cargo test --workspace
```

## Performance Considerations

- **Indexes**: The table includes indexes on `task_id`, `expires_at`, `context_type`, `workspace_id`, and `session_id` for efficient querying
- **Cascading Deletes**: History is automatically deleted when the parent task is deleted
- **Automatic Cleanup**: Triggers ensure old data doesn't accumulate
- **Batch Operations**: Consider batching history creation in high-throughput scenarios

## Future Enhancements

Potential improvements for future versions:

- Pagination support for large history sets
- Export functionality for archiving
- Advanced filtering by date range or context type
- Real-time streaming of history updates
- Compression for older entries
