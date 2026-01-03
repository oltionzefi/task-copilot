-- Add 'confluence' to the intent field options in tasks table
-- We need to recreate the check constraint to include the new value
-- SQLite doesn't support ALTER CHECK constraint, so we need to work around it

-- First, create a new table with the updated constraint
CREATE TABLE tasks_new (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK (status IN ('todo', 'inprogress', 'inreview', 'done', 'cancelled')) DEFAULT 'todo',
    intent TEXT NOT NULL DEFAULT 'code' CHECK (intent IN ('code','jira','confluence')),
    parent_workspace_id TEXT,
    shared_task_id TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL
);

-- Copy data from old table to new table
INSERT INTO tasks_new (id, project_id, title, description, status, intent, parent_workspace_id, shared_task_id, created_at, updated_at)
SELECT id, project_id, title, description, status, intent, parent_workspace_id, shared_task_id, created_at, updated_at FROM tasks;

-- Drop old table
DROP TABLE tasks;

-- Rename new table to original name
ALTER TABLE tasks_new RENAME TO tasks;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_workspace_id ON tasks(parent_workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_shared_task_id ON tasks(shared_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
