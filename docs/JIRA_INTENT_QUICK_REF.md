# Jira Intent Task - Quick Reference

## Quick Start

```typescript
import { show } from '@ebay/nice-modal-react';
import { JiraIntentTaskDialog } from '@/components/dialogs';

show(JiraIntentTaskDialog, { task });
```

## Workflow

1. **Input** → Select issue type & provide description
2. **Generate** → Template is created with best practices
3. **Review** → Edit and approve the generated content

## Issue Types & Templates

| Type | Use Case | Template Includes |
|------|----------|-------------------|
| **Bug** | Software defects | Reproduction steps, expected/actual behavior, environment |
| **Task** | Work items | Overview, context, implementation details |
| **Story** | User features | User story format, goals, value statement |

## Best Practices by Type

### Bug
- ✅ Clear reproduction steps
- ✅ Expected vs actual behavior  
- ✅ Environment details

### Task
- ✅ Clear objective
- ✅ Acceptance criteria
- ✅ Dependencies

### Story
- ✅ User perspective
- ✅ Value statement
- ✅ Acceptance criteria

## Features

- 📝 Three-step workflow (Input → Generate → Review)
- 🎯 Type-specific best practices
- ✏️ Click-to-edit all sections
- 🔄 Revision support
- 💾 Memory management (auto-clear on approve/cancel)
- 🚫 No code reading or generation

## Component Props

```typescript
interface JiraIntentTaskDialogProps {
  task: TaskWithAttemptStatus;
}
```

## Generated Sections

1. **Description** - Main ticket content
2. **Acceptance Criteria** - Completion checklist
3. **Additional Information** - Technical notes, dependencies

## Keyboard Shortcuts

- `Esc` - Close dialog
- `Click` - Edit any section in review mode

## Integration Example

```typescript
// In a task menu
<MenuItem onClick={() => show(JiraIntentTaskDialog, { task })}>
  Create Jira Ticket
</MenuItem>
```

## Customization Points

- Replace `generateJiraTemplate()` for API integration
- Add custom templates via props
- Extend with AI generation
- Connect to actual Jira API for ticket creation

## Common Use Cases

1. **Task Menu Action** - Right-click on task → Create Jira Ticket
2. **Toolbar Button** - Add to task toolbar
3. **Bulk Operations** - Generate tickets for multiple tasks
4. **Status Transitions** - Auto-prompt when task reaches certain status
5. **Keyboard Shortcut** - Bind to hotkey for quick access

## Memory Lifecycle

```
Open Dialog → State Created
     ↓
Input & Generate → State Updated
     ↓
Review & Edit → State Modified
     ↓
Approve/Cancel → State Cleared
```

## Tips

💡 **Detailed descriptions** = Better templates  
💡 **Choose correct type** = Appropriate structure  
💡 **Review thoroughly** = Quality tickets  
💡 **Edit freely** = Perfect fit for your workflow  
💡 **Use best practices** = Consistent tickets  

## Architecture

```
JiraIntentTaskDialog
│
├─ Input Step
│  ├─ Issue Type Selector
│  ├─ Description Editor
│  └─ Best Practices Panel
│
├─ Generating Step
│  └─ Loading Indicator
│
└─ Review Step
   ├─ Description (editable)
   ├─ Acceptance Criteria (editable)
   └─ Additional Info (editable)
```

## Key Functions

- `handleGenerate()` - Start generation
- `handleRevise()` - Return to input
- `handleApprove()` - Finalize & clear
- `handleUpdateField()` - Edit section

## Files

- Component: `frontend/src/components/dialogs/tasks/JiraIntentTaskDialog.tsx`
- Docs: `docs/JIRA_INTENT_TASK.md`
- Examples: `docs/examples/jira-intent-task-usage.tsx`

## Support

For detailed information, see:
- Full documentation in `docs/JIRA_INTENT_TASK.md`
- Usage examples in `docs/examples/jira-intent-task-usage.tsx`
- Implementation summary in `JIRA_INTENT_IMPLEMENTATION.md`
