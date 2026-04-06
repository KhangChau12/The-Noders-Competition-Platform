'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlertCircle, BookOpen, FileText, Settings, Tag, ChevronLeft } from 'lucide-react';
import { updatePracticeProblem } from './actions';
import type { PracticeProblemRow, PracticeTag } from '@/types/database.types';
import Link from 'next/link';

interface Props {
  problem: PracticeProblemRow;
  allTags: PracticeTag[];
  currentTagIds: string[];
}

export default function EditPracticeProblemForm({ problem, allTags, currentTagIds }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(currentTagIds);

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    selectedTagIds.forEach((id) => formData.append('tagIds', id));

    const result = await updatePracticeProblem(problem.id, formData);

    if (result?.error) {
      setError(result.error as string);
      setIsSubmitting(false);
    } else {
      router.push('/admin/practice');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <Link href="/admin/practice">
          <Button variant="outline" size="sm" type="button">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Practice Problems
          </Button>
        </Link>
      </div>

      {/* Basic Info */}
      <Card className="p-8 mb-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary-blue" />
          Basic Information
        </h2>

        <div className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">Problem Title *</label>
            <Input id="title" name="title" defaultValue={problem.title} required />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">Short Description *</label>
            <textarea
              id="description"
              name="description"
              defaultValue={problem.description}
              className="w-full px-4 py-3 bg-bg-surface border border-border-default rounded-lg focus:outline-none focus:border-border-focus text-text-primary"
              rows={3}
              required
            />
          </div>

          <div>
            <label htmlFor="problemStatement" className="block text-sm font-medium mb-2">Problem Statement</label>
            <textarea
              id="problemStatement"
              name="problemStatement"
              defaultValue={problem.problem_statement ?? ''}
              className="w-full px-4 py-3 bg-bg-surface border border-border-default rounded-lg focus:outline-none focus:border-border-focus text-text-primary"
              rows={6}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="scoringMetric" className="block text-sm font-medium mb-2">Scoring Metric *</label>
              <select
                id="scoringMetric"
                name="scoringMetric"
                defaultValue={problem.scoring_metric}
                className="w-full px-4 py-3 bg-bg-surface border border-border-default rounded-lg focus:outline-none focus:border-border-focus text-text-primary"
                required
              >
                <optgroup label="Classification (Higher is Better)">
                  <option value="f1_score">F1 Score</option>
                  <option value="accuracy">Accuracy</option>
                  <option value="precision">Precision</option>
                  <option value="recall">Recall</option>
                </optgroup>
                <optgroup label="Regression (Lower is Better)">
                  <option value="mae">MAE – Mean Absolute Error</option>
                  <option value="rmse">RMSE – Root Mean Squared Error</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium mb-2">Difficulty</label>
              <select
                id="difficulty"
                name="difficulty"
                defaultValue={problem.difficulty ?? ''}
                className="w-full px-4 py-3 bg-bg-surface border border-border-default rounded-lg focus:outline-none focus:border-border-focus text-text-primary"
              >
                <option value="">— Not specified —</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Tags
            </label>
            {allTags.length === 0 ? (
              <p className="text-sm text-text-tertiary">No tags available.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      selectedTagIds.includes(tag.id)
                        ? 'bg-primary-blue text-white border-primary-blue'
                        : 'bg-bg-surface text-text-secondary border-border-default hover:border-primary-blue'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Dataset & Settings */}
      <Card className="p-8 mb-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <FileText className="w-6 h-6 text-success" />
          Dataset & Submission Settings
        </h2>

        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="datasetUrl" className="block text-sm font-medium mb-2">Training Dataset URL</label>
              <Input id="datasetUrl" name="datasetUrl" type="url" defaultValue={problem.dataset_url ?? ''} />
            </div>
            <div>
              <label htmlFor="sampleSubmissionUrl" className="block text-sm font-medium mb-2">Sample Submission URL</label>
              <Input id="sampleSubmissionUrl" name="sampleSubmissionUrl" type="url" defaultValue={problem.sample_submission_url ?? ''} />
            </div>
          </div>

          <div className="border-t border-border-default" />

          <div>
            <label htmlFor="answerKey" className="block text-sm font-medium mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-error" />
              Replace Answer Key CSV (optional)
            </label>
            <Input id="answerKey" name="answerKey" type="file" accept=".csv" className="cursor-pointer" />
            <p className="text-xs text-text-tertiary mt-1">Leave empty to keep the existing answer key</p>
          </div>

          <div className="border-t border-border-default" />

          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-warning" />
              Submission Limits
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="dailySubmissionLimit" className="block text-sm font-medium mb-2">Daily Limit *</label>
                <Input id="dailySubmissionLimit" name="dailySubmissionLimit" type="number" defaultValue={problem.daily_submission_limit} min="1" max="100" required />
                <p className="text-xs text-text-tertiary mt-1">Per day per user</p>
              </div>
              <div>
                <label htmlFor="totalSubmissionLimit" className="block text-sm font-medium mb-2">Total Limit</label>
                <Input id="totalSubmissionLimit" name="totalSubmissionLimit" type="number" defaultValue={problem.total_submission_limit} min="0" />
                <p className="text-xs text-text-tertiary mt-1">0 = unlimited</p>
              </div>
              <div>
                <label htmlFor="maxFileSizeMb" className="block text-sm font-medium mb-2">Max File Size (MB) *</label>
                <Input id="maxFileSizeMb" name="maxFileSizeMb" type="number" defaultValue={problem.max_file_size_mb} min="1" max="100" required />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {error && (
        <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
          <p className="text-error">{error}</p>
        </div>
      )}

      <div className="flex gap-4">
        <Button type="submit" variant="primary" size="lg" disabled={isSubmitting} loading={isSubmitting} className="flex-1">
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={() => router.back()} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
