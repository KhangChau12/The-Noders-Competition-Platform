'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { submitSolution } from './actions';
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  Trophy,
  Target,
  Calendar,
  X,
  Loader2,
} from 'lucide-react';

export default function SubmitPage() {
  const params = useParams();
  const router = useRouter();
  const competitionId = params.id as string;
  const supabase = createClient();

  const [competition, setCompetition] = useState<any>(null);
  const [registration, setRegistration] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [submissionCount, setSubmissionCount] = useState({ daily: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Get user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);

      // Get competition
      const { data: compData } = await supabase
        .from('competitions')
        .select('*')
        .eq('id', competitionId)
        .is('deleted_at', null)
        .single();

      if (!compData) {
        router.push('/competitions');
        return;
      }
      setCompetition(compData);

      // Get registration
      const { data: regData } = (await supabase
        .from('registrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('competition_id', competitionId)
        .single()) as { data: any };

      setRegistration(regData);

      if (!regData || regData.status !== 'approved') {
        router.push(`/competitions/${competitionId}`);
        return;
      }

      // Get submissions
      const { data: submissionsData } = (await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', user.id)
        .eq('competition_id', competitionId)
        .order('created_at', { ascending: false })) as { data: any };

      setSubmissions(submissionsData || []);

      // Count daily and total submissions
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const dailySubmissions = submissionsData?.filter(
        (sub: any) => new Date(sub.created_at) >= todayStart
      );

      setSubmissionCount({
        daily: dailySubmissions?.length || 0,
        total: submissionsData?.length || 0,
      });

      setLoading(false);
    };

    fetchData();
  }, [competitionId, supabase, router]);

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setSubmitError('Only CSV files are allowed');
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setSubmitError('File size exceeds 10MB limit');
      return;
    }

    setSelectedFile(file);
    setSubmitError('');
    setSubmitMessage('');
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setSubmitError('');
    setSubmitMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      setSubmitError('Please select a file');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitMessage('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    const result = await submitSolution(competitionId, formData);

    if (result?.error) {
      setSubmitError(result.error);
      setIsSubmitting(false);
    } else if (result?.success) {
      setSubmitMessage(
        `Submission successful! Score: ${result.score?.toFixed(4) || 'N/A'}`
      );
      setSelectedFile(null);
      setIsSubmitting(false);

      // Refresh submissions
      if (!userId) return;

      const { data: submissionsData } = (await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', userId)
        .eq('competition_id', competitionId)
        .order('created_at', { ascending: false })) as { data: any };

      setSubmissions(submissionsData || []);

      // Update counts
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const dailySubmissions = submissionsData?.filter(
        (sub: any) => new Date(sub.created_at) >= todayStart
      );

      setSubmissionCount({
        daily: dailySubmissions?.length || 0,
        total: submissionsData?.length || 0,
      });
    }
  };

  // Check if user can submit
  const canSubmit = () => {
    if (!competition || !registration) return false;

    const now = new Date();
    const publicTestEnd = new Date(competition.public_test_end);
    const privateTestEnd = competition.private_test_end
      ? new Date(competition.private_test_end)
      : null;
    const registrationEnd = new Date(competition.registration_end);

    let currentPhase = 'ended';
    if (now >= registrationEnd && now < publicTestEnd) {
      currentPhase = 'public_test';
    } else if (privateTestEnd && now >= publicTestEnd && now < privateTestEnd) {
      currentPhase = 'private_test';
    }

    if (currentPhase !== 'public_test' && currentPhase !== 'private_test') {
      return false;
    }

    if (submissionCount.daily >= competition.daily_submission_limit) {
      return false;
    }

    if (submissionCount.total >= competition.total_submission_limit) {
      return false;
    }

    return true;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-blue" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl sm:text-5xl mb-2 gradient-text">
            Submit Solution
          </h1>
          <p className="text-text-secondary">{competition?.title}</p>
        </div>

        {/* Submission Quota */}
        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 border-l-4 border-primary-blue">
            <div className="flex items-center justify-between mb-2">
              <div className="text-text-tertiary text-sm">Daily Submissions</div>
              <Calendar className="w-5 h-5 text-primary-blue" />
            </div>
            <div className="text-3xl font-bold">
              {submissionCount.daily} / {competition?.daily_submission_limit || 0}
            </div>
            <div className="text-xs text-text-tertiary mt-1">
              {competition?.daily_submission_limit - submissionCount.daily} remaining today
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-accent-cyan">
            <div className="flex items-center justify-between mb-2">
              <div className="text-text-tertiary text-sm">Total Submissions</div>
              <Target className="w-5 h-5 text-accent-cyan" />
            </div>
            <div className="text-3xl font-bold">
              {submissionCount.total} / {competition?.total_submission_limit || 0}
            </div>
            <div className="text-xs text-text-tertiary mt-1">
              {competition?.total_submission_limit - submissionCount.total} remaining overall
            </div>
          </Card>
        </div>

        {/* Upload Section */}
        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Upload className="w-6 h-6 text-primary-blue" />
            Upload Submission
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Drag & Drop Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
                isDragging
                  ? 'border-primary-blue bg-primary-blue/10'
                  : 'border-border-default hover:border-border-focus'
              } ${!canSubmit() ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => {
                if (canSubmit()) {
                  document.getElementById('file-input')?.click();
                }
              }}
            >
              <input
                id="file-input"
                type="file"
                accept=".csv"
                onChange={handleFileInputChange}
                className="hidden"
                disabled={!canSubmit()}
              />

              {selectedFile ? (
                <div className="flex items-center justify-center gap-4">
                  <FileText className="w-12 h-12 text-success" />
                  <div className="text-left">
                    <div className="font-medium">{selectedFile.name}</div>
                    <div className="text-sm text-text-tertiary">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile();
                    }}
                    className="p-2 hover:bg-bg-tertiary rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
                  <p className="text-lg font-medium mb-2">
                    {canSubmit()
                      ? 'Drag and drop your CSV file here'
                      : 'Submission not allowed'}
                  </p>
                  <p className="text-sm text-text-tertiary">
                    {canSubmit() ? 'or click to browse' : 'Check quota and competition phase'}
                  </p>
                </>
              )}
            </div>

            {/* Submit Button */}
            <div className="mt-6">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={!selectedFile || !canSubmit() || isSubmitting}
                loading={isSubmitting}
              >
                <Trophy className="w-5 h-5 mr-2" />
                {isSubmitting ? 'Submitting...' : 'Submit Solution'}
              </Button>
            </div>

            {/* Messages */}
            {submitError && (
              <div className="mt-4 p-4 bg-error/10 border border-error/30 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
                <p className="text-error">{submitError}</p>
              </div>
            )}

            {submitMessage && (
              <div className="mt-4 p-4 bg-success/10 border border-success/30 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                <p className="text-success">{submitMessage}</p>
              </div>
            )}

            {/* Submission Rules */}
            <div className="mt-6 p-4 bg-bg-tertiary rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-warning" />
                Submission Rules
              </h3>
              <ul className="text-sm text-text-secondary space-y-1">
                <li>" File must be in CSV format</li>
                <li>" Maximum file size: 10MB</li>
                <li>
                  " Daily limit: {competition?.daily_submission_limit || 0} submissions
                </li>
                <li>
                  " Total limit: {competition?.total_submission_limit || 0} submissions
                </li>
                <li>" Submissions only allowed during Public Test and Private Test phases</li>
              </ul>
            </div>
          </form>
        </Card>

        {/* Recent Submissions */}
        <Card className="p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Target className="w-6 h-6 text-accent-cyan" />
            My Submissions
          </h2>

          {submissions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border-default">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Score</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Phase</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Submitted At
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {submissions.map((submission, index) => (
                    <tr key={submission.id} className="hover:bg-bg-tertiary/50">
                      <td className="px-4 py-3 text-sm">{submissions.length - index}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-medium">
                          {submission.score?.toFixed(4) || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            submission.phase === 'public_test' ? 'public' : 'private'
                          }
                        >
                          {submission.phase === 'public_test' ? 'Public' : 'Private'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {submission.is_best_score && (
                          <Badge variant="success">Best Score</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {new Date(submission.created_at).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-text-tertiary">
              <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No submissions yet</p>
              <p className="text-sm">Upload your first solution to get started</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
