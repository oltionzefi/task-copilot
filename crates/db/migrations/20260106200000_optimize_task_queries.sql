-- Optimize task queries with better indexes for attempt status lookups

-- Index for execution_processes queries filtered by status and run_reason
CREATE INDEX IF NOT EXISTS idx_execution_processes_status_run_reason_created
ON execution_processes (status, run_reason, created_at DESC);

-- Index for sessions to speed up executor lookups
CREATE INDEX IF NOT EXISTS idx_sessions_workspace_executor
ON sessions (workspace_id, executor, created_at DESC);

-- Optimize workspace queries
CREATE INDEX IF NOT EXISTS idx_workspaces_task_id_created_at
ON workspaces (task_id, created_at DESC);

PRAGMA optimize;
