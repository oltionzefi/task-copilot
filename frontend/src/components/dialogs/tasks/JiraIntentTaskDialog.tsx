import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Loader2,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Lightbulb,
  Eye,
  ExternalLink,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { defineModal } from '@/lib/modals';
import type { TaskWithAttemptStatus, CreateJiraTicketRequest } from 'shared/types';
import { tasksApi } from '@/lib/api';

export interface JiraIntentTaskDialogProps {
  task: TaskWithAttemptStatus;
}

type JiraIssueType = 'Bug' | 'Task' | 'Story';
type WorkflowStep = 'input' | 'generating' | 'review' | 'creating' | 'success';

interface JiraTicketTemplate {
  description: string;
  acceptanceCriteria: string;
  additionalInformation: string;
}

interface CreatedTicket {
  ticketId: string;
  ticketUrl: string;
}

interface BestPractices {
  title: string;
  description: string;
}

const JIRA_BEST_PRACTICES: Record<JiraIssueType, BestPractices[]> = {
  Bug: [
    {
      title: 'Clear reproduction steps',
      description: 'Include step-by-step instructions to reproduce the bug',
    },
    {
      title: 'Expected vs actual behavior',
      description: 'Clearly state what should happen and what actually happens',
    },
    {
      title: 'Environment details',
      description: 'Include browser, OS, version, and relevant environment info',
    },
  ],
  Task: [
    {
      title: 'Clear objective',
      description: 'Define what needs to be accomplished',
    },
    {
      title: 'Acceptance criteria',
      description: 'List specific, measurable criteria for completion',
    },
    {
      title: 'Dependencies',
      description: 'Note any tasks or resources that must be completed first',
    },
  ],
  Story: [
    {
      title: 'User perspective',
      description: 'Write from the user\'s point of view',
    },
    {
      title: 'Value statement',
      description: 'Explain why this feature matters to users',
    },
    {
      title: 'Acceptance criteria',
      description: 'Define clear, testable acceptance criteria',
    },
  ],
};

