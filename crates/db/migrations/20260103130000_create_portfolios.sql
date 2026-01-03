-- Create portfolios table
CREATE TABLE portfolios (
    id          BLOB PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    theme       TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now', 'subsec')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now', 'subsec'))
);

-- Add portfolio_id to projects table
ALTER TABLE projects ADD COLUMN portfolio_id BLOB REFERENCES portfolios(id) ON DELETE SET NULL;

-- Create index for portfolio_id in projects
CREATE INDEX idx_projects_portfolio_id ON projects(portfolio_id);
