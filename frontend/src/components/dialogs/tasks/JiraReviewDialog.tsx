import { useTranslation } from 'react-i18next';
import { Loader2, CheckCircle2, FileText, Tag, User } from 'lucide-react';
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
import type { TaskWithAttemptStatus } from 'shared/types';

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

const JiraReviewDialogImpl = NiceModal.create<JiraReviewDialogProps>(
  ({ task }) => {
    const modal = useModal();
    const { t } = useTranslation('tasks');
    const [generating, setGenerating] = useState(false);
    const [generatedParts, setGeneratedParts] = useState<Set<string>>(
      new Set()
    );
    const [error, setError] = useState<string | null>(null);

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

    const allGenerated = generatedParts.size === 5;
    const someSelected = Object.values(selectedParts).some((v) => v);

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
