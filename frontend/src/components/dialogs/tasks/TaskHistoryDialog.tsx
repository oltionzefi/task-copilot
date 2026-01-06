import { useQuery } from '@tanstack/react-query';
import { tasksApi, attemptsApi } from '@/lib/api';
import type { Task, TaskHistoryEventType } from 'shared/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  FileEdit,
  GitBranch,
  CheckCircle2,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { format } from 'date-fns';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { defineModal } from '@/lib/modals';

export interface TaskHistoryDialogProps {
  task: Task;
}

const getEventIcon = (eventType: TaskHistoryEventType) => {
  switch (eventType) {
    case 'status_changed':
      return <CheckCircle2 className="h-4 w-4" />;
    case 'title_changed':
      return <FileEdit className="h-4 w-4" />;
    case 'description_changed':
      return <MessageSquare className="h-4 w-4" />;
    case 'pr_body_updated':
      return <GitBranch className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getEventLabel = (eventType: TaskHistoryEventType) => {
  switch (eventType) {
    case 'status_changed':
      return 'Status Changed';
    case 'title_changed':
      return 'Title Changed';
    case 'description_changed':
      return 'Description Changed';
    case 'pr_body_updated':
      return 'PR Body Updated';
    default:
      return 'Other';
  }
};

const getEventColor = (eventType: TaskHistoryEventType) => {
  switch (eventType) {
    case 'status_changed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'title_changed':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'description_changed':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    case 'pr_body_updated':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

const TaskHistoryDialogImpl = NiceModal.create<TaskHistoryDialogProps>(
  ({ task }) => {
    const modal = useModal();

    const { data: history = [], isLoading } = useQuery({
      queryKey: ['taskHistory', task.id],
      queryFn: () => tasksApi.getHistory(task.id),
      enabled: modal.visible,
    });

    const { data: attempts = [], isLoading: isAttemptsLoading } = useQuery({
      queryKey: ['taskAttempts', task.id],
      queryFn: () => attemptsApi.getAll(task.id),
      enabled: modal.visible,
    });

    const hasHistoryBeenDeleted = task.history_deleted_at !== null && task.history_deleted_at !== undefined;

    return (
      <Dialog open={modal.visible} onOpenChange={(open) => !open && modal.hide()}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Task History</DialogTitle>
          <DialogDescription>
            View the complete history and execution attempts for this task
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Metadata */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Task Information</h3>
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Title:</span>
                <span className="text-sm font-medium">{task.title}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant="outline" className="capitalize">
                  {task.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Intent:</span>
                <Badge variant="outline" className="capitalize">
                  {task.intent}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created:</span>
                <span className="text-sm">
                  {format(new Date(task.created_at), 'MMM d, yyyy HH:mm')}
                </span>
              </div>
            </div>
          </div>

          {/* Execution Attempts */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">
              Execution Attempts ({attempts.length})
            </h3>
            {isAttemptsLoading ? (
              <div className="text-sm text-muted-foreground">Loading attempts...</div>
            ) : attempts.length > 0 ? (
              <ScrollArea className="h-[200px] rounded-lg border">
                <div className="p-4 space-y-3">
                  {attempts
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                    )
                    .map((attempt, index) => (
                      <div
                        key={attempt.id}
                        className="flex items-start gap-3 pb-3 border-b last:border-b-0"
                      >
                        <div className="flex-shrink-0 mt-1">
                          <div className="h-2 w-2 rounded-full bg-blue-500" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              Attempt {attempts.length - index}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(
                                new Date(attempt.created_at),
                                'MMM d, HH:mm'
                              )}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Branch: {attempt.branch}
                          </div>
                          {attempt.agent_working_dir && (
                            <div className="text-xs text-muted-foreground">
                              Working Dir: {attempt.agent_working_dir}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="rounded-lg border p-4 text-sm text-muted-foreground text-center">
                No execution attempts yet
              </div>
            )}
          </div>

          {/* Change History */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">
              Change History ({history.length})
            </h3>
            {hasHistoryBeenDeleted && (
              <div className="rounded-lg border border-yellow-500 bg-yellow-50 dark:bg-yellow-950 p-3 text-sm text-yellow-800 dark:text-yellow-300">
                ⚠️ History was cleaned up on {format(new Date(task.history_deleted_at!), 'MMM d, yyyy HH:mm')}
              </div>
            )}
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Loading history...</div>
            ) : history.length > 0 ? (
              <ScrollArea className="h-[250px] rounded-lg border">
                <div className="p-4 space-y-4">
                  {history.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 pb-4 border-b last:border-b-0"
                    >
                      <div className="flex-shrink-0 mt-1">
                        <div
                          className={`p-2 rounded-full ${getEventColor(
                            entry.event_type
                          )}`}
                        >
                          {getEventIcon(entry.event_type)}
                        </div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {getEventLabel(entry.event_type)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(entry.created_at), 'MMM d, HH:mm')}
                          </span>
                        </div>
                        {entry.old_value && (
                          <div className="text-xs">
                            <span className="text-muted-foreground">From: </span>
                            <span className="line-through text-red-600 dark:text-red-400">
                              {entry.old_value}
                            </span>
                          </div>
                        )}
                        {entry.new_value && (
                          <div className="text-xs">
                            <span className="text-muted-foreground">To: </span>
                            <span className="text-green-600 dark:text-green-400">
                              {entry.new_value}
                            </span>
                          </div>
                        )}
                        {entry.metadata && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {entry.metadata}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="rounded-lg border p-4 text-sm text-muted-foreground text-center">
                {hasHistoryBeenDeleted ? 'History has been cleaned up' : 'No changes recorded yet'}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
    );
  }
);

export const TaskHistoryDialog = defineModal<TaskHistoryDialogProps, void>(
  TaskHistoryDialogImpl
);
