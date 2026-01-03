import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, Trash2, Edit2 } from 'lucide-react';
import { portfoliosApi } from '@/lib/api';
import type { Portfolio, CreatePortfolio, UpdatePortfolio } from 'shared/types';
import { AutoExpandingTextarea } from '@/components/ui/auto-expanding-textarea';

interface PortfolioFormData {
  name: string;
  description: string;
  theme: string;
}

export function PortfolioSettings() {
  const { t } = useTranslation('settings');
  const queryClient = useQueryClient();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PortfolioFormData>({
    name: '',
    description: '',
    theme: '',
  });
  const [error, setError] = useState<string | null>(null);

  // Fetch portfolios
  const {
    data: portfolios,
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ['portfolios'],
    queryFn: portfoliosApi.getAll,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreatePortfolio) => portfoliosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      resetForm();
      setIsCreating(false);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePortfolio }) =>
      portfoliosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      resetForm();
      setEditingId(null);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => portfoliosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolios'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const resetForm = () => {
    setFormData({ name: '', description: '', theme: '' });
    setError(null);
  };

  const handleCreate = () => {
    setIsCreating(true);
    resetForm();
  };

  const handleEdit = (portfolio: Portfolio) => {
    setEditingId(portfolio.id);
    setFormData({
      name: portfolio.name,
      description: portfolio.description || '',
      theme: portfolio.theme || '',
    });
    setIsCreating(false);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const data = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      theme: formData.theme.trim() || null,
    };

    if (!data.name) {
      setError('Portfolio name is required');
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this portfolio?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load portfolios</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Portfolios</CardTitle>
          <CardDescription>
            Organize your projects into portfolios with themes and descriptions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Portfolio List */}
          <div className="space-y-2">
            {portfolios && portfolios.length > 0 ? (
              portfolios.map((portfolio) => (
                <div
                  key={portfolio.id}
                  className="flex items-start justify-between p-4 border rounded-md"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{portfolio.name}</div>
                    {portfolio.description && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {portfolio.description}
                      </div>
                    )}
                    {portfolio.theme && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Theme: {portfolio.theme}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(portfolio)}
                      disabled={
                        isCreating ||
                        editingId !== null ||
                        deleteMutation.isPending
                      }
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(portfolio.id)}
                      disabled={
                        isCreating ||
                        editingId !== null ||
                        deleteMutation.isPending
                      }
                    >
                      {deleteMutation.isPending &&
                      deleteMutation.variables === portfolio.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No portfolios yet. Create one to organize your projects.
              </div>
            )}
          </div>

          {/* Create/Edit Form */}
          {(isCreating || editingId) && (
            <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="portfolio-name">Name *</Label>
                <Input
                  id="portfolio-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="My Portfolio"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="portfolio-description">Description</Label>
                <AutoExpandingTextarea
                  id="portfolio-description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="A collection of related projects..."
                  maxRows={6}
                  className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="portfolio-theme">Theme</Label>
                <Input
                  id="portfolio-theme"
                  value={formData.theme}
                  onChange={(e) =>
                    setFormData({ ...formData, theme: e.target.value })
                  }
                  placeholder="e.g., blue, green, purple"
                />
                <p className="text-sm text-muted-foreground">
                  Optional theme identifier for visual organization
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {editingId ? 'Updating...' : 'Creating...'}
                    </>
                  ) : editingId ? (
                    'Update Portfolio'
                  ) : (
                    'Create Portfolio'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {/* Create Button */}
          {!isCreating && !editingId && (
            <Button
              variant="outline"
              onClick={handleCreate}
              disabled={deleteMutation.isPending}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Portfolio
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
