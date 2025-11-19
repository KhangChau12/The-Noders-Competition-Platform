'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Trophy, FileText, History, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface CompetitionTabsProps {
  competition: any;
  leaderboard: any[];
  isRegistered: boolean;
  userId?: string;
}

type TabType = 'overview' | 'leaderboard' | 'submissions';

export default function CompetitionTabs({
  competition,
  leaderboard: initialLeaderboard,
  isRegistered,
  userId
}: CompetitionTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState(initialLeaderboard);
  const [loading, setLoading] = useState(false);

  // Fetch user submissions when switching to submissions tab
  useEffect(() => {
    if (activeTab === 'submissions' && isRegistered && userId) {
      fetchUserSubmissions();
    }
  }, [activeTab, isRegistered, userId]);

  // Fetch full leaderboard when switching to leaderboard tab
  useEffect(() => {
    if (activeTab === 'leaderboard') {
      fetchFullLeaderboard();
    }
  }, [activeTab]);

  const fetchUserSubmissions = async () => {
    if (!userId) return;

    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('competition_id', competition.id)
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false });

    if (!error && data) {
      setSubmissions(data);
    }
    setLoading(false);
  };

  const fetchFullLeaderboard = async () => {
    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from('submissions')
      .select(`
        id,
        score,
        submitted_at,
        user_id,
        users:user_id (
          full_name,
          email
        )
      `)
      .eq('competition_id', competition.id)
      .eq('is_best_score', true)
      .eq('validation_status', 'valid')
      .order('score', { ascending: false })
      .limit(100);

    if (!error && data) {
      setLeaderboard(data);
    }
    setLoading(false);
  };

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: FileText },
    { id: 'leaderboard' as TabType, label: 'Leaderboard', icon: Trophy },
    ...(isRegistered ? [{ id: 'submissions' as TabType, label: 'My Submissions', icon: History }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border-default">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-6 py-3 font-semibold transition-all
                border-b-2 -mb-px
                ${activeTab === tab.id
                  ? 'border-primary-blue text-primary-blue'
                  : 'border-transparent text-text-tertiary hover:text-text-secondary'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && <OverviewTab competition={competition} />}
        {activeTab === 'leaderboard' && (
          <LeaderboardTab leaderboard={leaderboard} loading={loading} />
        )}
        {activeTab === 'submissions' && (
          <SubmissionsTab submissions={submissions} loading={loading} />
        )}
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ competition }: { competition: any }) {
  return (
    <div className="space-y-6">
      {/* Problem Statement */}
      <Card className="p-6">
        <h3 className="text-2xl font-bold mb-4">Problem Statement</h3>
        <div className="prose prose-invert max-w-none">
          {competition.problem_statement ? (
            <div className="text-text-secondary whitespace-pre-wrap leading-relaxed">
              {competition.problem_statement}
            </div>
          ) : (
            <p className="text-text-tertiary">No problem statement provided yet.</p>
          )}
        </div>
      </Card>

      {/* Timeline */}
      <Card className="p-6">
        <h3 className="text-2xl font-bold mb-4">Timeline</h3>
        <div className="space-y-4">
          <TimelineItem
            label="Registration Period"
            start={competition.registration_start}
            end={competition.registration_end}
          />
          <TimelineItem
            label="Public Test Phase"
            start={competition.public_test_start}
            end={competition.public_test_end}
          />
          {competition.competition_type === '4-phase' && competition.private_test_start && (
            <TimelineItem
              label="Private Test Phase"
              start={competition.private_test_start}
              end={competition.private_test_end}
            />
          )}
        </div>
      </Card>

      {/* Evaluation */}
      <Card className="p-6">
        <h3 className="text-2xl font-bold mb-4">Evaluation</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-bg-elevated rounded-lg border border-border-default">
            <span className="text-text-secondary">Scoring Metric</span>
            <span className="font-semibold">{competition.scoring_metric || 'F1 Score'}</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-bg-elevated rounded-lg border border-border-default">
            <span className="text-text-secondary">Submission Format</span>
            <span className="font-semibold">CSV</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Leaderboard Tab Component
function LeaderboardTab({ leaderboard, loading }: { leaderboard: any[]; loading: boolean }) {
  if (loading) {
    return (
      <Card className="p-12">
        <div className="text-center text-text-tertiary">Loading leaderboard...</div>
      </Card>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center text-text-tertiary">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No submissions yet. Be the first to submit!</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-bg-elevated border-b border-border-default">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Rank</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Participant</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-text-secondary">Score</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-text-secondary">Submitted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {leaderboard.map((entry, index) => (
              <tr
                key={entry.id}
                className={`
                  transition-colors hover:bg-bg-elevated
                  ${index === 0 ? 'bg-warning/5' : ''}
                  ${index === 1 ? 'bg-text-secondary/5' : ''}
                  ${index === 2 ? 'bg-phase-registration/5' : ''}
                `}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`
                      font-bold text-lg
                      ${index === 0 ? 'text-warning' : ''}
                      ${index === 1 ? 'text-text-secondary' : ''}
                      ${index === 2 ? 'text-phase-registration' : ''}
                      ${index > 2 ? 'text-text-tertiary' : ''}
                    `}>
                      #{index + 1}
                    </span>
                    {index < 3 && <Trophy className="w-4 h-4" />}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-medium">
                    {entry.users?.full_name || entry.users?.email?.split('@')[0] || 'Anonymous'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="font-mono font-bold text-primary-blue">
                    {entry.score?.toFixed(4) || '0.0000'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-sm text-text-tertiary">
                  {new Date(entry.submitted_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// Submissions Tab Component
function SubmissionsTab({ submissions, loading }: { submissions: any[]; loading: boolean }) {
  if (loading) {
    return (
      <Card className="p-12">
        <div className="text-center text-text-tertiary">Loading submissions...</div>
      </Card>
    );
  }

  if (submissions.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center text-text-tertiary">
          <History className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No submissions yet. Submit your first solution!</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-bg-elevated border-b border-border-default">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">File</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Status</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-text-secondary">Score</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-text-secondary">Submitted</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-text-secondary">Best</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {submissions.map((submission) => (
              <tr key={submission.id} className="transition-colors hover:bg-bg-elevated">
                <td className="px-6 py-4">
                  <span className="font-medium text-sm">{submission.file_name}</span>
                </td>
                <td className="px-6 py-4">
                  <Badge
                    variant={
                      submission.validation_status === 'valid' ? 'success' :
                      submission.validation_status === 'invalid' ? 'danger' :
                      'secondary'
                    }
                  >
                    {submission.validation_status}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  {submission.score !== null ? (
                    <span className="font-mono font-bold text-primary-blue">
                      {submission.score.toFixed(4)}
                    </span>
                  ) : (
                    <span className="text-text-tertiary">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 text-sm text-text-tertiary">
                    <Clock className="w-4 h-4" />
                    {new Date(submission.submitted_at).toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  {submission.is_best_score && (
                    <Trophy className="w-5 h-5 text-warning mx-auto" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// Timeline Item Component
function TimelineItem({ label, start, end }: { label: string; start: string; end: string }) {
  return (
    <div className="flex items-center justify-between p-4 bg-bg-elevated rounded-lg border border-border-default">
      <span className="text-text-secondary font-medium">{label}</span>
      <span className="font-mono text-sm">
        {new Date(start).toLocaleDateString()} - {new Date(end).toLocaleDateString()}
      </span>
    </div>
  );
}
