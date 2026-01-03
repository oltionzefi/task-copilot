import { useEffect, useCallback, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, FolderGit, FolderOpen } from 'lucide-react';
import { CreateProject } from 'shared/types';
import NiceModal, { useModal } from '@ebay/nice-modal-react';
import { useProjectMutations } from '@/hooks/useProjectMutations';
import { defineModal } from '@/lib/modals';
import { RepoPickerDialog } from '@/components/dialogs/shared/RepoPickerDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface ProjectFormDialogProps {}

export type ProjectFormDialogResult = 'saved' | 'canceled';

type ProjectType = 'with-git' | 'without-git' | null;
type Step = 'select-type' | 'configure' | 'creating';

const ProjectFormDialogImpl = NiceModal.create<ProjectFormDialogProps>(() => {
  const modal = useModal();
  const [step, setStep] = useState<Step>('select-type');
  const [projectType, setProjectType] = useState<ProjectType>(null);
  const [projectName, setProjectName] = useState('');
  const [nameError, setNameError] = useState('');

  const { createProject } = useProjectMutations({
    onCreateSuccess: () => {
      modal.resolve('saved' as ProjectFormDialogResult);
      modal.hide();
    },
    onCreateError: () => {},
  });
  const createProjectMutate = createProject.mutate;

  const hasStartedCreateRef = useRef(false);

  useEffect(() => {
    if (!modal.visible) {
      hasStartedCreateRef.current = false;
      setStep('select-type');
      setProjectType(null);
      setProjectName('');
      setNameError('');
      return;
    }
  }, [modal.visible]);

  const handleSelectProjectType = (type: ProjectType) => {
    setProjectType(type);
    if (type === 'with-git') {
      setStep('configure');
      handlePickRepo();
    } else {
      setStep('configure');
    }
  };

  const handlePickRepo = useCallback(async () => {
    const repo = await RepoPickerDialog.show({
      title: 'Create Project',
      description: 'Select or create a repository for your project',
    });

    if (repo) {
      const projectName = repo.display_name || repo.name;

      const createData: CreateProject = {
        name: projectName,
        repositories: [{ display_name: projectName, git_repo_path: repo.path }],
      };

      setStep('creating');
      createProjectMutate(createData);
    } else {
      setStep('select-type');
      setProjectType(null);
    }
  }, [createProjectMutate]);

  const handleCreateWithoutGit = () => {
    if (!projectName.trim()) {
      setNameError('Project name is required');
      return;
    }

    const createData: CreateProject = {
      name: projectName.trim(),
      repositories: [],
    };

    setStep('creating');
    createProjectMutate(createData);
  };

  const handleBack = () => {
    setStep('select-type');
    setProjectType(null);
    setProjectName('');
    setNameError('');
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && step !== 'creating') {
      modal.resolve('canceled' as ProjectFormDialogResult);
      modal.hide();
    }
  };

  return (
    <Dialog open={modal.visible} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {step === 'select-type' && 'Create New Project'}
            {step === 'configure' && projectType === 'without-git' && 'Project Details'}
            {step === 'creating' && 'Creating Project'}
          </DialogTitle>
          <DialogDescription>
            {step === 'select-type' && 'Choose how you want to create your project'}
            {step === 'configure' && projectType === 'without-git' && 'Enter details for your new project'}
            {step === 'creating' && 'Setting up your project...'}
          </DialogDescription>
        </DialogHeader>

        {step === 'select-type' && (
          <div className="space-y-3">
            <div
              className="p-4 border cursor-pointer hover:shadow-md transition-shadow rounded-lg bg-card"
              onClick={() => handleSelectProjectType('with-git')}
            >
              <div className="flex items-start gap-3">
                <FolderGit className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-foreground">
                    With Git Repository
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Link to an existing repository or create a new one
                  </div>
                </div>
              </div>
            </div>

            <div
              className="p-4 border cursor-pointer hover:shadow-md transition-shadow rounded-lg bg-card"
              onClick={() => handleSelectProjectType('without-git')}
            >
              <div className="flex items-start gap-3">
                <FolderOpen className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-foreground">
                    Without Git Repository
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Create a standalone project without version control
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'configure' && projectType === 'without-git' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">
                Project Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="project-name"
                type="text"
                value={projectName}
                onChange={(e) => {
                  setProjectName(e.target.value);
                  setNameError('');
                }}
                placeholder="My Project"
                autoFocus
              />
              {nameError && (
                <p className="text-xs text-red-500">{nameError}</p>
              )}
            </div>
          </div>
        )}

        {step === 'creating' && (
          <>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>

            {createProject.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {createProject.error instanceof Error
                    ? createProject.error.message
                    : 'Failed to create project'}
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {step === 'configure' && projectType === 'without-git' && (
          <DialogFooter>
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
            <Button onClick={handleCreateWithoutGit}>
              Create Project
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
});

export const ProjectFormDialog = defineModal<
  ProjectFormDialogProps,
  ProjectFormDialogResult
>(ProjectFormDialogImpl);
