# Mermaid Component Usage

The Mermaid component allows you to display flow diagrams and other Mermaid charts in your application.

## Components

### MermaidViewer
A standalone component to render Mermaid diagrams.

### MermaidDialog
A dialog component that displays Mermaid diagrams in a modal.

## Usage Examples

### Using MermaidViewer directly

```tsx
import { MermaidViewer } from '@/components/ui/mermaid-viewer';

function MyComponent() {
  const chart = `
    graph TD
      A[Start] --> B{Decision}
      B -->|Yes| C[Action 1]
      B -->|No| D[Action 2]
      C --> E[End]
      D --> E
  `;

  return <MermaidViewer chart={chart} className="my-4" />;
}
```

### Using MermaidDialog

```tsx
import { MermaidDialog } from '@/components/dialogs';
import { Button } from '@/components/ui/button';

function MyComponent() {
  const handleShowDiagram = () => {
    const flowChart = `
      sequenceDiagram
        participant User
        participant Frontend
        participant Backend
        participant Database
        
        User->>Frontend: Submit Form
        Frontend->>Backend: POST /api/data
        Backend->>Database: Save Data
        Database-->>Backend: Success
        Backend-->>Frontend: 200 OK
        Frontend-->>User: Show Success Message
    `;

    MermaidDialog.show({
      title: 'Application Flow',
      description: 'This diagram shows the data flow in the application',
      chart: flowChart,
    });
  };

  return (
    <Button onClick={handleShowDiagram}>
      Show Flow Diagram
    </Button>
  );
}
```

## Supported Diagram Types

Mermaid supports various diagram types:

- **Flowcharts**: `graph TD` or `graph LR`
- **Sequence Diagrams**: `sequenceDiagram`
- **Class Diagrams**: `classDiagram`
- **State Diagrams**: `stateDiagram-v2`
- **Entity Relationship Diagrams**: `erDiagram`
- **User Journey**: `journey`
- **Gantt Charts**: `gantt`
- **Pie Charts**: `pie`
- **Git Graphs**: `gitGraph`

## Example Diagrams

### Flowchart
```
graph TD
  A[Start] --> B{Is it working?}
  B -->|Yes| C[Great!]
  B -->|No| D[Debug]
  D --> A
```

### Sequence Diagram
```
sequenceDiagram
  Alice->>Bob: Hello Bob!
  Bob-->>Alice: Hi Alice!
```

### State Diagram
```
stateDiagram-v2
  [*] --> Idle
  Idle --> Processing : Start
  Processing --> Success : Complete
  Processing --> Failed : Error
  Success --> [*]
  Failed --> Idle : Retry
```

For more information, visit [Mermaid Documentation](https://mermaid.js.org/).
