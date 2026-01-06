import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MermaidViewer } from '@/components/ui/mermaid-viewer';
import { MermaidDialog } from '@/components/dialogs';
import { Separator } from '@/components/ui/separator';

const exampleFlowchart = `graph TD
  A[Start Task] --> B{Code Complete?}
  B -->|Yes| C[Run Tests]
  B -->|No| D[Continue Coding]
  D --> B
  C --> E{Tests Pass?}
  E -->|Yes| F[Create PR]
  E -->|No| G[Fix Issues]
  G --> C
  F --> H[End]`;

const exampleSequenceDiagram = `sequenceDiagram
  participant User
  participant UI
  participant API
  participant Database
  
  User->>UI: Create Task
  UI->>API: POST /tasks
  API->>Database: INSERT task
  Database-->>API: Success
  API-->>UI: Task Created
  UI-->>User: Show Confirmation`;

const exampleStateDiagram = `stateDiagram-v2
  [*] --> Backlog
  Backlog --> InProgress : Start Task
  InProgress --> InReview : Submit for Review
  InReview --> InProgress : Request Changes
  InReview --> Done : Approve
  Done --> [*]`;

export function MermaidShowcase() {
  const [selectedExample, setSelectedExample] = useState<string>(exampleFlowchart);

  const openInDialog = (chart: string, title: string) => {
    // @ts-expect-error - show method exists at runtime via defineModal
    MermaidDialog.show({
      title,
      description: 'This diagram is displayed in a dialog',
      chart,
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Mermaid Component Showcase</h1>
        <p className="text-muted-foreground">
          Display flow diagrams and other Mermaid charts in your application
        </p>
      </div>

      <Separator />

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Inline Viewer</h2>
        <div className="flex gap-2">
          <Button
            onClick={() => setSelectedExample(exampleFlowchart)}
            variant={selectedExample === exampleFlowchart ? 'default' : 'outline'}
          >
            Flowchart
          </Button>
          <Button
            onClick={() => setSelectedExample(exampleSequenceDiagram)}
            variant={selectedExample === exampleSequenceDiagram ? 'default' : 'outline'}
          >
            Sequence Diagram
          </Button>
          <Button
            onClick={() => setSelectedExample(exampleStateDiagram)}
            variant={selectedExample === exampleStateDiagram ? 'default' : 'outline'}
          >
            State Diagram
          </Button>
        </div>
        <MermaidViewer chart={selectedExample} />
      </div>

      <Separator />

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Dialog View</h2>
        <p className="text-muted-foreground">
          Click a button to open the diagram in a modal dialog
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() => openInDialog(exampleFlowchart, 'Task Workflow')}
          >
            Open Flowchart
          </Button>
          <Button
            onClick={() => openInDialog(exampleSequenceDiagram, 'API Sequence')}
          >
            Open Sequence Diagram
          </Button>
          <Button
            onClick={() => openInDialog(exampleStateDiagram, 'Task States')}
          >
            Open State Diagram
          </Button>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Code Examples</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Using MermaidViewer</h3>
            <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
              <code>{`import { MermaidViewer } from '@/components/ui/mermaid-viewer';

const chart = \`graph TD
  A --> B
  B --> C\`;

<MermaidViewer chart={chart} />`}</code>
            </pre>
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Using MermaidDialog</h3>
            <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
              <code>{`import { MermaidDialog } from '@/components/dialogs';

MermaidDialog.show({
  title: 'Flow Diagram',
  chart: \`graph TD
    A --> B
    B --> C\`,
});`}</code>
            </pre>
          </Card>
        </div>
      </div>
    </div>
  );
}
