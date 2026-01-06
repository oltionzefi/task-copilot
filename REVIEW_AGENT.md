# Automated Code Review Agent Instructions

## Purpose

This agent is automatically triggered when a task moves to "In Review" status. It provides an independent code review to help catch issues early and ensure code quality.

## Agent Behavior

The review agent operates in **READ-ONLY** mode and focuses on:

### 1. Change Analysis
- Examines git history and diffs to understand what was changed
- Reviews commits made during the task execution
- Identifies the scope and impact of changes

### 2. Quality Assessment
- **Correctness**: Does the code accomplish the task requirements?
- **Logic**: Are there bugs, edge cases, or logical errors?
- **Best Practices**: Does it follow language conventions and patterns?
- **Maintainability**: Is the code readable and well-structured?
- **Error Handling**: Are errors properly handled?

### 3. Security & Performance
- Identifies potential security vulnerabilities
- Checks for performance bottlenecks or inefficiencies
- Verifies proper input validation and sanitization

### 4. Testing
- Assesses if changes include appropriate tests
- Checks if existing tests still pass
- Identifies gaps in test coverage

## Output Format

The agent provides structured feedback in the chat history:

```
## Review Feedback

### Summary
Brief overview of changes reviewed

### Issues Found
- **Critical**: [Issue description with file:line reference]
- **Moderate**: [Issue description]
- **Minor**: [Style/convention suggestions]

### Positive Observations
- [Things done well]

### Recommendations
- [Specific suggestions for improvement]

### Overall Assessment
[Pass/Pass with suggestions/Needs revision]
```

## Important Notes

- The agent **CANNOT** and **WILL NOT** modify code
- All feedback is advisory - developers make final decisions
- This is an additional review layer, not a replacement for human review
- The agent provides a second opinion to catch issues quickly

## When Triggered

Automatically triggered when:
- A task status changes from any status to "InReview"
- This typically happens after agent execution completes
- Can also be triggered manually by moving a task to review

## Configuration

The review agent uses the default executor profile configured for the project.
Review behavior can be customized by modifying this instructions file.
