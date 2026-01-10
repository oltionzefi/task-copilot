-- Apply task_history migrations for existing databases
PRAGMA foreign_keys = ON;

-- Check if task_history exists and if it needs updating
-- Create task_history if it doesn't exist
CREATE TABLE IF NOT EXISTS task_history (
    id                BLOB PRIMARY KEY DEFAULT (randomblob(16)),
    task_id           BLOB NOT NULL,
    event_type        TEXT NOT NULL 
                          CHECK (event_type IN ('status_changed','description_changed','title_changed','pr_body_updated','other')),
    old_value         TEXT,
    new_value         TEXT,
    metadata          TEXT,
    created_at        TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Now update to include 'change_requested' event type
-- Save existing data
CREATE TEMPORARY TABLE task_history_backup AS SELECT * FROM task_history;

-- Drop and recreate with new constraint
DROP TABLE task_history;

CREATE TABLE task_history (
    id                BLOB PRIMARY KEY DEFAULT (randomblob(16)),
    task_id           BLOB NOT NULL,
    event_type        TEXT NOT NULL 
                          CHECK (event_type IN ('status_changed','description_changed','title_changed','pr_body_updated','change_requested','other')),
    old_value         TEXT,
    new_value         TEXT,
    metadata          TEXT,
    created_at        TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Restore data
INSERT INTO task_history SELECT * FROM task_history_backup;

-- Clean up
DROP TABLE task_history_backup;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_history_created_at ON task_history(created_at);
CREATE INDEX IF NOT EXISTS idx_task_history_event_type ON task_history(event_type);

-- Record migrations
INSERT OR IGNORE INTO _sqlx_migrations (version, description, installed_on, success, checksum, execution_time) 
VALUES 
  (20260103210000, 'create task history', datetime('now'), 1, X'00000000000000000000000000000000', 1),
  (20260107120000, 'add change requested event type', datetime('now'), 1, X'00000000000000000000000000000000', 1);
