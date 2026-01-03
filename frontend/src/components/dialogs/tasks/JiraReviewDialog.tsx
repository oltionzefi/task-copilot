import { useTranslation } from 'react-i18next';
import { Loader2, CheckCircle2, FileText, Tag, User, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { defineModal } from '@/lib/modals';
import type { TaskWithAttemptStatus, CreateJiraTicketRequest } from 'shared/types';
import { tasksApi } from '@/lib/api';

export interface JiraReviewDialogProps {
  task: TaskWithAttemptStatus;
}

interface JiraTicketParts {
  summary: boolean;
  description: boolean;
  issueType: boolean;
  priority: boolean;
  assignee: boolean;
}

interface CreatedTicket {
  ticketId: string;
  ticketUrl: string;
}

type WorkflowState = 'reviewing' | 'creating' | 'success';

const JiraReviewDialogImpl = NiceModal.create<JiraReviewDialogProps>(
  ({ task }) => {
    const modal = useModal();
    const { t } = useTranslation('tasks');
    const [workflowState, setWorkflowState] = useState<WorkflowState>('reviewing');
    const [generating, setGenerating] = useState(false);
    const [generatedParts, setGeneratedParts] = useState<Set<string>>(
      new Set()
    );
    const [error, setError] = useState<string | null>(null);
    const [createdTicket, setCreatedTicket] = useState<CreatedTicket | null>(null);

    const [selectedParts, setSelectedParts] = useState<JiraTicketParts>({
      summary: true,
      description: true,
      issueType: true,
      priority: false,
      assignee: false,
    });

    const handlePartToggle = (part: keyof JiraTicketParts) => {
      setSelectedParts((prev) => ({ ...prev, [part]: !prev[part] }));
    };

    const handleGenerateSelected = async () => {
      setGenerating(true);
      setError(null);

      try {
        // Simulate generation - replace with actual API call
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const newGenerated = new Set(generatedParts);
        Object.entries(selectedParts).forEach(([key, enabled]) => {
          if (enabled) {
            newGenerated.add(key);
          }
        });
        setGeneratedParts(newGenerated);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to generate Jira ticket parts'
        );
      } finally {
        setGenerating(false);
      }
    };

    const handleGenerateAll = async () => {
      setSelectedParts({
        summary: true,
        description: true,
        issueType: true,
        priority: true,
        assignee: true,
      });
      setGenerating(true);
      setError(null);

      try {
        // Simulate generation - replace with actual API call
        await new Promise((resolve) => setTimeout(resolve, 2000));

        setGeneratedParts(
          new Set([
            'summary',
            'description',
            'issueType',
            'priority',
            'assignee',
          ])
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to generate Jira ticket'
        );
      } finally {
        setGenerating(false);
      }
    };

    const handleClose = () => {
      modal.hide();
    };

    const handleCreateJiraTicket = async () => {
      setError(null);
      setWorkflowState('creating');

      try {
        // Get markdown content from task description
        const markdownContent = task.description || task.title;

        // Create the Jira ticket with markdown content
        const payload: CreateJiraTicketRequest = {
          issue_type: 'Task',
          description: markdownContent,
          acceptance_criteria: '',
          additional_information: '',
        };

        const response = await tasksApi.createJiraTicket(task.id, payload);

        setCreatedTicket({
          ticketId: response.ticket_id,
          ticketUrl: response.ticket_url,
        });
        setWorkflowState('success');
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to create Jira ticket'
        );
        setWorkflowState('reviewing');
      }
    };

    const allGenerated = generatedParts.size === 5;
    const someSelected = Object.values(selectedParts).some((v) => v);
    const isCreating = workflowState === 'creating';
    const isSuccess = workflowState === 'success';

    if (isSuccess && createdTicket) {
      return (
        <Dialog open={modal.visible} onOpenChange={handleClose}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {t('jiraReviewDialog.successTitle', {
                  defaultValue: 'Jira Ticket Created',
                })}
              </DialogTitle>
              <DialogDescription>
                {t('jiraReviewDialog.successDescription', {
                  defaultValue: 'Your Jira ticket has been created successfully.',
                })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  {t('jiraReviewDialog.ticketCreatedSuccess', {
                    defaultValue: 'Jira ticket created successfully!',
                  })}
                </AlertDescription>
              </Alert>

              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-1">
                  <span className="text-sm font-medium">
                    {t('jiraReviewDialog.ticketId', {
                      defaultValue: 'Ticket ID',
                    })}
                  </span>
                  <div className="text-lg font-semibold">{createdTicket.ticketId}</div>
                </div>

                <div className="space-y-1">
                  <span className="text-sm font-medium">
                    {t('jiraReviewDialog.ticketUrl', {
                      defaultValue: 'Ticket URL',
                    })}
                  </span>
                  <a
                    href={createdTicket.ticketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    {createdTicket.ticketUrl}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handleClose} className="bg-blue-600 hover:bg-blue-700">
                {t('common:buttons.close', { defaultValue: 'Close' })}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      );
    }

    if (isCreating) {
      return (
        <Dialog open={modal.visible} onOpenChange={handleClose}>
          <DialogContent className="sm:max-w-2xl">
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              <div className="text-center space-y-2">
                <h3 className="font-semibold">
                  {t('jiraReviewDialog.creatingTicket', {
                    defaultValue: 'Creating Jira Ticket...',
                  })}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('jiraReviewDialog.creatingTicketDesc', {
                    defaultValue: 'Please wait while we create your Jira ticket...',
                  })}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      );
    }

    return (
      <Dialog open={modal.visible} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {t('jiraReviewDialog.title', {
                defaultValue: 'Review Jira Ticket',
              })}
            </DialogTitle>
            <DialogDescription>
              {t('jiraReviewDialog.description', {
                defaultValue:
                  'Review and generate the Jira ticket content for this task.',
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {/* Task Information */}
            <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold text-sm">
                {t('jiraReviewDialog.taskDetails', {
                  defaultValue: 'Task Details',
                })}
              </h3>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="font-medium">
                    {t('jiraReviewDialog.taskTitle', {
                      defaultValue: 'Title:',
                    })}{' '}
                  </span>
                  <span className="text-muted-foreground">{task.title}</span>
                </div>
                {task.description && (
                  <div>
                    <span className="font-medium">
                      {t('jiraReviewDialog.taskDescription', {
                        defaultValue: 'Description:',
                      })}{' '}
                    </span>
                    <p className="text-muted-foreground mt-1 whitespace-pre-wrap">
                      {task.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Jira Ticket Parts */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">
                {t('jiraReviewDialog.selectParts', {
                  defaultValue: 'Select ticket parts to generate:',
                })}
              </h3>

              <div className="space-y-2">
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <Checkbox
                    id="summary"
                    checked={selectedParts.summary}
                    onCheckedChange={() => handlePartToggle('summary')}
                    disabled={generating}
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="summary" className="cursor-pointer flex-1">
                      {t('jiraReviewDialog.parts.summary', {
                        defaultValue: 'Summary',
                      })}
                    </Label>
                    {generatedParts.has('summary') && (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <Checkbox
                    id="description"
                    checked={selectedParts.description}
                    onCheckedChange={() => handlePartToggle('description')}
                    disabled={generating}
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <Label
                      htmlFor="description"
                      className="cursor-pointer flex-1"
                    >
                      {t('jiraReviewDialog.parts.description', {
                        defaultValue: 'Description',
                      })}
                    </Label>
                    {generatedParts.has('description') && (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <Checkbox
                    id="issueType"
                    checked={selectedParts.issueType}
                    onCheckedChange={() => handlePartToggle('issueType')}
                    disabled={generating}
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <Label
                      htmlFor="issueType"
                      className="cursor-pointer flex-1"
                    >
                      {t('jiraReviewDialog.parts.issueType', {
                        defaultValue: 'Issue Type',
                      })}
                    </Label>
                    {generatedParts.has('issueType') && (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <Checkbox
                    id="priority"
                    checked={selectedParts.priority}
                    onCheckedChange={() => handlePartToggle('priority')}
                    disabled={generating}
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="priority" className="cursor-pointer flex-1">
                      {t('jiraReviewDialog.parts.priority', {
                        defaultValue: 'Priority',
                      })}
                    </Label>
                    {generatedParts.has('priority') && (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <Checkbox
                    id="assignee"
                    checked={selectedParts.assignee}
                    onCheckedChange={() => handlePartToggle('assignee')}
                    disabled={generating}
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="assignee" className="cursor-pointer flex-1">
                      {t('jiraReviewDialog.parts.assignee', {
                        defaultValue: 'Assignee',
                      })}
                    </Label>
                    {generatedParts.has('assignee') && (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {allGenerated && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  {t('jiraReviewDialog.allGenerated', {
                    defaultValue:
                      'All ticket parts have been generated successfully.',
                  })}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} disabled={generating}>
              {t('common:buttons.close', { defaultValue: 'Close' })}
            </Button>
            <div className="flex gap-2">
              <Button
                onClick={handleCreateJiraTicket}
                disabled={generating}
                variant="default"
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {t('jiraReviewDialog.createJiraTicket', {
                  defaultValue: 'Create Jira Ticket',
                })}
              </Button>
              <Button
                onClick={handleGenerateSelected}
                disabled={generating || !someSelected}
                variant="default"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('jiraReviewDialog.generating', {
                      defaultValue: 'Generating...',
                    })}
                  </>
                ) : (
                  t('jiraReviewDialog.generateSelected', {
                    defaultValue: 'Generate Selected',
                  })
                )}
              </Button>
              <Button
                onClick={handleGenerateAll}
                disabled={generating || allGenerated}
                variant="default"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('jiraReviewDialog.generating', {
                      defaultValue: 'Generating...',
                    })}
                  </>
                ) : (
                  t('jiraReviewDialog.generateAll', {
                    defaultValue: 'Generate All',
                  })
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

export const JiraReviewDialog = defineModal<JiraReviewDialogProps, void>(
  JiraReviewDialogImpl
);
