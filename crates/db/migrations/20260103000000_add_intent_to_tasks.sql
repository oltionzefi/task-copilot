-- Add intent field to tasks table to define which module to use
ALTER TABLE tasks ADD COLUMN intent TEXT NOT NULL DEFAULT 'code'
    CHECK (intent IN ('code','jira'));
