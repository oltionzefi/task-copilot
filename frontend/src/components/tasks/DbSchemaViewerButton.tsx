import { Button } from '@/components/ui/button';
import { Database } from 'lucide-react';
import NiceModal from '@ebay/nice-modal-react';
import { DbSchemaViewerDialog } from '@/components/dialogs';
import { parseDbSchemaFromText, generateExampleSchema } from '@/lib/dbSchemaParser';
import type { Task } from 'shared/types';

interface DbSchemaViewerButtonProps {
  task: Task;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function DbSchemaViewerButton({
  task,
  variant = 'outline',
  size = 'sm',
  className,
}: DbSchemaViewerButtonProps) {
  // Only show button for confluence tasks
  if (task.intent !== 'confluence') {
    return null;
  }

  const handleClick = () => {
    const description = task.description || '';
    const title = task.title || '';
    const fullText = `${title}\n${description}`;
    
    // Try to parse schema from task description
    let { tables, relations } = parseDbSchemaFromText(fullText);
    
    // If no tables found, use example schema
    if (tables.length === 0) {
      const example = generateExampleSchema();
      tables = example.tables;
      relations = example.relations;
    }
    
    NiceModal.show(DbSchemaViewerDialog, {
      tables,
      relations,
      title: `DB Schema: ${task.title}`,
    });
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={className}
      title="View Database Schema"
    >
      <Database className="h-4 w-4 mr-2" />
      View Schema
    </Button>
  );
}
