# Database Schema Viewer

A visual database schema viewer component for tasks with "confluence" intent type. This feature allows users to view database schema definitions visually, with support for screenshots and downloads.

## Features

- **Visual Schema Display**: Shows tables, columns, and relationships in an interactive diagram
- **Pan & Zoom**: Navigate large schemas with mouse controls
- **Screenshot Export**: Capture the schema as a PNG image using html2canvas
- **JSON Export**: Download the schema definition as a JSON file
- **Smart Parsing**: Automatically extracts schema from task descriptions
- **Relationship Visualization**: Displays foreign key relationships between tables

## Usage

### Automatic Display

When a task has `intent: "confluence"`, a "View Schema" button appears:
- On the task card in the kanban board
- In the task detail panel

### Schema Definition Format

The parser supports multiple formats in task descriptions:

#### 1. SQL CREATE TABLE Syntax
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP
)
```

#### 2. Markdown Tables
```markdown
## users
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, NOT NULL |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
```

#### 3. Simple Format
```
Table: users {
  id UUID PRIMARY KEY,
  email VARCHAR NOT NULL
}
```

### Controls

- **Zoom In/Out**: Use the zoom buttons or scroll wheel
- **Pan**: Click and drag the canvas
- **Reset View**: Click the maximize button to reset zoom and position
- **Screenshot**: Captures the entire schema as PNG
- **Download JSON**: Exports schema structure for external tools

## Components

### `DbSchemaViewerDialog`
Main dialog component displaying the schema visualization.

**Props:**
- `tables: DbTable[]` - Array of table definitions
- `relations?: DbRelation[]` - Optional relationships between tables
- `title?: string` - Dialog title (defaults to "Database Schema")

### `DbSchemaViewerButton`
Button component that triggers the schema viewer.

**Props:**
- `task: Task` - The task object (must have `intent: "confluence"`)
- `variant?: string` - Button variant
- `size?: string` - Button size
- `className?: string` - Additional CSS classes

### `parseDbSchemaFromText()`
Utility function to extract schema information from text.

**Usage:**
```typescript
import { parseDbSchemaFromText } from '@/lib/dbSchemaParser';

const { tables, relations } = parseDbSchemaFromText(taskDescription);
```

## Visual Legend

- **PK** = Primary Key (highlighted in yellow)
- **FK** = Foreign Key (blue indicator)
- **UQ** = Unique constraint
- **NN** = Not Null constraint

## Example Schema

If no schema is found in the task description, an example schema is displayed with:
- `users` table with id, email, username
- `posts` table with user relationship
- `comments` table with post and user relationships

## Files

- `frontend/src/components/dialogs/tasks/DbSchemaViewerDialog.tsx` - Main viewer dialog
- `frontend/src/components/tasks/DbSchemaViewerButton.tsx` - Trigger button component
- `frontend/src/lib/dbSchemaParser.ts` - Schema parsing utilities
- `frontend/src/components/panels/TaskPanel.tsx` - Integration in task panel
- `frontend/src/components/tasks/TaskCard.tsx` - Integration in task card

## Dependencies

- `html2canvas` - For screenshot functionality
- `@ebay/nice-modal-react` - Modal management
- Lucide React icons - UI icons

## Future Enhancements

Possible improvements:
- Support for more SQL dialects
- Interactive table repositioning
- Export to other formats (SQL, GraphQL schema, etc.)
- AI-assisted schema generation
- Collaboration features for schema design
