'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { validateCompetitionDates } from '@/lib/utils/validation';

const competitionSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  problem_statement: z.string().optional(),
  competition_type: z.enum(['3-phase', '4-phase']),
  participation_type: z.enum(['individual', 'team']),
  registration_start: z.string(),
  registration_end: z.string(),
  public_test_start: z.string(),
  public_test_end: z.string(),
  private_test_start: z.string().optional(),
  private_test_end: z.string().optional(),
  daily_submission_limit: z.number().min(1).max(50),
  total_submission_limit: z.number().min(1).max(500),
  max_file_size_mb: z.number().min(1).max(50),
  min_team_size: z.number().min(1).optional(),
  max_team_size: z.number().min(1).optional(),
  dataset_url: z.string().url().optional().or(z.literal('')),
});

type CompetitionFormData = z.infer<typeof competitionSchema>;

interface CompetitionFormProps {
  initialData?: Partial<CompetitionFormData>;
  onSubmit: (data: CompetitionFormData) => Promise<void>;
  isLoading?: boolean;
}

export function CompetitionForm({ initialData, onSubmit, isLoading }: CompetitionFormProps) {
  const [customErrors, setCustomErrors] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CompetitionFormData>({
    resolver: zodResolver(competitionSchema),
    defaultValues: initialData || {
      competition_type: '3-phase',
      participation_type: 'individual',
      daily_submission_limit: 5,
      total_submission_limit: 50,
      max_file_size_mb: 10,
      min_team_size: 1,
      max_team_size: 3,
    },
  });

  const competitionType = watch('competition_type');
  const participationType = watch('participation_type');

  const handleFormSubmit = async (data: CompetitionFormData) => {
    setCustomErrors([]);

    // Validate dates
    const dateValidation = validateCompetitionDates({
      registration_start: new Date(data.registration_start),
      registration_end: new Date(data.registration_end),
      public_test_start: new Date(data.public_test_start),
      public_test_end: new Date(data.public_test_end),
      private_test_start: data.private_test_start ? new Date(data.private_test_start) : null,
      private_test_end: data.private_test_end ? new Date(data.private_test_end) : null,
      competition_type: data.competition_type,
    });

    if (!dateValidation.valid) {
      setCustomErrors(dateValidation.errors);
      return;
    }

    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Error Display */}
      {customErrors.length > 0 && (
        <div className="bg-error/10 border border-error rounded-lg p-4">
          <h4 className="text-error font-semibold mb-2">Validation Errors:</h4>
          <ul className="list-disc list-inside text-error text-sm space-y-1">
            {customErrors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Basic Information */}
      <Card>
        <h3 className="text-lg font-bold text-text-primary mb-4">Basic Information</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-text-primary mb-2">
              Competition Title *
            </label>
            <Input
              id="title"
              {...register('title')}
              error={errors.title?.message}
              placeholder="e.g., Image Classification Challenge"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-text-primary mb-2">
              Short Description *
            </label>
            <textarea
              id="description"
              {...register('description')}
              className="w-full bg-bg-surface border border-border-default rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-blue"
              rows={3}
              placeholder="Brief description of the competition..."
            />
            {errors.description && (
              <p className="text-error text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="problem_statement" className="block text-sm font-semibold text-text-primary mb-2">
              Problem Statement (Markdown supported)
            </label>
            <textarea
              id="problem_statement"
              {...register('problem_statement')}
              className="w-full bg-bg-surface border border-border-default rounded-lg px-4 py-3 text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
              rows={10}
              placeholder="# Problem Statement&#10;&#10;Detailed description..."
            />
          </div>
        </div>
      </Card>

      {/* Competition Type */}
      <Card>
        <h3 className="text-lg font-bold text-text-primary mb-4">Competition Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Phase Type *
            </label>
            <select
              {...register('competition_type')}
              className="w-full bg-bg-surface border border-border-default rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="3-phase">3-Phase (Registration → Test → Ended)</option>
              <option value="4-phase">4-Phase (Registration → Public → Private → Ended)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Participation Type *
            </label>
            <select
              {...register('participation_type')}
              className="w-full bg-bg-surface border border-border-default rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="individual">Individual</option>
              <option value="team">Team</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Timeline */}
      <Card>
        <h3 className="text-lg font-bold text-text-primary mb-4">Timeline</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="registration_start" className="block text-sm font-semibold text-text-primary mb-2">
              Registration Start *
            </label>
            <Input
              id="registration_start"
              type="datetime-local"
              {...register('registration_start')}
              error={errors.registration_start?.message}
            />
          </div>

          <div>
            <label htmlFor="registration_end" className="block text-sm font-semibold text-text-primary mb-2">
              Registration End *
            </label>
            <Input
              id="registration_end"
              type="datetime-local"
              {...register('registration_end')}
              error={errors.registration_end?.message}
            />
          </div>

          <div>
            <label htmlFor="public_test_start" className="block text-sm font-semibold text-text-primary mb-2">
              {competitionType === '3-phase' ? 'Test Start' : 'Public Test Start'} *
            </label>
            <Input
              id="public_test_start"
              type="datetime-local"
              {...register('public_test_start')}
              error={errors.public_test_start?.message}
            />
          </div>

          <div>
            <label htmlFor="public_test_end" className="block text-sm font-semibold text-text-primary mb-2">
              {competitionType === '3-phase' ? 'Test End' : 'Public Test End'} *
            </label>
            <Input
              id="public_test_end"
              type="datetime-local"
              {...register('public_test_end')}
              error={errors.public_test_end?.message}
            />
          </div>

          {competitionType === '4-phase' && (
            <>
              <div>
                <label htmlFor="private_test_start" className="block text-sm font-semibold text-text-primary mb-2">
                  Private Test Start *
                </label>
                <Input
                  id="private_test_start"
                  type="datetime-local"
                  {...register('private_test_start')}
                  error={errors.private_test_start?.message}
                />
              </div>

              <div>
                <label htmlFor="private_test_end" className="block text-sm font-semibold text-text-primary mb-2">
                  Private Test End *
                </label>
                <Input
                  id="private_test_end"
                  type="datetime-local"
                  {...register('private_test_end')}
                  error={errors.private_test_end?.message}
                />
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Submission Rules */}
      <Card>
        <h3 className="text-lg font-bold text-text-primary mb-4">Submission Rules</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="daily_submission_limit" className="block text-sm font-semibold text-text-primary mb-2">
              Daily Limit *
            </label>
            <Input
              id="daily_submission_limit"
              type="number"
              {...register('daily_submission_limit', { valueAsNumber: true })}
              error={errors.daily_submission_limit?.message}
              placeholder="5"
            />
          </div>

          <div>
            <label htmlFor="total_submission_limit" className="block text-sm font-semibold text-text-primary mb-2">
              Total Limit *
            </label>
            <Input
              id="total_submission_limit"
              type="number"
              {...register('total_submission_limit', { valueAsNumber: true })}
              error={errors.total_submission_limit?.message}
              placeholder="50"
            />
          </div>

          <div>
            <label htmlFor="max_file_size_mb" className="block text-sm font-semibold text-text-primary mb-2">
              Max File Size (MB) *
            </label>
            <Input
              id="max_file_size_mb"
              type="number"
              {...register('max_file_size_mb', { valueAsNumber: true })}
              error={errors.max_file_size_mb?.message}
              placeholder="10"
            />
          </div>
        </div>
      </Card>

      {/* Team Settings */}
      {participationType === 'team' && (
        <Card>
          <h3 className="text-lg font-bold text-text-primary mb-4">Team Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="min_team_size" className="block text-sm font-semibold text-text-primary mb-2">
                Min Team Size *
              </label>
              <Input
                id="min_team_size"
                type="number"
                {...register('min_team_size', { valueAsNumber: true })}
                error={errors.min_team_size?.message}
                placeholder="1"
              />
            </div>

            <div>
              <label htmlFor="max_team_size" className="block text-sm font-semibold text-text-primary mb-2">
                Max Team Size *
              </label>
              <Input
                id="max_team_size"
                type="number"
                {...register('max_team_size', { valueAsNumber: true })}
                error={errors.max_team_size?.message}
                placeholder="3"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Dataset */}
      <Card>
        <h3 className="text-lg font-bold text-text-primary mb-4">Dataset</h3>
        <div>
          <label htmlFor="dataset_url" className="block text-sm font-semibold text-text-primary mb-2">
            Public Dataset URL
          </label>
          <Input
            id="dataset_url"
            type="url"
            {...register('dataset_url')}
            error={errors.dataset_url?.message}
            placeholder="https://example.com/dataset.zip"
          />
          <p className="text-text-tertiary text-sm mt-1">
            Link to download the training/test data (without labels)
          </p>
        </div>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" loading={isLoading}>
          {initialData ? 'Update Competition' : 'Create Competition'}
        </Button>
      </div>
    </form>
  );
}
