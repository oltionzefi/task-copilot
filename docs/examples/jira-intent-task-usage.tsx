/**
 * Example usage of the JiraIntentTaskDialog component
 * 
 * This file demonstrates how to integrate the Jira Intent Task dialog
 * into your application workflow.
 */

import { show } from '@ebay/nice-modal-react';
import { JiraIntentTaskDialog } from '@/components/dialogs';
import type { TaskWithAttemptStatus } from 'shared/types';

/**
 * Example 1: Open dialog for a specific task
 */
export const openJiraIntentDialogForTask = (task: TaskWithAttemptStatus) => {
  show(JiraIntentTaskDialog, { task });
};

/**
 * Example 2: Open dialog from a task menu action
 */
export const TaskActionMenu = ({ task }: { task: TaskWithAttemptStatus }) => {
  const handleCreateJiraTicket = () => {
    show(JiraIntentTaskDialog, { task });
  };

  return (
    <button onClick={handleCreateJiraTicket}>
      Create Jira Ticket
    </button>
  );
};

/**
 * Example 3: Open dialog programmatically after task creation
 */
export const createTaskAndGenerateJiraTicket = async (
  taskData: any,
  shouldGenerateJira: boolean
) => {
  // Create the task first
  const newTask = await createTask(taskData);
  
  // If user wants to generate Jira ticket, open the dialog
  if (shouldGenerateJira) {
    show(JiraIntentTaskDialog, { task: newTask });
  }
  
  return newTask;
};

/**
 * Example 4: Integration with keyboard shortcut
 */
export const useJiraIntentShortcut = (task: TaskWithAttemptStatus | null) => {
  useHotkey('ctrl+shift+j', () => {
    if (task) {
      show(JiraIntentTaskDialog, { task });
    }
  });
};

/**
 * Example 5: Open dialog with custom workflow
 */
export const TaskDetailsPage = ({ taskId }: { taskId: string }) => {
  const { data: task } = useTaskQuery(taskId);
  const [jiraTicketCreated, setJiraTicketCreated] = useState(false);

  const handleGenerateJiraTicket = async () => {
    if (!task) return;

    // Open the dialog
    const result = await show(JiraIntentTaskDialog, { task });
    
    // Handle the result (if dialog returns data in future)
    if (result) {
      setJiraTicketCreated(true);
      // Optionally update the task with Jira ticket link
      // await updateTask(taskId, { jiraTicketId: result.ticketId });
    }
  };

  return (
    <div>
      <h1>{task?.title}</h1>
      {!jiraTicketCreated && (
        <button onClick={handleGenerateJiraTicket}>
          Generate Jira Ticket
        </button>
      )}
      {jiraTicketCreated && (
        <div className="success-message">
          Jira ticket created successfully!
        </div>
      )}
    </div>
  );
};

/**
 * Example 6: Bulk action - Generate Jira tickets for multiple tasks
 */
export const BulkJiraTicketGenerator = ({ 
  tasks 
}: { 
  tasks: TaskWithAttemptStatus[] 
}) => {
  const handleGenerateForTask = (task: TaskWithAttemptStatus) => {
    show(JiraIntentTaskDialog, { task });
  };

  return (
    <div>
      <h2>Generate Jira Tickets</h2>
      <ul>
        {tasks.map(task => (
          <li key={task.id}>
            <span>{task.title}</span>
            <button onClick={() => handleGenerateForTask(task)}>
              Generate
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * Example 7: Integration with task status workflow
 */
export const TaskCard = ({ task }: { task: TaskWithAttemptStatus }) => {
  const handleStatusChange = async (newStatus: string) => {
    // If moving to "Ready for QA" status, offer to create Jira ticket
    if (newStatus === 'ready_for_qa' && !task.jira_ticket_id) {
      const shouldCreate = confirm(
        'Would you like to create a Jira ticket for this task?'
      );
      
      if (shouldCreate) {
        show(JiraIntentTaskDialog, { task });
      }
    }
    
    // Update task status
    await updateTaskStatus(task.id, newStatus);
  };

  return (
    <div className="task-card">
      <h3>{task.title}</h3>
      <select onChange={(e) => handleStatusChange(e.target.value)}>
        <option value="todo">To Do</option>
        <option value="in_progress">In Progress</option>
        <option value="ready_for_qa">Ready for QA</option>
        <option value="done">Done</option>
      </select>
    </div>
  );
};

/**
 * Example 8: Conditional rendering based on project settings
 */
export const TaskActions = ({ 
  task,
  projectSettings 
}: { 
  task: TaskWithAttemptStatus;
  projectSettings: { jiraIntegrationEnabled: boolean };
}) => {
  if (!projectSettings.jiraIntegrationEnabled) {
    return null;
  }

  return (
    <button 
      className="jira-action-button"
      onClick={() => show(JiraIntentTaskDialog, { task })}
    >
      <JiraIcon />
      Create Jira Ticket
    </button>
  );
};

// Helper function placeholder (would be implemented elsewhere)
declare function createTask(data: any): Promise<TaskWithAttemptStatus>;
declare function updateTask(id: string, data: any): Promise<void>;
declare function updateTaskStatus(id: string, status: string): Promise<void>;
declare function useTaskQuery(id: string): { data: TaskWithAttemptStatus | null };
declare function useHotkey(key: string, handler: () => void): void;
declare const JiraIcon: React.FC;