const JiraIntentTaskDialogImpl = NiceModal.create<JiraIntentTaskDialogProps>(
  ({ task }) => {
    const modal = useModal();
    const { t } = useTranslation('tasks');
    const [workflowStep, setWorkflowStep] = useState<WorkflowStep>('input');
    const [issueType, setIssueType] = useState<JiraIssueType>('Task');
    const [taskDescription, setTaskDescription] = useState<string>(
      task.description || task.title
    );
    const [generatedTemplate, setGeneratedTemplate] =
      useState<JiraTicketTemplate | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [createdTicket, setCreatedTicket] = useState<CreatedTicket | null>(null);

    useEffect(() => {
      setTaskDescription(task.description || task.title);
    }, [task]);

    const generateJiraTemplate = async (): Promise<JiraTicketTemplate> => {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const isBug = issueType === 'Bug';
      const isStory = issueType === 'Story';

      if (isBug) {
        return {
          description: `**Summary**
${taskDescription}

**Steps to Reproduce**
1. Navigate to the affected area
2. Perform the action that triggers the issue
3. Observe the incorrect behavior

**Expected Behavior**
The system should function correctly without errors.

**Actual Behavior**
[Describe what actually happens]

**Environment**
- Browser: [e.g., Chrome 120]
- OS: [e.g., macOS 14.2]
- Version: [Application version]`,
          acceptanceCriteria: `- [ ] Bug can no longer be reproduced
- [ ] Regression tests pass
- [ ] No new issues introduced
- [ ] Implementation review completed`,
          additionalInformation: `**Priority Justification**
[Explain impact on users and business]

**Related Issues**
[Link to related tickets if any]

**Screenshots/Logs**
[Attach relevant visual evidence or error logs]`,
        };
      } else if (isStory) {
        return {
          description: `**User Story**
As a [user type], I want to [action] so that [benefit].

**Background**
${taskDescription}

**Goals**
- [Primary goal]
- [Secondary goal]

**User Value**
This feature will allow users to [describe value].`,
          acceptanceCriteria: `- [ ] User can successfully [primary action]
- [ ] System provides appropriate feedback
- [ ] Feature works across all supported platforms
- [ ] Edge cases are handled gracefully
- [ ] Documentation is updated`,
          additionalInformation: `**Design Considerations**
[UI/UX notes, mockups, or design references]

**Technical Notes**
[Implementation approach, dependencies, or constraints]

**Out of Scope**
[What this story explicitly does not include]`,
        };
      } else {
        return {
          description: `**Overview**
${taskDescription}

**Context**
This task addresses [problem or need] by [approach or solution].

**Key Actions Required**
- [Key step or component 1]
- [Key step or component 2]
- [Key step or component 3]`,
          acceptanceCriteria: `- [ ] Primary objective completed
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Implementation reviewed and approved
- [ ] No breaking changes introduced`,
          additionalInformation: `**Technical Requirements**
- [Requirement 1]
- [Requirement 2]

**Dependencies**
- [Dependency 1]
- [Dependency 2]

**Testing Notes**
[How to test this task]`,
        };
      }
    };

    const handleGenerate = async () => {
      if (!taskDescription.trim()) {
        setError('Please provide a task description');
        return;
      }

      setError(null);
      setWorkflowStep('generating');

      try {
        const template = await generateJiraTemplate();
        setGeneratedTemplate(template);
        setWorkflowStep('review');
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to generate template'
        );
        setWorkflowStep('input');
      }
    };

    const handleRevise = () => {
      setWorkflowStep('input');
      setIsEditing(false);
    };

    const handleCreateTicket = async () => {
      if (!generatedTemplate) return;

      setError(null);
      setWorkflowStep('creating');

      try {
        const payload: CreateJiraTicketRequest = {
          issue_type: issueType,
          description: generatedTemplate.description,
          acceptance_criteria: generatedTemplate.acceptanceCriteria,
          additional_information: generatedTemplate.additionalInformation,
        };

        const response = await tasksApi.createJiraTicket(task.id, payload);

        setCreatedTicket({
          ticketId: response.ticket_id,
          ticketUrl: response.ticket_url,
        });
        setWorkflowStep('success');
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to create Jira ticket'
        );
        setWorkflowStep('review');
      }
    };

    const handleClose = () => {
      setGeneratedTemplate(null);
      modal.hide();
    };

    const handleUpdateField = (
      field: keyof JiraTicketTemplate,
      value: string
    ) => {
      if (generatedTemplate) {
        setGeneratedTemplate({
          ...generatedTemplate,
          [field]: value,
        });
      }
    };

    const renderInputStep = () => (
      <>
        <div className="space-y-4">
          <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t('jiraIntentDialog.taskInfo', {
                defaultValue: 'Task Information',
              })}
            </h3>
            <div className="space-y-1 text-sm">
              <div>
                <span className="font-medium">
                  {t('jiraIntentDialog.taskTitle', {
                    defaultValue: 'Title:',
                  })}{' '}
                </span>
                <span className="text-muted-foreground">{task.title}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="issue-type">
              {t('jiraIntentDialog.issueType', {
                defaultValue: 'Issue Type',
              })}
            </Label>
            <Select
              value={issueType}
              onValueChange={(value) => setIssueType(value as JiraIssueType)}
            >
              <SelectTrigger id="issue-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bug">Bug</SelectItem>
                <SelectItem value="Task">Task</SelectItem>
                <SelectItem value="Story">Story</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              {t('jiraIntentDialog.description', {
                defaultValue: 'Task Description',
              })}
            </Label>
            <Textarea
              id="description"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder={t('jiraIntentDialog.descriptionPlaceholder', {
                defaultValue:
                  'Provide a detailed description of what needs to be done...',
              })}
              rows={6}
              className="resize-none"
            />
          </div>

          <div className="space-y-2 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-blue-600" />
              {t('jiraIntentDialog.bestPractices', {
                defaultValue: `Best Practices for ${issueType}`,
              })}
            </h4>
            <ul className="space-y-1 text-sm">
              {JIRA_BEST_PRACTICES[issueType].map((practice, idx) => (
                <li key={idx} className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">{practice.title}:</span>{' '}
                    <span className="text-muted-foreground">
                      {practice.description}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            {t('common:buttons.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!taskDescription.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {t('jiraIntentDialog.generate', {
              defaultValue: 'Generate Template',
            })}
          </Button>
        </div>
      </>
    );

    const renderGeneratingStep = () => (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <div className="text-center space-y-2">
          <h3 className="font-semibold">
            {t('jiraIntentDialog.generating', {
              defaultValue: 'Generating Jira Template...',
            })}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('jiraIntentDialog.generatingDesc', {
              defaultValue:
                'Analyzing your task and applying best practices...',
            })}
          </p>
        </div>
      </div>
    );

    const renderReviewStep = () => {
      if (!generatedTemplate) return null;

      return (
        <>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                {t('jiraIntentDialog.templateGenerated', {
                  defaultValue:
                    'Template generated successfully! Review and edit as needed.',
                })}
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">
                    {t('jiraIntentDialog.fields.description', {
                      defaultValue: 'Description',
                    })}
                  </Label>
                  {isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  )}
                </div>
                {isEditing ? (
                  <Textarea
                    value={generatedTemplate.description}
                    onChange={(e) =>
                      handleUpdateField('description', e.target.value)
                    }
                    rows={10}
                    className="font-mono text-sm"
                  />
                ) : (
                  <div
                    className="p-4 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => setIsEditing(true)}
                  >
                    {generatedTemplate.description}
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="font-semibold">
                  {t('jiraIntentDialog.fields.acceptanceCriteria', {
                    defaultValue: 'Acceptance Criteria',
                  })}
                </Label>
                {isEditing ? (
                  <Textarea
                    value={generatedTemplate.acceptanceCriteria}
                    onChange={(e) =>
                      handleUpdateField('acceptanceCriteria', e.target.value)
                    }
                    rows={6}
                    className="font-mono text-sm"
                  />
                ) : (
                  <div
                    className="p-4 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => setIsEditing(true)}
                  >
                    {generatedTemplate.acceptanceCriteria}
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="font-semibold">
                  {t('jiraIntentDialog.fields.additionalInfo', {
                    defaultValue: 'Additional Information',
                  })}
                </Label>
                {isEditing ? (
                  <Textarea
                    value={generatedTemplate.additionalInformation}
                    onChange={(e) =>
                      handleUpdateField('additionalInformation', e.target.value)
                    }
                    rows={8}
                    className="font-mono text-sm"
                  />
                ) : (
                  <div
                    className="p-4 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => setIsEditing(true)}
                  >
                    {generatedTemplate.additionalInformation}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleRevise}>
              {t('jiraIntentDialog.revise', {
                defaultValue: 'Revise',
              })}
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleClose}>
                {t('common:buttons.cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button
                onClick={handleCreateTicket}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {t('jiraIntentDialog.createTicket', {
                  defaultValue: 'Create Ticket',
                })}
              </Button>
            </div>
          </div>
        </>
      );
    };

    const renderCreatingStep = () => (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-green-600" />
        <div className="text-center space-y-2">
          <h3 className="font-semibold">
            {t('jiraIntentDialog.creatingTicket', {
              defaultValue: 'Creating Jira Ticket...',
            })}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('jiraIntentDialog.creatingTicketDesc', {
              defaultValue: 'Please wait while we create your Jira ticket...',
            })}
          </p>
        </div>
      </div>
    );

    const renderSuccessStep = () => {
      if (!createdTicket) return null;

      return (
        <>
          <div className="space-y-4">
            <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                {t('jiraIntentDialog.ticketCreated', {
                  defaultValue: 'Jira ticket created successfully!',
                })}
              </AlertDescription>
            </Alert>

            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-1">
                <Label className="text-sm font-medium">
                  {t('jiraIntentDialog.ticketId', {
                    defaultValue: 'Ticket ID',
                  })}
                </Label>
                <div className="text-lg font-semibold">{createdTicket.ticketId}</div>
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium">
                  {t('jiraIntentDialog.ticketUrl', {
                    defaultValue: 'Ticket URL',
                  })}
                </Label>
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

            {generatedTemplate && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">
                    {t('jiraIntentDialog.ticketContent', {
                      defaultValue: 'Ticket Content',
                    })}
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <Label className="font-medium">
                        {t('jiraIntentDialog.fields.description', {
                          defaultValue: 'Description',
                        })}
                      </Label>
                      <div className="p-3 bg-muted/30 rounded text-muted-foreground whitespace-pre-wrap mt-1">
                        {generatedTemplate.description}
                      </div>
                    </div>
                    <div>
                      <Label className="font-medium">
                        {t('jiraIntentDialog.fields.acceptanceCriteria', {
                          defaultValue: 'Acceptance Criteria',
                        })}
                      </Label>
                      <div className="p-3 bg-muted/30 rounded text-muted-foreground whitespace-pre-wrap mt-1">
                        {generatedTemplate.acceptanceCriteria}
                      </div>
                    </div>
                    <div>
                      <Label className="font-medium">
                        {t('jiraIntentDialog.fields.additionalInfo', {
                          defaultValue: 'Additional Information',
                        })}
                      </Label>
                      <div className="p-3 bg-muted/30 rounded text-muted-foreground whitespace-pre-wrap mt-1">
                        {generatedTemplate.additionalInformation}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleClose} className="bg-blue-600 hover:bg-blue-700">
              {t('common:buttons.close', { defaultValue: 'Close' })}
            </Button>
          </div>
        </>
      );
    };

    return (
      <Dialog open={modal.visible} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {t('jiraIntentDialog.title', {
                defaultValue: 'Create Jira Ticket',
              })}
            </DialogTitle>
            <DialogDescription>
              {workflowStep === 'input' &&
                t('jiraIntentDialog.description', {
                  defaultValue:
                    'Provide task details and we\'ll generate a professional Jira ticket following best practices.',
                })}
              {workflowStep === 'generating' &&
                t('jiraIntentDialog.generatingTitle', {
                  defaultValue: 'Generating your Jira ticket template...',
                })}
              {workflowStep === 'review' &&
                t('jiraIntentDialog.reviewTitle', {
                  defaultValue:
                    'Review the generated template and make any necessary edits.',
                })}
              {workflowStep === 'creating' &&
                t('jiraIntentDialog.creatingTitle', {
                  defaultValue: 'Creating your Jira ticket...',
                })}
              {workflowStep === 'success' &&
                t('jiraIntentDialog.successTitle', {
                  defaultValue: 'Your Jira ticket has been created successfully!',
                })}
            </DialogDescription>
          </DialogHeader>

          {workflowStep === 'input' && renderInputStep()}
          {workflowStep === 'generating' && renderGeneratingStep()}
          {workflowStep === 'review' && renderReviewStep()}
          {workflowStep === 'creating' && renderCreatingStep()}
          {workflowStep === 'success' && renderSuccessStep()}
        </DialogContent>
      </Dialog>
    );
  }
);

export const JiraIntentTaskDialog = defineModal<
  JiraIntentTaskDialogProps,
  void
>(JiraIntentTaskDialogImpl);
