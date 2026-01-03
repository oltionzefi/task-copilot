import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cloneDeep, merge, isEqual } from 'lodash';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { useUserSystem } from '@/components/ConfigProvider';

export function PlatformSettings() {
  const { t } = useTranslation(['settings', 'common']);

  const {
    config,
    loading,
    updateAndSaveConfig,
  } = useUserSystem();

  const [draft, setDraft] = useState(() => (config ? cloneDeep(config) : null));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!config) return;
    if (!dirty) {
      setDraft(cloneDeep(config));
    }
  }, [config, dirty]);

  const hasUnsavedChanges = useMemo(() => {
    if (!draft || !config) return false;
    return !isEqual(draft, config);
  }, [draft, config]);

  const updateDraft = useCallback(
    (patch: Partial<typeof config>) => {
      setDraft((prev: typeof config) => {
        if (!prev) return prev;
        const next = merge({}, prev, patch);
        if (!isEqual(next, config)) {
          setDirty(true);
        }
        return next;
      });
    },
    [config]
  );

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  const handleSave = async () => {
    if (!draft) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await updateAndSaveConfig(draft);
      setDirty(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(t('settings.platforms.save.error'));
      console.error('Error saving config:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (!config) return;
    setDraft(cloneDeep(config));
    setDirty(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">{t('settings.platforms.loading')}</span>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="py-8">
        <Alert variant="destructive">
          <AlertDescription>{t('settings.platforms.loadError')}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          <AlertDescription className="font-medium">
            {t('settings.platforms.save.success')}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.platforms.jira.title')}</CardTitle>
          <CardDescription>
            {t('settings.platforms.jira.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="jira-enabled"
              checked={draft?.jira?.enabled ?? false}
              onCheckedChange={(checked: boolean) =>
                updateDraft({
                  jira: {
                    ...draft!.jira,
                    enabled: checked,
                  },
                })
              }
            />
            <div className="space-y-0.5">
              <Label htmlFor="jira-enabled" className="cursor-pointer">
                {t('settings.platforms.jira.enabled.label')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.platforms.jira.enabled.helper')}
              </p>
            </div>
          </div>

          {draft?.jira?.enabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="jira-base-url">
                  {t('settings.platforms.jira.baseUrl.label')}
                </Label>
                <Input
                  id="jira-base-url"
                  type="url"
                  placeholder={t('settings.platforms.jira.baseUrl.placeholder')}
                  value={draft?.jira?.base_url || ''}
                  onChange={(e) =>
                    updateDraft({
                      jira: {
                        ...draft!.jira,
                        base_url: e.target.value || null,
                      },
                    })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  {t('settings.platforms.jira.baseUrl.helper')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jira-email">
                  {t('settings.platforms.jira.email.label')}
                </Label>
                <Input
                  id="jira-email"
                  type="email"
                  placeholder={t('settings.platforms.jira.email.placeholder')}
                  value={draft?.jira?.email || ''}
                  onChange={(e) =>
                    updateDraft({
                      jira: {
                        ...draft!.jira,
                        email: e.target.value || null,
                      },
                    })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  {t('settings.platforms.jira.email.helper')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jira-api-token">
                  {t('settings.platforms.jira.apiToken.label')}
                </Label>
                <Input
                  id="jira-api-token"
                  type="password"
                  placeholder={t('settings.platforms.jira.apiToken.placeholder')}
                  value={draft?.jira?.api_token || ''}
                  onChange={(e) =>
                    updateDraft({
                      jira: {
                        ...draft!.jira,
                        api_token: e.target.value || null,
                      },
                    })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  {t('settings.platforms.jira.apiToken.helper')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jira-ticket-template">
                  {t('settings.platforms.jira.ticketTemplate.label')}
                </Label>
                <textarea
                  id="jira-ticket-template"
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder={t(
                    'settings.platforms.jira.ticketTemplate.placeholder'
                  )}
                  value={draft?.jira?.ticket_template || ''}
                  onChange={(e) =>
                    updateDraft({
                      jira: {
                        ...draft!.jira,
                        ticket_template: e.target.value || null,
                      },
                    })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  {t('settings.platforms.jira.ticketTemplate.helper')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jira-bug-template">
                  {t('settings.platforms.jira.bugTemplate.label')}
                </Label>
                <textarea
                  id="jira-bug-template"
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder={t(
                    'settings.platforms.jira.bugTemplate.placeholder'
                  )}
                  value={draft?.jira?.bug_template || ''}
                  onChange={(e) =>
                    updateDraft({
                      jira: {
                        ...draft!.jira,
                        bug_template: e.target.value || null,
                      },
                    })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  {t('settings.platforms.jira.bugTemplate.helper')}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.platforms.slack.title')}</CardTitle>
          <CardDescription>
            {t('settings.platforms.slack.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="slack-enabled"
              checked={draft?.slack?.enabled ?? false}
              onCheckedChange={(checked: boolean) =>
                updateDraft({
                  slack: {
                    ...draft!.slack,
                    enabled: checked,
                  },
                })
              }
            />
            <div className="space-y-0.5">
              <Label htmlFor="slack-enabled" className="cursor-pointer">
                {t('settings.platforms.slack.enabled.label')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.platforms.slack.enabled.helper')}
              </p>
            </div>
          </div>

          {draft?.slack?.enabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="slack-bot-token">
                  {t('settings.platforms.slack.botToken.label')}
                </Label>
                <Input
                  id="slack-bot-token"
                  type="password"
                  placeholder={t('settings.platforms.slack.botToken.placeholder')}
                  value={draft?.slack?.bot_token || ''}
                  onChange={(e) =>
                    updateDraft({
                      slack: {
                        ...draft!.slack,
                        bot_token: e.target.value || null,
                      },
                    })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  {t('settings.platforms.slack.botToken.helper')}
                </p>
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="slack-autoreply-enabled"
                    checked={draft?.slack?.autoreply_enabled ?? false}
                    onCheckedChange={(checked: boolean) =>
                      updateDraft({
                        slack: {
                          ...draft!.slack,
                          autoreply_enabled: checked,
                        },
                      })
                    }
                  />
                  <div className="space-y-0.5">
                    <Label htmlFor="slack-autoreply-enabled" className="cursor-pointer">
                      {t('settings.platforms.slack.autoreply.enabled.label')}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.platforms.slack.autoreply.enabled.helper')}
                    </p>
                  </div>
                </div>

                {draft?.slack?.autoreply_enabled && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="slack-autoreply-tone">
                        {t('settings.platforms.slack.autoreply.tone.label')}
                      </Label>
                      <Input
                        id="slack-autoreply-tone"
                        type="text"
                        placeholder={t('settings.platforms.slack.autoreply.tone.placeholder')}
                        value={draft?.slack?.autoreply_tone || ''}
                        onChange={(e) =>
                          updateDraft({
                            slack: {
                              ...draft!.slack,
                              autoreply_tone: e.target.value || null,
                            },
                          })
                        }
                      />
                      <p className="text-sm text-muted-foreground">
                        {t('settings.platforms.slack.autoreply.tone.helper')}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base">
                        {t('settings.platforms.slack.autoreply.scope.label')}
                      </Label>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="slack-autoreply-per-message"
                          checked={draft?.slack?.autoreply_per_message ?? false}
                          onCheckedChange={(checked: boolean) =>
                            updateDraft({
                              slack: {
                                ...draft!.slack,
                                autoreply_per_message: checked,
                              },
                            })
                          }
                        />
                        <div className="space-y-0.5">
                          <Label htmlFor="slack-autoreply-per-message" className="cursor-pointer font-normal">
                            {t('settings.platforms.slack.autoreply.perMessage.label')}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {t('settings.platforms.slack.autoreply.perMessage.helper')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="slack-autoreply-per-chat"
                          checked={draft?.slack?.autoreply_per_chat ?? false}
                          onCheckedChange={(checked: boolean) =>
                            updateDraft({
                              slack: {
                                ...draft!.slack,
                                autoreply_per_chat: checked,
                              },
                            })
                          }
                        />
                        <div className="space-y-0.5">
                          <Label htmlFor="slack-autoreply-per-chat" className="cursor-pointer font-normal">
                            {t('settings.platforms.slack.autoreply.perChat.label')}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {t('settings.platforms.slack.autoreply.perChat.helper')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="slack-autoreply-dm-only"
                          checked={draft?.slack?.autoreply_dm_only ?? false}
                          onCheckedChange={(checked: boolean) =>
                            updateDraft({
                              slack: {
                                ...draft!.slack,
                                autoreply_dm_only: checked,
                              },
                            })
                          }
                        />
                        <div className="space-y-0.5">
                          <Label htmlFor="slack-autoreply-dm-only" className="cursor-pointer font-normal">
                            {t('settings.platforms.slack.autoreply.dmOnly.label')}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {t('settings.platforms.slack.autoreply.dmOnly.helper')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="slack-keep-context"
                        checked={draft?.slack?.keep_context ?? false}
                        onCheckedChange={(checked: boolean) =>
                          updateDraft({
                            slack: {
                              ...draft!.slack,
                              keep_context: checked,
                            },
                          })
                        }
                      />
                      <div className="space-y-0.5">
                        <Label htmlFor="slack-keep-context" className="cursor-pointer">
                          {t('settings.platforms.slack.autoreply.keepContext.label')}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {t('settings.platforms.slack.autoreply.keepContext.helper')}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.platforms.confluence.title')}</CardTitle>
          <CardDescription>
            {t('settings.platforms.confluence.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="confluence-enabled"
              checked={draft?.confluence?.enabled ?? false}
              onCheckedChange={(checked: boolean) =>
                updateDraft({
                  confluence: {
                    ...draft!.confluence,
                    enabled: checked,
                  },
                })
              }
            />
            <div className="space-y-0.5">
              <Label htmlFor="confluence-enabled" className="cursor-pointer">
                {t('settings.platforms.confluence.enabled.label')}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.platforms.confluence.enabled.helper')}
              </p>
            </div>
          </div>

          {draft?.confluence?.enabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="confluence-base-url">
                  {t('settings.platforms.confluence.baseUrl.label')}
                </Label>
                <Input
                  id="confluence-base-url"
                  type="url"
                  placeholder={t('settings.platforms.confluence.baseUrl.placeholder')}
                  value={draft?.confluence?.base_url || ''}
                  onChange={(e) =>
                    updateDraft({
                      confluence: {
                        ...draft!.confluence,
                        base_url: e.target.value || null,
                      },
                    })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  {t('settings.platforms.confluence.baseUrl.helper')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confluence-email">
                  {t('settings.platforms.confluence.email.label')}
                </Label>
                <Input
                  id="confluence-email"
                  type="email"
                  placeholder={t('settings.platforms.confluence.email.placeholder')}
                  value={draft?.confluence?.email || ''}
                  onChange={(e) =>
                    updateDraft({
                      confluence: {
                        ...draft!.confluence,
                        email: e.target.value || null,
                      },
                    })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  {t('settings.platforms.confluence.email.helper')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confluence-api-token">
                  {t('settings.platforms.confluence.apiToken.label')}
                </Label>
                <Input
                  id="confluence-api-token"
                  type="password"
                  placeholder={t('settings.platforms.confluence.apiToken.placeholder')}
                  value={draft?.confluence?.api_token || ''}
                  onChange={(e) =>
                    updateDraft({
                      confluence: {
                        ...draft!.confluence,
                        api_token: e.target.value || null,
                      },
                    })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  {t('settings.platforms.confluence.apiToken.helper')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confluence-space-key">
                  {t('settings.platforms.confluence.spaceKey.label')}
                </Label>
                <Input
                  id="confluence-space-key"
                  type="text"
                  placeholder={t('settings.platforms.confluence.spaceKey.placeholder')}
                  value={draft?.confluence?.space_key || ''}
                  onChange={(e) =>
                    updateDraft({
                      confluence: {
                        ...draft!.confluence,
                        space_key: e.target.value || null,
                      },
                    })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  {t('settings.platforms.confluence.spaceKey.helper')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confluence-parent-page-id">
                  {t('settings.platforms.confluence.parentPageId.label')}
                </Label>
                <Input
                  id="confluence-parent-page-id"
                  type="text"
                  placeholder={t('settings.platforms.confluence.parentPageId.placeholder')}
                  value={draft?.confluence?.parent_page_id || ''}
                  onChange={(e) =>
                    updateDraft({
                      confluence: {
                        ...draft!.confluence,
                        parent_page_id: e.target.value || null,
                      },
                    })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  {t('settings.platforms.confluence.parentPageId.helper')}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="sticky bottom-0 z-10 bg-background/80 backdrop-blur-sm border-t py-4">
        <div className="flex items-center justify-between">
          {hasUnsavedChanges ? (
            <span className="text-sm text-muted-foreground">
              {t('settings.platforms.save.unsavedChanges')}
            </span>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDiscard}
              disabled={!hasUnsavedChanges || saving}
            >
              {t('settings.platforms.save.discard')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasUnsavedChanges || saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('settings.platforms.save.button')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
