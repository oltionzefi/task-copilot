# Agentic Review Strategy

## Overview

This document outlines the strategy for implementing efficient agentic code review functionality in Task Copilot without interfering with the existing task execution stream.

## Current Architecture Analysis

### Existing Stream Infrastructure

1. **Event Streaming System** (`crates/services/src/services/events/streams.rs`)
   - Uses broadcast channels with `MsgStore` for pub/sub messaging
   - SSE endpoint (`/api/events`) streams all events
   - WebSocket endpoints for filtered streams (tasks, projects, execution processes, scratch)
   - JSON Patch format for efficient state updates
   - Initial snapshot + live updates pattern

2. **Task Execution Flow**
   - Workspace → Session → ExecutionProcess (with RunReason enum)
   - ExecutionProcesses track different run reasons: `CodingAgent`, `SetupScript`, `CleanupScript`, `ReviewAgent`
   - Each process gets its own MsgStore instance for isolated logging
   - Logs are processed via `execution_process_logs` table
   - Frontend consumes via WebSocket at `/api/execution-processes/{id}/ws`

3. **Frontend Integration**
   - `useJsonPatchWsStream` hook for WebSocket JSON Patch consumption
   - `useProjectTasks` streams task updates per project
   - `useExecutionProcesses` streams execution process updates per workspace
   - State management via JSON Patch operations on object trees

## Problem Statement

**Challenge**: Provide agentic code review that:
1. Runs independently without blocking/interfering with task execution
2. Doesn't share the same stream as active task execution (prevents UI confusion)
3. Efficiently delivers review feedback to the frontend
4. Can be triggered on-demand or automatically
5. Maintains historical review data for audit trail

## Proposed Solution Architecture

### 1. Dedicated Review Stream Infrastructure

#### Backend Components

**A. Review Execution Process Type** ✅ (Already exists)
- `ExecutionProcessRunReason::ReviewAgent` already defined
- Leverage existing execution infrastructure
- Review agents run in isolated processes, just like coding agents

**B. Separate Review Stream Endpoint** (New)
```rust
// Route: /api/reviews/stream/ws?workspace_id={id}
pub async fn stream_reviews_ws(
    ws: WebSocketUpgrade,
    State(deployment): State<DeploymentImpl>,
    Query(query): Query<ReviewStreamQuery>,
) -> impl IntoResponse
```

**Key Features**:
- Filter `ExecutionProcess` by `run_reason = ReviewAgent` only
- Separate WebSocket connection from task execution stream
- Independent connection lifecycle management
- JSON Patch format for consistency

**C. Review-Specific Data Model** (Enhancement)

Add review metadata to track:
```rust
// Extension to ExecutionProcess for review context
pub struct ReviewMetadata {
    pub review_id: Uuid,
    pub target_execution_id: Uuid,  // The execution being reviewed
    pub review_status: ReviewStatus,
    pub findings_count: Option<i32>,
    pub severity_level: Option<ReviewSeverity>,
}

pub enum ReviewStatus {
    InProgress,
    Completed,
    Failed,
}

pub enum ReviewSeverity {
    Critical,    // Blocking issues
    Major,       // Important concerns
    Minor,       // Suggestions
    Info,        // Informational
}
```

**D. Review Stream Service** (New)
```rust
// In crates/services/src/services/events/streams.rs
impl EventService {
    pub async fn stream_reviews_for_workspace_raw(
        &self,
        workspace_id: Uuid,
    ) -> Result<BoxStream<'static, Result<LogMsg, io::Error>>, EventError> {
        // Get all review execution processes for workspace
        // Filter broadcast stream for review-related events
        // Return snapshot + live updates
    }
}
```

### 2. Frontend Integration

#### New Hooks

**A. `useReviewStream` Hook**
```typescript
// frontend/src/hooks/useReviewStream.ts
export const useReviewStream = (workspaceId: string) => {
  const endpoint = `/api/reviews/stream/ws?workspace_id=${workspaceId}`;
  
  const { data, isConnected, error } = useJsonPatchWsStream(
    endpoint,
    !!workspaceId,
    () => ({ reviews: {} })
  );
  
  // Transform review execution processes for UI
  // Separate from task execution processes
  
  return {
    reviews,
    activeReview,
    reviewHistory,
    isConnected,
    error
  };
};
```

**B. Review UI Components**

- **ReviewPanel**: Separate panel/tab showing review progress
- **ReviewFeedback**: Structured display of review findings
- **ReviewHistory**: List of past reviews with status
- **ReviewTrigger**: Button to initiate on-demand review

### 3. Review Trigger Mechanisms

#### A. Manual Trigger (User-Initiated)
```typescript
// API endpoint
POST /api/workspaces/{workspace_id}/reviews

// Creates new execution process with ReviewAgent run reason
// User clicks "Request Review" button
// Starts independent review execution
```

#### B. Automatic Trigger (Event-Based)

**Trigger Points**:
1. **On Task Completion**: When coding agent finishes
2. **On Status Change**: Task moves to "In Review" status
3. **On PR Creation**: After merge commit
4. **Scheduled**: Periodic reviews for long-running tasks

**Implementation**:
```rust
// In container service, after coding agent completes
if should_auto_review(&task, &config) {
    self.start_review_agent(
        &workspace,
        &task,
        executor_profile_id,
    ).await?;
}
```

### 4. Efficiency Optimizations

