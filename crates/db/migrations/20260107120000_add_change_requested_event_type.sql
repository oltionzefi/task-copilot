PRAGMA foreign_keys = ON;

-- Rename the old table
ALTER TABLE task_history RENAME TO task_history_old;

-- Create new task_history table with the new event type
CREATE TABLE task_history (
    id                BLOB PRIMARY KEY DEFAULT (randomblob(16)),
    task_id           BLOB NOT NULL,
    event_type        TEXT NOT NULL 
                          CHECK (event_type IN ('status_changed','description_changed','title_changed','pr_body_updated','change_requested','other')),
    old_value         TEXT,
    new_value         TEXT,
    metadata          TEXT,  -- JSON for additional context
    created_at        TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Copy data from old table to new table
INSERT INTO task_history (id, task_id, event_type, old_value, new_value, metadata, created_at)
SELECT id, task_id, event_type, old_value, new_value, metadata, created_at
FROM task_history_old;

-- Drop the old table
DROP TABLE task_history_old;

-- Recreate indexes
CREATE INDEX idx_task_history_task_id ON task_history(task_id);
CREATE INDEX idx_task_history_created_at ON task_history(created_at);
CREATE INDEX idx_task_history_event_type ON task_history(event_type);
