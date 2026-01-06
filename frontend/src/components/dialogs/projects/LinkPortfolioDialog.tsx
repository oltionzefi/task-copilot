import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { portfoliosApi, projectsApi } from '@/lib/api';
import type { Project } from 'shared/types';
import { useTranslation } from 'react-i18next';
import { defineModal } from '@/lib/modals';
import { Briefcase } from 'lucide-react';

export type LinkPortfolioResult = {
  action: 'linked' | 'canceled';
  project?: Project;
};

interface LinkPortfolioDialogProps {
  projectId: string;
  projectName: string;
  currentPortfolioId?: string | null;
}

const LinkPortfolioDialogImpl = NiceModal.create<LinkPortfolioDialogProps>(
  ({ projectId, projectName, currentPortfolioId }) => {
    const modal = useModal();
    const { t } = useTranslation('projects');
    const { t: tCommon } = useTranslation('common');
    const queryClient = useQueryClient();

    const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>(
      currentPortfolioId || ''
    );
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data: portfolios, isLoading: portfoliosLoading } = useQuery({
      queryKey: ['portfolios'],
      queryFn: portfoliosApi.getAll,
      staleTime: 5 * 60 * 1000,
    });

    useEffect(() => {
      if (modal.visible) {
        setSelectedPortfolioId(currentPortfolioId || '');
        setError(null);
      }
    }, [modal.visible, currentPortfolioId]);

    const handleLink = async () => {
      if (!selectedPortfolioId && currentPortfolioId) {
        setError(t('portfolioDialog.errors.selectPortfolio'));
        return;
      }

      setError(null);
      setIsSubmitting(true);

      try {
        const updatedProject = await projectsApi.update(projectId, {
          name: null,
          dev_script: null,
          dev_script_working_dir: null,
          default_agent_working_dir: null,
          portfolio_id: selectedPortfolioId || null,
        });

        queryClient.setQueryData(['project', projectId], updatedProject);
        queryClient.invalidateQueries({ queryKey: ['projects'] });

        modal.resolve({
          action: 'linked',
          project: updatedProject,
        } as LinkPortfolioResult);
        modal.hide();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : t('portfolioDialog.errors.linkFailed')
        );
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleUnlink = async () => {
      setError(null);
      setIsSubmitting(true);

      try {
        const updatedProject = await projectsApi.update(projectId, {
          name: null,
          dev_script: null,
          dev_script_working_dir: null,
          default_agent_working_dir: null,
          portfolio_id: null,
        });

        queryClient.setQueryData(['project', projectId], updatedProject);
        queryClient.invalidateQueries({ queryKey: ['projects'] });

        modal.resolve({
          action: 'linked',
          project: updatedProject,
        } as LinkPortfolioResult);
        modal.hide();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : t('portfolioDialog.errors.unlinkFailed')
        );
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleCancel = () => {
      modal.resolve({ action: 'canceled' } as LinkPortfolioResult);
      modal.hide();
    };

    const handleOpenChange = (open: boolean) => {
      if (!open) {
        handleCancel();
      }
    };

    const currentPortfolio = portfolios?.find(
      (p) => p.id === currentPortfolioId
    );

    return (
      <Dialog open={modal.visible} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('portfolioDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('portfolioDialog.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">
                {t('portfolioDialog.projectLabel')}
              </Label>
              <div className="px-3 py-2 bg-muted rounded-md text-sm">
                {projectName}
              </div>
            </div>

            {currentPortfolio && (
              <div className="space-y-2">
                <Label>{t('portfolioDialog.currentPortfolio')}</Label>
                <div className="flex items-center px-3 py-2 bg-muted rounded-md text-sm">
                  <Briefcase className="mr-2 h-4 w-4" />
                  {currentPortfolio.name}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="portfolio-select">
                {currentPortfolio
                  ? t('portfolioDialog.changePortfolio')
                  : t('portfolioDialog.selectPortfolio')}
              </Label>
              {portfoliosLoading ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  {t('portfolioDialog.loadingPortfolios')}
                </div>
              ) : !portfolios?.length ? (
                <Alert>
                  <AlertDescription>
                    {t('portfolioDialog.noPortfolios')}
                  </AlertDescription>
                </Alert>
              ) : (
                <Select
                  value={selectedPortfolioId}
                  onValueChange={(id) => {
                    setSelectedPortfolioId(id);
                    setError(null);
                  }}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="portfolio-select">
                    <SelectValue
                      placeholder={t('portfolioDialog.selectPortfolioPlaceholder')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {portfolios.map((portfolio) => (
                      <SelectItem key={portfolio.id} value={portfolio.id}>
                        {portfolio.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {tCommon('buttons.cancel')}
            </Button>
            {currentPortfolio && (
              <Button
                variant="outline"
                onClick={handleUnlink}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting
                  ? t('portfolioDialog.unlinking')
                  : t('portfolioDialog.unlinkButton')}
              </Button>
            )}
            <Button
              onClick={handleLink}
              disabled={
                !selectedPortfolioId ||
                selectedPortfolioId === currentPortfolioId ||
                isSubmitting ||
                !portfolios?.length
              }
              className="w-full sm:w-auto"
            >
              {isSubmitting
                ? t('portfolioDialog.linking')
                : t('portfolioDialog.linkButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

export const LinkPortfolioDialog = defineModal<
  LinkPortfolioDialogProps,
  LinkPortfolioResult
>(LinkPortfolioDialogImpl);
