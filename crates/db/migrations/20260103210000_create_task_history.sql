PRAGMA foreign_keys = ON;

CREATE TABLE task_history (
    id                BLOB PRIMARY KEY DEFAULT (randomblob(16)),
    task_id           BLOB NOT NULL,
    event_type        TEXT NOT NULL 
                          CHECK (event_type IN ('status_changed','description_changed','title_changed','pr_body_updated','other')),
    old_value         TEXT,
    new_value         TEXT,
    metadata          TEXT,  -- JSON for additional context
    created_at        TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE INDEX idx_task_history_task_id ON task_history(task_id);
CREATE INDEX idx_task_history_created_at ON task_history(created_at);
CREATE INDEX idx_task_history_event_type ON task_history(event_type);
