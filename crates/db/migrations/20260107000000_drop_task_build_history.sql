-- Drop the unused task_build_history table
-- This table was designed to store full conversation context but was never actually used
-- Keeping the lightweight task_history table for audit trail

DROP TABLE IF EXISTS task_build_history;
