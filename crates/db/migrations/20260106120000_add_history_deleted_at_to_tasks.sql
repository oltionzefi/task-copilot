PRAGMA foreign_keys = ON;

ALTER TABLE tasks ADD COLUMN history_deleted_at TEXT;

CREATE INDEX idx_tasks_history_deleted_at ON tasks(history_deleted_at);
