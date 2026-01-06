# Quick Start: Automatic Review Agent

## What is it?

When you move a task to "In Review" status (or when a coding agent finishes), an automatic review agent is triggered to examine your code changes and provide feedback in the chat history.

## How to use it

### Automatic Trigger
1. Start a coding agent task
2. Let it complete (or manually stop it)
3. Task automatically moves to "In Review" status
4. Review agent starts automatically
5. Check the chat history for review feedback

### What the Review Agent Does
- Examines git diffs and commits
- Checks code quality and best practices
- Identifies potential bugs or security issues
- Provides structured feedback with specific recommendations
- Highlights both issues and well-done aspects

### Review Output Format
The agent provides feedback like:

```
## Review Feedback

### Summary
Brief overview of what was changed

### Issues Found
- **Critical**: Security vulnerability in auth handler (auth.ts:42)
- **Moderate**: Missing error handling for API calls (api.ts:108)
- **Minor**: Consider using const instead of let (utils.ts:15)

### Positive Observations
- Clean component structure
- Good test coverage
- Proper error boundaries

### Recommendations
1. Add input validation for user data
2. Extract repeated logic into helper functions
3. Consider adding JSDoc comments

### Overall Assessment
Pass with suggestions - address critical issues before merging
```

## Important Notes

- **Read-Only**: The review agent cannot and will not modify your code
- **Advisory**: Feedback is for guidance only - you make the final decisions
- **No Loop**: Review agents don't trigger more review agents
- **Same Executor**: Uses the same AI model as your coding agent

## Configuration

Review behavior is defined in `REVIEW_AGENT.md`. You can customize:
- Review criteria
- Output format preferences
- Focus areas (security, performance, etc.)

## FAQ

**Q: Can I disable the automatic review?**
A: Currently, reviews trigger automatically. Future versions may add a toggle.

**Q: Does it count against my API usage?**
A: Yes, the review agent uses your configured executor (Claude, Codex, etc.)

**Q: Can I trigger a review manually?**
A: Currently, it only triggers when moving to "In Review" status.

**Q: What if I disagree with the feedback?**
A: The review is advisory only. You're free to ignore or modify based on your judgment.

**Q: Will it review every commit?**
A: It reviews the overall changes when the task is moved to review, not individual commits.
