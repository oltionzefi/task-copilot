import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Loader2,
  CheckCircle2,
  FileText,
  Edit3,
  MessageSquare,
  Send,
  User,
  Bot,
  X,
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
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { defineModal } from '@/lib/modals';
import type { TaskWithAttemptStatus } from 'shared/types';
import { tasksApi } from '@/lib/api';

export interface WrittenTaskDescriptionDialogProps {
  task: TaskWithAttemptStatus;
  onUpdate?: (updatedDescription: string) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

const WrittenTaskDescriptionDialogImpl =
  NiceModal.create<WrittenTaskDescriptionDialogProps>(
    ({ task, onUpdate }) => {
      const modal = useModal();
      const { t } = useTranslation('tasks');
      const [description, setDescription] = useState<string>(
        task.description || ''
      );
      const [isEditing, setIsEditing] = useState(false);
      const [isSaving, setIsSaving] = useState(false);
      const [error, setError] = useState<string | null>(null);
      const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
      const [chatInput, setChatInput] = useState('');
      const [isChatOpen, setIsChatOpen] = useState(false);
      const [isAgentThinking, setIsAgentThinking] = useState(false);

      useEffect(() => {
        setDescription(task.description || '');
      }, [task]);

      const handleSave = async () => {
        if (!description.trim()) {
          setError('Description cannot be empty');
          return;
        }

        setError(null);
        setIsSaving(true);

        try {
          await tasksApi.update(task.id, {
            title: null,
            description,
            status: null,
            intent: null,
            parent_workspace_id: null,
            image_ids: null,
          });
          setIsEditing(false);
          onUpdate?.(description);
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to update task description'
          );
        } finally {
          setIsSaving(false);
        }
      };

      const handleCancel = () => {
        setDescription(task.description || '');
        setIsEditing(false);
        setError(null);
      };

      const handleSendMessage = async () => {
        if (!chatInput.trim()) return;

        const userMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'user',
          content: chatInput.trim(),
          timestamp: new Date(),
        };

        setChatMessages((prev) => [...prev, userMessage]);
        setChatInput('');
        setIsAgentThinking(true);

        // Simulate agent response
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const agentMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'agent',
          content: generateAgentResponse(userMessage.content, description),
          timestamp: new Date(),
        };

