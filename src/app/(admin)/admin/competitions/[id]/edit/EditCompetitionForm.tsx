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
  Settings,
  FileText,
  AlertCircle,
  Save,
} from 'lucide-react';

interface Competition {
  id: string;
  title: string;
  description: string;
  problem_statement: string | null;
  competition_type: '3-phase' | '4-phase';
  participation_type: 'individual' | 'team';
  scoring_metric: 'f1_score' | 'accuracy' | 'precision' | 'recall' | 'mae' | 'rmse';
  registration_start: string;
  registration_end: string;
  public_test_start: string;
  public_test_end: string;
  private_test_start: string | null;
  private_test_end: string | null;
  dataset_url: string | null;
  sample_submission_url: string | null;
  daily_submission_limit: number;
  max_file_size_mb: number;
  min_team_size: number | null;
  max_team_size: number | null;
}

interface EditCompetitionFormProps {
  competition: Competition;
}

export default function EditCompetitionForm({ competition }: EditCompetitionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [competitionType, setCompetitionType] = useState<'3-phase' | '4-phase'>(competition.competition_type);
  const [participationType, setParticipationType] = useState<'individual' | 'team'>(competition.participation_type);
  const [scoringMetric, setScoringMetric] = useState<'f1_score' | 'accuracy' | 'precision' | 'recall' | 'mae' | 'rmse'>(competition.scoring_metric);

  // Calculate initial durations from existing dates
  const calculateInitialDurations = () => {
    const regStart = new Date(competition.registration_start);
    const regEnd = new Date(competition.registration_end);
    const pubEnd = new Date(competition.public_test_end);
    const privEnd = competition.private_test_end ? new Date(competition.private_test_end) : null;

    const regDuration = Math.ceil((regEnd.getTime() - regStart.getTime()) / (1000 * 60 * 60 * 24));
    const pubDuration = Math.ceil((pubEnd.getTime() - regEnd.getTime()) / (1000 * 60 * 60 * 24));
    const privDuration = privEnd ? Math.ceil((privEnd.getTime() - pubEnd.getTime()) / (1000 * 60 * 60 * 24)) : 7;

    return { regDuration, pubDuration, privDuration };
  };

  const initialDurations = calculateInitialDurations();

  // Timeline state - smart inputs
  const [registrationStart, setRegistrationStart] = useState(
    new Date(competition.registration_start).toISOString().slice(0, 16)
  );
  const [registrationDuration, setRegistrationDuration] = useState(initialDurations.regDuration);
  const [publicTestDuration, setPublicTestDuration] = useState(initialDurations.pubDuration);
  const [privateTestDuration, setPrivateTestDuration] = useState(initialDurations.privDuration);

  // Calculated dates
  const [calculatedDates, setCalculatedDates] = useState({
    registrationEnd: '',
    publicTestStart: '',
    publicTestEnd: '',
    privateTestStart: '',
    privateTestEnd: '',
  });

  // Auto-calculate dates when inputs change
  useEffect(() => {
    if (!registrationStart) return;

    const regStart = new Date(registrationStart);

    // Calculate registration end
    const regEnd = new Date(regStart);
    regEnd.setDate(regEnd.getDate() + registrationDuration);

    // Public test starts right after registration ends
    const pubStart = new Date(regEnd);

    // Calculate public test end
    const pubEnd = new Date(pubStart);
    pubEnd.setDate(pubEnd.getDate() + publicTestDuration);

    // Private test starts right after public test ends (for 4-phase)
    const privStart = new Date(pubEnd);

    // Calculate private test end
    const privEnd = new Date(privStart);
    privEnd.setDate(privEnd.getDate() + privateTestDuration);

    setCalculatedDates({
      registrationEnd: regEnd.toISOString().slice(0, 16),
      publicTestStart: pubStart.toISOString().slice(0, 16),
      publicTestEnd: pubEnd.toISOString().slice(0, 16),
      privateTestStart: privStart.toISOString().slice(0, 16),
      privateTestEnd: privEnd.toISOString().slice(0, 16),
    });
  }, [registrationStart, registrationDuration, publicTestDuration, privateTestDuration]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const formData = new FormData(e.currentTarget);

    // Add calculated dates to formData
    formData.set('registrationEnd', calculatedDates.registrationEnd);
    formData.set('publicTestStart', calculatedDates.publicTestStart);
    formData.set('publicTestEnd', calculatedDates.publicTestEnd);

    if (competitionType === '4-phase') {
      formData.set('privateTestStart', calculatedDates.privateTestStart);
      formData.set('privateTestEnd', calculatedDates.privateTestEnd);
    }

    const result = await updateCompetition(competition.id, formData);

    if (result?.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else if (result?.success) {
      router.push('/admin/competitions');
    }
  };

  // Calculate total competition duration
  const totalDays = registrationDuration + publicTestDuration +
    (competitionType === '4-phase' ? privateTestDuration : 0);

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-4xl sm:text-5xl mb-2 gradient-text">
            Edit Competition
          </h1>
          <p className="text-text-secondary">Update competition details</p>
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
                  placeholder="e.g., Image Classification Challenge 2025"
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
                  placeholder="Brief description that will appear on competition cards"
                  className="w-full px-4 py-3 bg-bg-surface border border-border-default rounded-lg focus:outline-none focus:border-border-focus text-text-primary"
                  rows={3}
                  defaultValue={competition.description}
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
                  placeholder="Detailed problem statement (optional, defaults to description)"
                  className="w-full px-4 py-3 bg-bg-surface border border-border-default rounded-lg focus:outline-none focus:border-border-focus text-text-primary"
                  rows={6}
                  defaultValue={competition.problem_statement || ''}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="competitionType" className="block text-sm font-medium mb-2">
                    Competition Type *
                  </label>
                  <select
                    id="competitionType"
                    name="competitionType"
                    value={competitionType}
                    onChange={(e) => setCompetitionType(e.target.value as '3-phase' | '4-phase')}
                    className="w-full px-4 py-3 bg-bg-surface border border-border-default rounded-lg focus:outline-none focus:border-border-focus text-text-primary"
                    required
                  >
                    <option value="3-phase">3-Phase (Registration → Public Test → End)</option>
                    <option value="4-phase">4-Phase (Registration → Public → Private → End)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="participationType" className="block text-sm font-medium mb-2">
                    Participation Type *
                  </label>
                  <select
                    id="participationType"
                    name="participationType"
                    value={participationType}
                    onChange={(e) => setParticipationType(e.target.value as 'individual' | 'team')}
                    className="w-full px-4 py-3 bg-bg-surface border border-border-default rounded-lg focus:outline-none focus:border-border-focus text-text-primary"
                    required
                  >
                    <option value="individual">Individual</option>
                    <option value="team">Team</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="scoringMetric" className="block text-sm font-medium mb-2">
                  Scoring Metric *
                </label>
                <select
                  id="scoringMetric"
                  name="scoringMetric"
                  value={scoringMetric}
                  onChange={(e) => setScoringMetric(e.target.value as 'f1_score' | 'accuracy' | 'precision' | 'recall' | 'mae' | 'rmse')}
                  className="w-full px-4 py-3 bg-bg-surface border border-border-default rounded-lg focus:outline-none focus:border-border-focus text-text-primary"
                  required
                >
                  <optgroup label="Classification Metrics (Higher is Better)">
                    <option value="f1_score">F1 Score - Harmonic mean of precision and recall</option>
                    <option value="accuracy">Accuracy - Percentage of correct predictions</option>
                    <option value="precision">Precision - Ratio of true positives to predicted positives</option>
                    <option value="recall">Recall - Ratio of true positives to actual positives</option>
                  </optgroup>
                  <optgroup label="Regression Metrics (Lower is Better)">
                    <option value="mae">MAE - Mean Absolute Error</option>
                    <option value="rmse">RMSE - Root Mean Squared Error</option>
                  </optgroup>
                </select>
                <p className="text-xs text-text-tertiary mt-1">
                  Metric used to evaluate submissions. For classification tasks, use F1/Accuracy/Precision/Recall (higher is better). For regression tasks, use MAE/RMSE (lower is better).
                </p>
              </div>

              {/* Team size settings - only show for team competitions */}
              {participationType === 'team' && (
                <div className="grid md:grid-cols-2 gap-6 p-4 bg-accent-cyan/5 border border-accent-cyan/20 rounded-lg">
                  <div>
                    <label htmlFor="minTeamSize" className="block text-sm font-medium mb-2">
                      Minimum Team Size *
                    </label>
                    <Input
                      id="minTeamSize"
                      name="minTeamSize"
                      type="number"
                      defaultValue={competition.min_team_size || 1}
                      min="1"
                      max="10"
                      required
                    />
                    <p className="text-xs text-text-tertiary mt-1">Minimum members required</p>
                  </div>

                  <div>
                    <label htmlFor="maxTeamSize" className="block text-sm font-medium mb-2">
                      Maximum Team Size *
                    </label>
                    <Input
                      id="maxTeamSize"
                      name="maxTeamSize"
                      type="number"
                      defaultValue={competition.max_team_size || 3}
                      min="1"
                      max="10"
                      required
                    />
                    <p className="text-xs text-text-tertiary mt-1">Maximum members allowed</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Smart Timeline */}
          <Card className="p-8 mb-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-accent-cyan" />
              Competition Timeline
            </h2>

            <div className="space-y-6">
              {/* Start date */}
              <div>
                <label htmlFor="registrationStart" className="block text-sm font-medium mb-2">
                  Competition Start Date *
                </label>
                <Input
                  id="registrationStart"
                  name="registrationStart"
                  type="datetime-local"
                  value={registrationStart}
                  onChange={(e) => setRegistrationStart(e.target.value)}
                  required
                />
                <p className="text-xs text-text-tertiary mt-1">
                  When registration opens (first phase begins)
                </p>
              </div>

              {/* Phase durations */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-text-secondary">Phase Durations</h3>

                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="registrationDuration" className="block text-sm font-medium mb-2">
                      Registration Phase *
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="registrationDuration"
                        type="number"
                        value={registrationDuration}
                        onChange={(e) => setRegistrationDuration(parseInt(e.target.value))}
                        min="1"
                        max="365"
                        required
                      />
                      <span className="text-text-tertiary text-sm whitespace-nowrap">days</span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="publicTestDuration" className="block text-sm font-medium mb-2">
                      Public Test Phase *
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="publicTestDuration"
                        type="number"
                        value={publicTestDuration}
                        onChange={(e) => setPublicTestDuration(parseInt(e.target.value))}
                        min="1"
                        max="365"
                        required
                      />
                      <span className="text-text-tertiary text-sm whitespace-nowrap">days</span>
                    </div>
                  </div>

                  {competitionType === '4-phase' && (
                    <div>
                      <label htmlFor="privateTestDuration" className="block text-sm font-medium mb-2">
                        Private Test Phase *
                      </label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="privateTestDuration"
                          type="number"
                          value={privateTestDuration}
                          onChange={(e) => setPrivateTestDuration(parseInt(e.target.value))}
                          min="1"
                          max="365"
                          required
                        />
                        <span className="text-text-tertiary text-sm whitespace-nowrap">days</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline Preview */}
              {registrationStart && (
                <div className="mt-8 p-6 bg-bg-surface border border-border-default rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary-blue" />
                    Timeline Preview
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">Total Duration:</span>
                      <span className="font-bold text-primary-blue">{totalDays} days</span>
                    </div>

                    {/* Visual timeline bar */}
                    <div className="relative h-12 bg-bg-elevated rounded-lg overflow-hidden">
                      {/* Registration phase */}
                      <div
                        className="absolute top-0 left-0 h-full bg-phase-registration/40 border-r-2 border-phase-registration flex items-center justify-center"
                        style={{ width: `${(registrationDuration / totalDays) * 100}%` }}
                      >
                        <span className="text-xs font-semibold text-white">Registration</span>
                      </div>

                      {/* Public test phase */}
                      <div
                        className="absolute top-0 h-full bg-phase-public/40 border-r-2 border-phase-public flex items-center justify-center"
                        style={{
                          left: `${(registrationDuration / totalDays) * 100}%`,
                          width: `${(publicTestDuration / totalDays) * 100}%`,
                        }}
                      >
                        <span className="text-xs font-semibold text-white">Public Test</span>
                      </div>

                      {/* Private test phase (4-phase only) */}
                      {competitionType === '4-phase' && (
                        <div
                          className="absolute top-0 h-full bg-accent-cyan/40 border-r-2 border-accent-cyan flex items-center justify-center"
                          style={{
                            left: `${((registrationDuration + publicTestDuration) / totalDays) * 100}%`,
                            width: `${(privateTestDuration / totalDays) * 100}%`,
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
                          {new Date(registrationStart).toLocaleDateString()} → {calculatedDates.registrationEnd ? new Date(calculatedDates.registrationEnd).toLocaleDateString() : '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-tertiary">Public Test:</span>
                        <span className="font-mono text-text-secondary">
                          {calculatedDates.publicTestStart ? new Date(calculatedDates.publicTestStart).toLocaleDateString() : '—'} → {calculatedDates.publicTestEnd ? new Date(calculatedDates.publicTestEnd).toLocaleDateString() : '—'}
                        </span>
                      </div>
                      {competitionType === '4-phase' && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-text-tertiary">Private Test:</span>
                          <span className="font-mono text-text-secondary">
                            {calculatedDates.privateTestStart ? new Date(calculatedDates.privateTestStart).toLocaleDateString() : '—'} → {calculatedDates.privateTestEnd ? new Date(calculatedDates.privateTestEnd).toLocaleDateString() : '—'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Dataset & Submission Rules */}
          <Card className="p-8 mb-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <FileText className="w-6 h-6 text-success" />
              Dataset & Submission Settings
            </h2>

            <div className="space-y-6">
              {/* Dataset URLs */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="datasetUrl" className="block text-sm font-medium mb-2">
                    Training Dataset URL
                  </label>
                  <Input
                    id="datasetUrl"
                    name="datasetUrl"
                    type="url"
                    placeholder="https://drive.google.com/..."
                    defaultValue={competition.dataset_url || ''}
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
                    placeholder="https://drive.google.com/..."
                    defaultValue={competition.sample_submission_url || ''}
                  />
                  <p className="text-xs text-text-tertiary mt-1">Example submission format</p>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border-default"></div>

              {/* Submission Limits */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-warning" />
                  Submission Limits
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="dailySubmissionLimit" className="block text-sm font-medium mb-2">
                      Daily Submission Limit *
                    </label>
                    <Input
                      id="dailySubmissionLimit"
                      name="dailySubmissionLimit"
                      type="number"
                      defaultValue={competition.daily_submission_limit}
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
                      defaultValue={competition.max_file_size_mb}
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
              {isSubmitting ? 'Updating...' : 'Update Competition'}
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
