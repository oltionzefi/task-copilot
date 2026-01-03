# Jira Integration Module

The Jira integration module provides a Rust client for connecting to Atlassian Jira using API tokens. This allows users to interact with Jira projects, issues, and workflows programmatically.

## Features

- **Authentication**: Uses Jira API tokens for secure authentication in user context
- **Project Management**: List and retrieve Jira projects
- **Issue Management**: Create, read, update, and search issues
- **Workflow Operations**: Transition issues between statuses
- **Comments**: Add comments to issues
- **JQL Support**: Search issues using Jira Query Language

## Configuration

To use the Jira client, you need:

1. **Base URL**: Your Jira instance URL (e.g., `https://your-domain.atlassian.net`)
2. **Email**: The email address associated with your Jira account
3. **API Token**: A Jira API token (create one at https://id.atlassian.com/manage-profile/security/api-tokens)

## Usage

### Creating a Client

```rust
use services::jira::JiraClient;

let client = JiraClient::new(
    "https://your-domain.atlassian.net".to_string(),
    "user@example.com".to_string(),
    "your-api-token".to_string(),
)?;

// Test the connection
client.test_connection().await?;
```

### Working with Projects

```rust
// List all accessible projects
let projects = client.get_projects().await?;

// Get a specific project
let project = client.get_project("PROJ").await?;
```

### Working with Issues

```rust
use services::jira::{CreateJiraIssueRequest, UpdateJiraIssueRequest};

// Get issues from a project
let issues = client.get_issues("PROJ", Some(50)).await?;

// Get a specific issue
let issue = client.get_issue("PROJ-123").await?;

// Create a new issue
let request = CreateJiraIssueRequest {
    project_key: "PROJ".to_string(),
    summary: "New task".to_string(),
    description: Some("Task description".to_string()),
    issue_type: "Task".to_string(),
    priority: Some("Medium".to_string()),
    assignee_id: None,
};
let new_issue = client.create_issue(&request).await?;

// Update an issue
let update_request = UpdateJiraIssueRequest {
    summary: Some("Updated summary".to_string()),
    description: Some("Updated description".to_string()),
    assignee_id: None,
    priority: None,
};
client.update_issue("PROJ-123", &update_request).await?;
```

### Searching with JQL

```rust
// Search using Jira Query Language
let issues = client.search_issues(
    "project = PROJ AND status = 'In Progress'",
    Some(100),
).await?;
```

### Workflow Transitions

```rust
// Get available transitions for an issue
let transitions = client.get_transitions("PROJ-123").await?;

// Transition an issue to a new status
client.transition_issue("PROJ-123", &transitions[0].id).await?;
```

### Adding Comments

```rust
// Add a comment to an issue
client.add_comment("PROJ-123", "This is a comment").await?;
```

## Error Handling

The module provides comprehensive error handling through the `JiraError` enum:

- `AuthFailed`: Authentication with Jira failed
- `InvalidConfig`: Invalid configuration (empty URL, email, or token)
- `RequestFailed`: API request failed
- `NotFound`: Resource not found
- `PermissionDenied`: Insufficient permissions
- `NetworkError`: Network-related errors
- `JsonError`: JSON parsing errors

## TypeScript Types

The module automatically generates TypeScript types for use in the frontend:

- `JiraIssue`: Represents a Jira issue
- `JiraProject`: Represents a Jira project
- `JiraUser`: Represents a Jira user
- `JiraTransition`: Represents a workflow transition
- `JiraStatus`: Represents an issue status

These types are exported via `ts-rs` and can be found in the shared types file after running `pnpm run generate-types`.

## Security Considerations

- API tokens are sensitive credentials and should never be committed to version control
- Use environment variables or secure credential storage for API tokens
- The client uses HTTPS for all API calls to Atlassian's servers
- Basic authentication is used with the email and API token

## Testing

The module includes unit tests for basic functionality:

```bash
cargo test jira --lib
```

## Future Enhancements

Potential future additions:

- Attachment support
- Sprint management for Jira Software
- Advanced field customization
- Bulk operations
- Webhooks integration
- Rate limiting and retry logic improvements