        setChatMessages((prev) => [...prev, agentMessage]);
        setIsAgentThinking(false);
      };

      const generateAgentResponse = (
        userQuery: string,
        currentDescription: string
      ): string => {
        const lowerQuery = userQuery.toLowerCase();

        if (
          lowerQuery.includes('improve') ||
          lowerQuery.includes('better') ||
          lowerQuery.includes('enhance')
        ) {
          return `I can help improve this description. Here are some suggestions:\n\n1. Add more specific acceptance criteria\n2. Include technical requirements or constraints\n3. Clarify the user value or business impact\n4. Define edge cases that should be handled\n\nWould you like me to rewrite a specific section?`;
        }

        if (
          lowerQuery.includes('clear') ||
          lowerQuery.includes('clarify') ||
          lowerQuery.includes('explain')
        ) {
          return `Based on the current description, this task is about: "${task.title}"\n\nThe description covers: ${currentDescription.substring(0, 100)}...\n\nWhat specific aspect would you like me to clarify?`;
        }

        if (
          lowerQuery.includes('add') ||
          lowerQuery.includes('include') ||
          lowerQuery.includes('missing')
        ) {
          return `I can help you add more details. Consider including:\n\n- Specific user stories or use cases\n- Technical implementation notes\n- Dependencies on other systems or tasks\n- Security or performance considerations\n\nWhat would you like to add?`;
        }

        if (
          lowerQuery.includes('jira') ||
          lowerQuery.includes('ticket') ||
          lowerQuery.includes('format')
        ) {
          return `For Jira, I recommend structuring the description with:\n\n**Summary**: Brief overview\n**Description**: Detailed explanation\n**Acceptance Criteria**: Measurable completion criteria\n**Technical Notes**: Implementation details\n\nWould you like me to reformat the description in this structure?`;
        }

        return `I'm here to help improve your task description for "${task.title}". You can ask me to:\n\n- Improve clarity or structure\n- Add missing details\n- Format for Jira ticket creation\n- Review acceptance criteria\n\nWhat would you like help with?`;
      };

      const handleClose = () => {
        if (isEditing) {
          const confirmed = window.confirm(
            'You have unsaved changes. Are you sure you want to close?'
          );
          if (!confirmed) return;
        }
        modal.hide();
      };

      return (
        <Dialog open={modal.visible} onOpenChange={handleClose}>
          <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t('writtenTaskDescriptionDialog.title', {
                  defaultValue: 'Review Task Description',
                })}
              </DialogTitle>
              <DialogDescription>
                {t('writtenTaskDescriptionDialog.description', {
                  defaultValue:
                    'Review and edit the task description. Use the agent chat to get suggestions and improvements.',
                })}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 flex gap-4 overflow-hidden">
              {/* Main Description Panel */}
              <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
                <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {t('writtenTaskDescriptionDialog.taskInfo', {
                      defaultValue: 'Task Information',
                    })}
                  </h3>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="font-medium">
                        {t('writtenTaskDescriptionDialog.taskTitle', {
                          defaultValue: 'Title:',
                        })}{' '}
                      </span>
                      <span className="text-muted-foreground">
                        {task.title}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">
                        {t('writtenTaskDescriptionDialog.status', {
                          defaultValue: 'Status:',
                        })}{' '}
                      </span>
                      <span className="text-muted-foreground capitalize">
                        {task.status}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">
                        {t('writtenTaskDescriptionDialog.intent', {
                          defaultValue: 'Intent:',
                        })}{' '}
                      </span>
                      <span className="text-muted-foreground capitalize">
                        {task.intent}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col space-y-2 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold">
                      {t('writtenTaskDescriptionDialog.description', {
                        defaultValue: 'Description',
                      })}
                    </Label>
                    {!isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        {t('common:buttons.edit', { defaultValue: 'Edit' })}
                      </Button>
                    )}
                  </div>

                  {isEditing ? (
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={t(
                        'writtenTaskDescriptionDialog.descriptionPlaceholder',
                        {
                          defaultValue:
                            'Enter a detailed description of the task...',
                        }
                      )}
                      className="flex-1 resize-none font-mono text-sm"
                    />
                  ) : (
                    <div className="flex-1 border rounded-lg overflow-y-auto">
                      <div className="p-4 whitespace-pre-wrap text-sm">
                        {description || (
                          <span className="text-muted-foreground italic">
                            {t('writtenTaskDescriptionDialog.noDescription', {
                              defaultValue:
                                'No description available. Click Edit to add one.',
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3 pt-2 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setIsChatOpen(!isChatOpen)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {isChatOpen
                      ? t('writtenTaskDescriptionDialog.hideChat', {
                          defaultValue: 'Hide Agent Chat',
                        })
                      : t('writtenTaskDescriptionDialog.showChat', {
                          defaultValue: 'Show Agent Chat',
                        })}
                  </Button>

                  <div className="flex gap-2">
                    {isEditing && (
                      <>
                        <Button variant="outline" onClick={handleCancel}>
                          {t('common:buttons.cancel', {
                            defaultValue: 'Cancel',
                          })}
                        </Button>
                        <Button
                          onClick={handleSave}
                          disabled={isSaving || !description.trim()}
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {t('writtenTaskDescriptionDialog.saving', {
                                defaultValue: 'Saving...',
                              })}
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              {t('common:buttons.save', {
                                defaultValue: 'Save',
                              })}
                            </>
                          )}
                        </Button>
                      </>
                    )}
                    {!isEditing && (
                      <Button onClick={handleClose}>
                        {t('common:buttons.close', { defaultValue: 'Close' })}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Agent Chat Panel */}
              {isChatOpen && (
                <Card className="w-[400px] flex flex-col overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Bot className="h-4 w-4" />
                        {t('writtenTaskDescriptionDialog.agentChat', {
                          defaultValue: 'Agent Assistant',
                        })}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsChatOpen(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardDescription>
                      {t('writtenTaskDescriptionDialog.agentChatDescription', {
                        defaultValue:
                          'Ask the agent for help improving your task description',
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col gap-3 overflow-hidden pb-4">
                    <div className="flex-1 overflow-y-auto pr-4">
                      <div className="space-y-3">
                        {chatMessages.length === 0 && (
                          <div className="text-sm text-muted-foreground text-center py-8">
                            {t(
                              'writtenTaskDescriptionDialog.chatPlaceholder',
                              {
                                defaultValue:
                                  'Start a conversation to get help with your task description',
                              }
                            )}
                          </div>
                        )}

                        {chatMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex gap-2 ${
                              message.role === 'user'
                                ? 'justify-end'
                                : 'justify-start'
                            }`}
                          >
                            <div
                              className={`flex gap-2 max-w-[85%] ${
                                message.role === 'user'
                                  ? 'flex-row-reverse'
                                  : 'flex-row'
                              }`}
                            >
                              <div
                                className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                                  message.role === 'user'
                                    ? 'bg-blue-100 dark:bg-blue-900'
                                    : 'bg-green-100 dark:bg-green-900'
                                }`}
                              >
                                {message.role === 'user' ? (
                                  <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                ) : (
                                  <Bot className="h-4 w-4 text-green-600 dark:text-green-400" />
                                )}
                              </div>
                              <div
                                className={`rounded-lg p-3 text-sm whitespace-pre-wrap ${
                                  message.role === 'user'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-muted'
                                }`}
                              >
                                {message.content}
                              </div>
                            </div>
                          </div>
                        ))}

                        {isAgentThinking && (
                          <div className="flex gap-2">
                            <div className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-green-100 dark:bg-green-900">
                              <Bot className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="rounded-lg p-3 text-sm bg-muted">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder={t(
                          'writtenTaskDescriptionDialog.chatInputPlaceholder',
                          {
                            defaultValue: 'Ask for help...',
                          }
                        )}
                        disabled={isAgentThinking}
                      />
                      <Button
                        size="icon"
                        onClick={handleSendMessage}
                        disabled={!chatInput.trim() || isAgentThinking}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </DialogContent>
        </Dialog>
      );
    }
  );

export const WrittenTaskDescriptionDialog = defineModal<
  WrittenTaskDescriptionDialogProps,
  void
>(WrittenTaskDescriptionDialogImpl);
