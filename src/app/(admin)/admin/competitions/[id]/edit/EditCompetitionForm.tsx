'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { updateCompetition } from './actions';
import {
  Trophy,
  Calendar,
  FileText,
  AlertCircle,
  Save,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

interface EditCompetitionFormProps {
  competition: any;
}

export default function EditCompetitionForm({
  competition,
}: EditCompetitionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Timeline state for preview
  const [timeline, setTimeline] = useState({
    registrationStart: competition.registration_start?.slice(0, 16) || '',
    registrationEnd: competition.registration_end?.slice(0, 16) || '',
    publicTestStart: competition.public_test_start?.slice(0, 16) || '',
    publicTestEnd: competition.public_test_end?.slice(0, 16) || '',
    privateTestStart: competition.private_test_start?.slice(0, 16) || '',
    privateTestEnd: competition.private_test_end?.slice(0, 16) || '',
  });

  // Calculate durations for timeline preview
  const calculateDurations = () => {
    if (!timeline.registrationStart || !timeline.publicTestEnd) return null;

    const regStart = new Date(timeline.registrationStart);
    const regEnd = new Date(timeline.registrationEnd);
    const pubStart = new Date(timeline.publicTestStart);
    const pubEnd = new Date(timeline.publicTestEnd);
    const privStart = timeline.privateTestStart ? new Date(timeline.privateTestStart) : null;
    const privEnd = timeline.privateTestEnd ? new Date(timeline.privateTestEnd) : null;

    const regDays = Math.ceil((regEnd.getTime() - regStart.getTime()) / (1000 * 60 * 60 * 24));
    const pubDays = Math.ceil((pubEnd.getTime() - pubStart.getTime()) / (1000 * 60 * 60 * 24));
    const privDays = privStart && privEnd ? Math.ceil((privEnd.getTime() - privStart.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    const totalDays = regDays + pubDays + privDays;

    return { regDays, pubDays, privDays, totalDays };
  };

  const durations = calculateDurations();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const formData = new FormData(e.currentTarget);

    const result = await updateCompetition(competition.id, formData);

    if (result?.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else if (result?.success) {
      router.push('/admin/competitions');
      router.refresh();
    }
  };

  // Determine competition type from data
  const hasPrivateTest = competition.private_test_start && competition.private_test_end;

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href="/admin/competitions"
            className="inline-flex items-center text-text-secondary hover:text-primary-blue mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Competitions
          </Link>
          <h1 className="font-display text-4xl sm:text-5xl mb-2 gradient-text">
            Edit Competition
          </h1>
          <p className="text-text-secondary">Update competition details and settings</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <Card className="p-8 mb-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-primary-blue" />
              Basic Information
            </h2>

            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-2">
                  Competition Title *
                </label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  defaultValue={competition.title}
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-2">
                  Short Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  defaultValue={competition.description}
                  className="w-full px-4 py-3 bg-bg-surface border border-border-default rounded-lg focus:outline-none focus:border-border-focus text-text-primary"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label htmlFor="problemStatement" className="block text-sm font-medium mb-2">
                  Problem Statement
                </label>
                <textarea
                  id="problemStatement"
                  name="problemStatement"
                  defaultValue={competition.problem_statement || ''}
                  className="w-full px-4 py-3 bg-bg-surface border border-border-default rounded-lg focus:outline-none focus:border-border-focus text-text-primary"
                  rows={6}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="participationType" className="block text-sm font-medium mb-2">
                    Participation Type *
                  </label>
                  <select
                    id="participationType"
                    name="participationType"
                    defaultValue={competition.participation_type}
                    className="w-full px-4 py-3 bg-bg-surface border border-border-default rounded-lg focus:outline-none focus:border-border-focus text-text-primary"
                    required
                  >
                    <option value="individual">Individual</option>
                    <option value="team">Team</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="scoringMetric" className="block text-sm font-medium mb-2">
                    Scoring Metric *
                  </label>
                  <select
                    id="scoringMetric"
                    name="scoringMetric"
                    defaultValue={competition.scoring_metric || 'f1_score'}
                    className="w-full px-4 py-3 bg-bg-surface border border-border-default rounded-lg focus:outline-none focus:border-border-focus text-text-primary"
                    required
                  >
                    <option value="f1_score">F1 Score</option>
                    <option value="accuracy">Accuracy</option>
                    <option value="rmse">RMSE</option>
                    <option value="mae">MAE</option>
                    <option value="auc">AUC-ROC</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Timeline */}
          <Card className="p-8 mb-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-accent-cyan" />
              Competition Timeline
            </h2>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="registrationStart" className="block text-sm font-medium mb-2">
                    Registration Start *
                  </label>
                  <Input
                    id="registrationStart"
                    name="registrationStart"
                    type="datetime-local"
                    value={timeline.registrationStart}
                    onChange={(e) => setTimeline({...timeline, registrationStart: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="registrationEnd" className="block text-sm font-medium mb-2">
                    Registration End *
                  </label>
                  <Input
                    id="registrationEnd"
                    name="registrationEnd"
                    type="datetime-local"
                    value={timeline.registrationEnd}
                    onChange={(e) => setTimeline({...timeline, registrationEnd: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="publicTestStart" className="block text-sm font-medium mb-2">
                    Public Test Start *
                  </label>
                  <Input
                    id="publicTestStart"
                    name="publicTestStart"
                    type="datetime-local"
                    value={timeline.publicTestStart}
                    onChange={(e) => setTimeline({...timeline, publicTestStart: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="publicTestEnd" className="block text-sm font-medium mb-2">
                    Public Test End *
                  </label>
                  <Input
                    id="publicTestEnd"
                    name="publicTestEnd"
                    type="datetime-local"
                    value={timeline.publicTestEnd}
                    onChange={(e) => setTimeline({...timeline, publicTestEnd: e.target.value})}
                    required
                  />
                </div>
              </div>

              {hasPrivateTest && (
                <div className="grid md:grid-cols-2 gap-6 p-4 bg-accent-cyan/5 border border-accent-cyan/20 rounded-lg">
                  <div>
                    <label htmlFor="privateTestStart" className="block text-sm font-medium mb-2">
                      Private Test Start
                    </label>
                    <Input
                      id="privateTestStart"
                      name="privateTestStart"
                      type="datetime-local"
                      value={timeline.privateTestStart}
                      onChange={(e) => setTimeline({...timeline, privateTestStart: e.target.value})}
                    />
                  </div>

                  <div>
                    <label htmlFor="privateTestEnd" className="block text-sm font-medium mb-2">
                      Private Test End
                    </label>
                    <Input
                      id="privateTestEnd"
                      name="privateTestEnd"
                      type="datetime-local"
                      value={timeline.privateTestEnd}
                      onChange={(e) => setTimeline({...timeline, privateTestEnd: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {/* Timeline Preview */}
              {durations && timeline.registrationStart && (
                <div className="mt-8 p-6 bg-bg-surface border border-border-default rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary-blue" />
                    Timeline Preview
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">Total Duration:</span>
                      <span className="font-bold text-primary-blue">{durations.totalDays} days</span>
                    </div>

                    {/* Visual timeline bar */}
                    <div className="relative h-12 bg-bg-elevated rounded-lg overflow-hidden">
                      {/* Registration phase */}
                      <div
                        className="absolute top-0 left-0 h-full bg-phase-registration/40 border-r-2 border-phase-registration flex items-center justify-center"
                        style={{ width: `${(durations.regDays / durations.totalDays) * 100}%` }}
                      >
                        <span className="text-xs font-semibold text-white">Registration</span>
                      </div>

                      {/* Public test phase */}
                      <div
                        className="absolute top-0 h-full bg-phase-public/40 border-r-2 border-phase-public flex items-center justify-center"
                        style={{
                          left: `${(durations.regDays / durations.totalDays) * 100}%`,
                          width: `${(durations.pubDays / durations.totalDays) * 100}%`,
                        }}
                      >
                        <span className="text-xs font-semibold text-white">Public Test</span>
                      </div>

                      {/* Private test phase */}
                      {durations.privDays > 0 && (
                        <div
                          className="absolute top-0 h-full bg-accent-cyan/40 border-r-2 border-accent-cyan flex items-center justify-center"
                          style={{
                            left: `${((durations.regDays + durations.pubDays) / durations.totalDays) * 100}%`,
                            width: `${(durations.privDays / durations.totalDays) * 100}%`,
                          }}
                        >
                          <span className="text-xs font-semibold text-white">Private Test</span>
                        </div>
                      )}
                    </div>

                    {/* Phase dates */}
                    <div className="grid gap-2 mt-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-tertiary">Registration:</span>
                        <span className="font-mono text-text-secondary">
                          {new Date(timeline.registrationStart).toLocaleDateString()} → {new Date(timeline.registrationEnd).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-tertiary">Public Test:</span>
                        <span className="font-mono text-text-secondary">
                          {new Date(timeline.publicTestStart).toLocaleDateString()} → {new Date(timeline.publicTestEnd).toLocaleDateString()}
                        </span>
                      </div>
                      {durations.privDays > 0 && timeline.privateTestStart && timeline.privateTestEnd && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-text-tertiary">Private Test:</span>
                          <span className="font-mono text-text-secondary">
                            {new Date(timeline.privateTestStart).toLocaleDateString()} → {new Date(timeline.privateTestEnd).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Dataset & Submission */}
          <Card className="p-8 mb-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <FileText className="w-6 h-6 text-success" />
              Dataset & Submission Settings
            </h2>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="datasetUrl" className="block text-sm font-medium mb-2">
                    Training Dataset URL
                  </label>
                  <Input
                    id="datasetUrl"
                    name="datasetUrl"
                    type="url"
                    defaultValue={competition.dataset_url || ''}
                    placeholder="https://drive.google.com/..."
                  />
                  <p className="text-xs text-text-tertiary mt-1">Public dataset for participants</p>
                </div>

                <div>
                  <label htmlFor="sampleSubmissionUrl" className="block text-sm font-medium mb-2">
                    Sample Submission URL
                  </label>
                  <Input
                    id="sampleSubmissionUrl"
                    name="sampleSubmissionUrl"
                    type="url"
                    defaultValue={competition.sample_submission_url || ''}
                    placeholder="https://drive.google.com/..."
                  />
                  <p className="text-xs text-text-tertiary mt-1">Example submission format</p>
                </div>
              </div>

              <div>
                <label htmlFor="datasetDescription" className="block text-sm font-medium mb-2">
                  Dataset Description
                </label>
                <textarea
                  id="datasetDescription"
                  name="datasetDescription"
                  defaultValue={competition.dataset_description || ''}
                  className="w-full px-4 py-3 bg-bg-surface border border-border-default rounded-lg focus:outline-none focus:border-border-focus text-text-primary"
                  rows={4}
                  placeholder="Describe the dataset structure, features, and format..."
                />
              </div>

              <div className="border-t border-border-default pt-6">
                <h3 className="text-lg font-semibold mb-4">Submission Limits</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="dailySubmissionLimit" className="block text-sm font-medium mb-2">
                      Daily Submission Limit *
                    </label>
                    <Input
                      id="dailySubmissionLimit"
                      name="dailySubmissionLimit"
                      type="number"
                      defaultValue={competition.daily_submission_limit || 5}
                      min="1"
                      max="100"
                      required
                    />
                    <p className="text-xs text-text-tertiary mt-1">Max submissions per day per user/team</p>
                  </div>

                  <div>
                    <label htmlFor="maxFileSizeMb" className="block text-sm font-medium mb-2">
                      Max File Size (MB) *
                    </label>
                    <Input
                      id="maxFileSizeMb"
                      name="maxFileSizeMb"
                      type="number"
                      defaultValue={competition.max_file_size_mb || 10}
                      min="1"
                      max="100"
                      required
                    />
                    <p className="text-xs text-text-tertiary mt-1">Maximum CSV file size</p>
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
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting}
              loading={isSubmitting}
              className="flex-1"
            >
              <Save className="w-5 h-5 mr-2" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