#### A. Stream Isolation
- **Separate WebSocket connections** prevent review logs from mixing with task logs
- **Independent MsgStore instances** for each review process
- **Filtered broadcast streams** ensure only relevant events reach each client
- **Connection pooling** reuses WebSocket infrastructure

#### B. Resource Management
- **Lazy connection**: Review stream only connects when review panel is open
- **Automatic cleanup**: Close review WebSocket when panel closes
- **Debouncing**: Prevent multiple review triggers in quick succession
- **Rate limiting**: Limit concurrent reviews per workspace

#### C. Data Efficiency
- **Incremental updates**: JSON Patch for minimal data transfer
- **Compression**: Enable WebSocket compression for review content
- **Pagination**: Load review history on-demand
- **Retention policy**: Archive old review logs after N days

### 5. Review Agent Configuration

#### A. Review-Specific Prompt
Already implemented in `ReviewAgentRequest::build_review_prompt()`:
- Read-only mode instructions
- Structured feedback format
- Focus on git diff analysis
- Quality, security, and performance checks

#### B. Executor Profile Selection
```rust
pub struct ReviewAgentConfig {
    pub default_executor: ExecutorProfileId,
    pub auto_review_enabled: bool,
    pub auto_review_triggers: Vec<ReviewTrigger>,
    pub review_checklist: Vec<String>,
}
```

#### C. Review Context
Provide review agent with:
- Task description and requirements
- Related PR/commit information
- Previous review history (if any)
- Project coding standards
- Test coverage metrics

### 6. Database Schema Additions

```sql
-- Optional: Dedicated review tracking table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id),
    execution_process_id UUID NOT NULL REFERENCES execution_processes(id),
    target_execution_id UUID REFERENCES execution_processes(id),
    status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'failed')),
    findings_count INTEGER,
    severity_level TEXT CHECK (severity_level IN ('critical', 'major', 'minor', 'info')),
    summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX idx_reviews_workspace ON reviews(workspace_id);
CREATE INDEX idx_reviews_status ON reviews(status);
```

Alternatively, extend `execution_processes` with review-specific JSON metadata.

### 7. API Endpoints

#### Review Management
```
POST   /api/workspaces/{id}/reviews              # Start new review
GET    /api/workspaces/{id}/reviews              # List reviews
GET    /api/reviews/{id}                         # Get review details
DELETE /api/reviews/{id}                         # Cancel review
WS     /api/reviews/stream/ws                    # Review stream
```

#### Review Configuration
```
GET    /api/projects/{id}/review-config          # Get review settings
PUT    /api/projects/{id}/review-config          # Update review settings
```

## Key Benefits

### 1. **Stream Isolation**
- Review process completely separate from task execution
- No interference with main task UI/UX
- Independent error handling

### 2. **Efficiency**
- Reuses existing WebSocket infrastructure
- JSON Patch for minimal bandwidth
- Lazy loading of review data
- Optional connection (only when needed)

### 3. **Scalability**
- Multiple concurrent reviews per workspace
- Historical review data without cluttering main stream
- Configurable retention and archival

### 4. **User Experience**
- Clear separation between "doing" and "reviewing"
- On-demand reviews when user needs them
- Automatic reviews for convenience
- Structured, actionable feedback

### 5. **Flexibility**
- Pluggable review agents (any executor)
- Configurable review triggers
- Customizable review prompts
- Integration with existing approval workflows

## Technical Considerations

### Concurrency
- Allow review while task is still in progress
- Handle multiple reviews for same workspace
- Queue reviews if needed (rate limiting)

### State Management
- Review state independent of task state
- Task status transitions don't affect review status
- Reviews can reference completed executions

### Error Handling
- Review failure doesn't affect task status
- Retry logic for transient failures
- Clear error messages to user

### Security
- Same authentication/authorization as task execution
- Review logs stored with same security as task logs
- Access control per workspace/project

## Example User Flow

### Manual Review Flow
1. User completes task execution
2. User opens "Review" tab in workspace
3. User clicks "Request Review" button
4. Review stream connects (WebSocket)
5. Review agent starts executing in background
6. Review progress shown in real-time
7. Review completes, structured feedback displayed
8. User can view, export, or share review

### Automatic Review Flow
1. Coding agent completes task
2. Task status changes to "In Review"
3. System automatically triggers review (if enabled)
4. Review runs in background
5. Notification sent when review completes
6. User opens review panel to see findings
7. User addresses issues or approves changes

## Monitoring & Observability

### Metrics
- Review duration (p50, p95, p99)
- Review success/failure rates
- Concurrent review count
- WebSocket connection count
- Review findings per severity

### Logging
- Review start/complete events
- Stream connection lifecycle
- Error conditions and retries
- Performance bottlenecks

## Future Enhancements

### Advanced Features
1. **Collaborative Reviews**: Multiple reviewers per task
2. **Review Templates**: Pre-defined review checklists
3. **Review Comments**: Inline comments on specific files/lines
4. **Review Approvals**: Formal approval workflow
5. **Review Metrics**: Code quality trends over time
6. **AI Review Insights**: Aggregate findings across projects
7. **Review Notifications**: Slack/Teams/Email integration
8. **Review Comparison**: Compare reviews from different agents

### Integration Opportunities
1. **PR Integration**: Link reviews to GitHub/GitLab PRs
2. **JIRA Integration**: Create tickets from review findings
3. **Slack Integration**: Post review summaries to channels
4. **IDE Integration**: Push review comments to VS Code
