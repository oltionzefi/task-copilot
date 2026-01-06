-- Add 'reviewagent' to execution_process_run_reason constraint
-- Following the same pattern as adding cleanupscript and devserver

-- 1. Add the replacement column with the wider CHECK
ALTER TABLE execution_processes
  ADD COLUMN run_reason_new TEXT NOT NULL DEFAULT 'setupscript'
    CHECK (run_reason_new IN ('setupscript',
                              'cleanupscript',
                              'codingagent',
                              'reviewagent',   -- new value for automatic code review
                              'devserver'));

-- 2. Copy existing values across
UPDATE execution_processes
  SET run_reason_new = run_reason;

-- 3. Drop all indexes that reference the old run_reason column
DROP INDEX IF EXISTS idx_execution_processes_run_reason;
DROP INDEX IF EXISTS idx_execution_processes_session_status_run_reason;
DROP INDEX IF EXISTS idx_execution_processes_session_run_reason_created;

-- 4. Remove the old column (requires SQLite 3.35+)
ALTER TABLE execution_processes DROP COLUMN run_reason;

-- 5. Rename the new column back to the canonical name
ALTER TABLE execution_processes
  RENAME COLUMN run_reason_new TO run_reason;

-- 6. Re-create all indexes with the new column
CREATE INDEX idx_execution_processes_run_reason
        ON execution_processes(run_reason);

CREATE INDEX idx_execution_processes_session_status_run_reason
        ON execution_processes (session_id, status, run_reason);

CREATE INDEX idx_execution_processes_session_run_reason_created
        ON execution_processes (session_id, run_reason, created_at DESC);
