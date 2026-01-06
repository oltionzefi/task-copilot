PRAGMA foreign_keys = ON;

-- Task Build History: Stores comprehensive build context for tasks
-- This includes all chat messages, execution steps, and context
-- Retention: 20 days, FIFO when exceeding 100 entries
CREATE TABLE task_build_history (
    id                BLOB PRIMARY KEY DEFAULT (randomblob(16)),
    task_id           BLOB NOT NULL,
    workspace_id      BLOB,  -- Optional reference to workspace if applicable
    session_id        BLOB,  -- Optional reference to session if applicable
    
    -- Build context data
    context_type      TEXT NOT NULL 
                          CHECK (context_type IN ('chat_message','execution_step','agent_turn','setup_complete','error','status_change')),
    
    -- The actual content/message
    content           TEXT NOT NULL,
    
    -- Additional metadata stored as JSON
    metadata          TEXT,  -- JSON: execution_process_id, exit_code, duration, etc.
    
    -- Timestamps
    created_at        TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    expires_at        TEXT NOT NULL DEFAULT (datetime('now', '+20 days', 'subsec')),
    
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL
);

-- Indexes for efficient querying
CREATE INDEX idx_task_build_history_task_id ON task_build_history(task_id, created_at DESC);
CREATE INDEX idx_task_build_history_expires_at ON task_build_history(expires_at);
CREATE INDEX idx_task_build_history_context_type ON task_build_history(context_type);
CREATE INDEX idx_task_build_history_workspace_id ON task_build_history(workspace_id);
CREATE INDEX idx_task_build_history_session_id ON task_build_history(session_id);

-- Trigger to enforce FIFO when exceeding 100 entries per task
CREATE TRIGGER trg_task_build_history_fifo
AFTER INSERT ON task_build_history
BEGIN
    DELETE FROM task_build_history
    WHERE id IN (
        SELECT id FROM task_build_history
        WHERE task_id = NEW.task_id
        ORDER BY created_at ASC
        LIMIT MAX(0, (
            SELECT COUNT(*) - 100
            FROM task_build_history
            WHERE task_id = NEW.task_id
        ))
    );
END;

-- Trigger to automatically clean up expired entries
CREATE TRIGGER trg_task_build_history_cleanup_expired
AFTER INSERT ON task_build_history
BEGIN
    DELETE FROM task_build_history
    WHERE datetime(expires_at) < datetime('now');
END;
