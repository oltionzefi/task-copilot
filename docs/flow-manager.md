# Flow Manager

The Flow Manager is a module that defines and executes actions based on different intents (code, Jira, Confluence). It provides a structured approach to handling different types of tasks with predefined workflows.

## Overview

The Flow Manager provides three main flow types:

1. **Code Flow** - For implementing code changes in repositories
2. **Jira Flow** - For analyzing and creating Jira task proposals (read-only, no code modifications)
3. **Confluence Flow** - For generating documentation content (read-only, no code modifications)

## Core Concepts

### FlowIntent

An enumeration representing the type of workflow:

```rust
pub enum FlowIntent {
    Code,
    Jira,
    Confluence,
}
```

### FlowAction

Represents a single action within a flow:

```rust
pub struct FlowAction {
    pub name: String,
    pub description: String,
    pub status: FlowActionStatus,
}
```

### FlowActionStatus

Status of an action:

```rust
pub enum FlowActionStatus {
    Pending,
    InProgress,
    Completed,
    Failed,
}
```

### FlowSummary

Complete summary of a flow with all its actions:

```rust
pub struct FlowSummary {
    pub intent: FlowIntent,
    pub description: String,
    pub actions: Vec<FlowAction>,
}
```

## Usage

### Creating a Flow Manager

```rust
use services::services::flow_manager::{FlowManager, FlowIntent};

let manager = FlowManager::new(FlowIntent::Code);
```

### Code Flow

The Code flow is designed for implementing code changes with the following actions:

1. **Check Existing Code** - Analyze current codebase
2. **Create Issue** - Create task tracking issue
3. **Implement Solution** - Generate code changes
4. **Fix Issues** - Address errors or test failures
5. **Override Files** - Apply changes to repository files

```rust
use services::services::flow_manager::{CodeFlowInput, FlowManager, FlowIntent};

let manager = FlowManager::new(FlowIntent::Code);
let input = CodeFlowInput {
    title: "Add authentication feature".to_string(),
    description: "Implement JWT-based authentication".to_string(),
    repository_path: Some("/path/to/repo".to_string()),
};

let mut summary = manager.create_code_flow(&input)?;

// Execute the flow
let actions = manager.execute_flow(&mut summary)?;
```

### Jira Flow

The Jira flow analyzes requirements and generates task proposals **without modifying local code**:

1. **Read Title & Description** - Parse Jira requirements
2. **Analyze Requirements** - Use agents to determine best approach
3. **Generate Task Proposal** - Create detailed implementation plan
4. **Review Jira** - Present proposal for review
5. **Finalize** - Confirm and save the proposal

```rust
use services::services::flow_manager::{JiraFlowInput, FlowManager, FlowIntent};

let manager = FlowManager::new(FlowIntent::Jira);
let input = JiraFlowInput {
    title: "PROJ-123: Database migration".to_string(),
    description: "Migrate from MySQL to PostgreSQL".to_string(),
    project_key: Some("PROJ".to_string()),
};

let mut summary = manager.create_jira_flow(&input)?;
let actions = manager.execute_flow(&mut summary)?;

// Note: Review Jira and Finalize actions remain in Pending status
// as they require user interaction
```

### Confluence Flow

The Confluence flow generates documentation content **without modifying local code**:

1. **Read Title & Description** - Parse documentation requirements
2. **Analyze Documentation Needs** - Determine best structure
3. **Generate Documentation** - Create comprehensive content
4. **Review Confluence** - Present documentation for review
5. **Finalize** - Confirm and save the documentation

```rust
use services::services::flow_manager::{ConfluenceFlowInput, FlowManager, FlowIntent};

let manager = FlowManager::new(FlowIntent::Confluence);
let input = ConfluenceFlowInput {
    title: "API Documentation".to_string(),
    description: "Document REST API endpoints".to_string(),
    space_key: Some("DEV".to_string()),
};

let mut summary = manager.create_confluence_flow(&input)?;
let actions = manager.execute_flow(&mut summary)?;

// Note: Review Confluence and Finalize actions remain in Pending status
// as they require user interaction
```

## TypeScript Integration

The Flow Manager types are automatically exported to TypeScript via `ts-rs`:

```typescript
import type {
  FlowIntent,
  FlowAction,
  FlowActionStatus,
  FlowSummary,
} from '../shared/types';

const intent: FlowIntent = 'code'; // or 'jira' or 'confluence'
const status: FlowActionStatus = 'pending'; // or 'inprogress', 'completed', 'failed'
```

## Important Notes

### Code Flow vs. Non-Code Flows

- **Code Flow**: Modifies local repository files, creates issues, and implements solutions
- **Jira Flow**: Read-only analysis and proposal generation - **DOES NOT MODIFY LOCAL CODE**
- **Confluence Flow**: Read-only documentation generation - **DOES NOT MODIFY LOCAL CODE**

### Action Execution

The `execute_flow` method simulates action execution. In a production environment, you would integrate this with actual:

- Git operations
- Issue tracking systems
- Code analysis tools
- Documentation generators

### Error Handling

All flow operations return `Result<T, FlowError>`:

```rust
pub enum FlowError {
    InvalidIntent(String),
    ExecutionFailed(String),
    ConfigError(String),
}
```

## Testing

The module includes comprehensive unit tests:

```bash
cargo test --package services flow_manager --lib
```

## Future Enhancements

Potential improvements for the Flow Manager:

1. **Async Execution** - Support for async workflows
2. **Custom Actions** - Allow users to define custom actions
3. **Action Dependencies** - Define dependencies between actions
4. **Rollback Support** - Ability to rollback failed actions
5. **Progress Tracking** - Real-time progress updates
6. **Integration Hooks** - Webhooks for external integrations
7. **Action Validation** - Pre-execution validation checks
8. **Parallel Execution** - Run independent actions in parallel

## See Also

- [Jira Integration](./jira-integration.md)
- [Agents Documentation](../AGENTS.md)
- [Services Module](../crates/services/)
