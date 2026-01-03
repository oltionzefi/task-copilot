import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Project, Portfolio } from 'shared/types';
import { ProjectFormDialog } from '@/components/dialogs/projects/ProjectFormDialog';
import { AlertCircle, Loader2, Plus, FolderKanban } from 'lucide-react';
import ProjectCard from '@/components/projects/ProjectCard.tsx';
import { useKeyCreate, Scope } from '@/keyboard';
import { useProjects } from '@/hooks/useProjects';
import { portfoliosApi } from '@/lib/api';
import { getPortfolioThemeStyles } from '@/constants/portfolioThemes';

type ProjectGroup = {
  key: string;
  portfolio: Portfolio | null;
  projects: Project[];
};

export function ProjectList() {
  const navigate = useNavigate();
  const { t } = useTranslation('projects');
  const { projects, isLoading, error: projectsError } = useProjects();
  const { data: portfolios } = useQuery({
    queryKey: ['portfolios'],
    queryFn: portfoliosApi.getAll,
    staleTime: 5 * 60 * 1000,
  });
  const [error, setError] = useState('');
  const [focusedProjectId, setFocusedProjectId] = useState<string | null>(null);

  const handleCreateProject = async () => {
    try {
      const result = await ProjectFormDialog.show({});
      if (result === 'saved') return;
    } catch (error) {
      // User cancelled - do nothing
    }
  };

  // Semantic keyboard shortcut for creating new project
  useKeyCreate(handleCreateProject, { scope: Scope.PROJECTS });

  const handleEditProject = (project: Project) => {
    navigate(`/settings/projects?projectId=${project.id}`);
  };

  // Set initial focus when projects are loaded
  useEffect(() => {
    if (projects.length === 0) {
      setFocusedProjectId(null);
      return;
    }

    if (!focusedProjectId || !projects.some((p) => p.id === focusedProjectId)) {
      setFocusedProjectId(projects[0].id);
    }
  }, [projects, focusedProjectId]);

  // Group projects by portfolio
  const groupedProjects = useMemo(() => {
    const groups = new Map<string, ProjectGroup>();
    
    // Group projects
    projects.forEach((project) => {
      const portfolioId = project.portfolio_id || 'unassigned';
      if (!groups.has(portfolioId)) {
        const portfolio = portfolios?.find((p) => p.id === portfolioId) || null;
        groups.set(portfolioId, { key: portfolioId, portfolio, projects: [] });
      }
      groups.get(portfolioId)!.projects.push(project);
    });

    // Sort groups: portfolios first (alphabetically), then unassigned
    return Array.from(groups.values()).sort((a, b) => {
      if (a.key === 'unassigned') return 1;
      if (b.key === 'unassigned') return -1;
      return (a.portfolio?.name || '').localeCompare(b.portfolio?.name || '');
    });
  }, [projects, portfolios]);

  return (
    <div className="space-y-6 p-8 pb-16 md:pb-8 h-full overflow-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button onClick={handleCreateProject}>
          <Plus className="mr-2 h-4 w-4" />
          {t('createProject')}
        </Button>
      </div>

      {(error || projectsError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || projectsError?.message || t('errors.fetchFailed')}
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {t('loading')}
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <Plus className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">{t('empty.title')}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('empty.description')}
            </p>
            <Button className="mt-4" onClick={handleCreateProject}>
              <Plus className="mr-2 h-4 w-4" />
              {t('empty.createFirst')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {groupedProjects.map(({ key, portfolio, projects: groupProjects }) => {
            const themeStyles = portfolio?.theme
              ? getPortfolioThemeStyles(portfolio.theme)
              : null;
            
            return (
              <div key={key} className="space-y-4">
                <div className="flex items-center gap-3">
                  {portfolio ? (
                    <>
                      <div
                        className={`h-1 w-12 rounded-full ${
                          themeStyles?.accent || 'bg-muted'
                        }`}
                      />
                      <h2 className="text-xl font-semibold flex items-center gap-2">
                        <FolderKanban className="h-5 w-5" />
                        {portfolio.name}
                      </h2>
                      {portfolio.description && (
                        <p className="text-sm text-muted-foreground">
                          {portfolio.description}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="h-1 w-12 rounded-full bg-muted" />
                      <h2 className="text-xl font-semibold text-muted-foreground">
                        {t('unassignedProjects', { defaultValue: 'Unassigned Projects' })}
                      </h2>
                    </>
                  )}
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {groupProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      isFocused={focusedProjectId === project.id}
                      setError={setError}
                      onEdit={handleEditProject}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
