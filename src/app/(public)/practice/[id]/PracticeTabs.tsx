'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { BookOpen, Trophy, Clock, FileText } from 'lucide-react';
import LeaderboardTable from '@/components/leaderboard/LeaderboardTable';
import Link from 'next/link';
import { SCORING_METRIC_INFO } from '@/lib/constants';
import type { PracticeProblemRow, PracticeTag } from '@/types/database.types';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string | null;
  score: number;
  totalSubmissions: number;
  lastSubmissionAt: string;
  isCurrentUser?: boolean;
}

interface MySubmission {
  id: string;
  score: number | null;
  is_best_score: boolean;
  validation_status: string;
  validation_errors: string[] | null;
  file_name: string;
  submitted_at: string;
}

interface Props {
  problem: PracticeProblemRow & { tags: PracticeTag[] };
  leaderboard: LeaderboardEntry[];
  mySubmissions: MySubmission[];
  currentUserId: string | null;
  isAuthenticated: boolean;
}

type Tab = 'overview' | 'leaderboard' | 'my_submissions';

export default function PracticeTabs({ problem, leaderboard, mySubmissions, currentUserId, isAuthenticated }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const metricInfo = SCORING_METRIC_INFO[problem.scoring_metric as keyof typeof SCORING_METRIC_INFO];

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'leaderboard', label: `Leaderboard (${leaderboard.length})`, icon: <Trophy className="w-4 h-4" /> },
    { id: 'my_submissions', label: 'My Submissions', icon: <Clock className="w-4 h-4" /> },
  ];

  return (
    <div>
      {/* Tab Nav */}
      <div className="flex border-b border-border-default mb-8 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-primary-blue text-primary-blue'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Problem Statement */}
          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary-blue" />
              Problem Statement
            </h2>
            <div className="prose prose-invert max-w-none">
              <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">
                {problem.problem_statement || problem.description}
              </p>
            </div>
          </Card>

          {/* Metadata */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Scoring Metric</h3>
              <div className="flex items-center gap-3">
                <Badge variant="tech">{metricInfo?.name ?? problem.scoring_metric}</Badge>
                <span className="text-text-tertiary text-sm">
                  {metricInfo?.higher_is_better ? 'Higher is better' : 'Lower is better'}
                </span>
              </div>
              <p className="text-text-secondary text-sm mt-3">{metricInfo?.description}</p>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Submission Rules</h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li>Daily limit: <strong className="text-text-primary">{problem.daily_submission_limit}</strong> submissions</li>
                <li>Total limit: <strong className="text-text-primary">
                  {problem.total_submission_limit === 0 ? 'Unlimited' : problem.total_submission_limit}
                </strong></li>
                <li>Max file size: <strong className="text-text-primary">{problem.max_file_size_mb} MB</strong></li>
                <li>Format: <strong className="text-text-primary">CSV (id,label)</strong></li>
              </ul>
            </Card>
          </div>

          {/* Downloads */}
          {(problem.dataset_url || problem.sample_submission_url) && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Downloads</h3>
              <div className="flex flex-wrap gap-3">
                {problem.dataset_url && (
                  <a href={problem.dataset_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline">
                      <FileText className="w-4 h-4 mr-2" />
                      Download Dataset
                    </Button>
                  </a>
                )}
                {problem.sample_submission_url && (
                  <a href={problem.sample_submission_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline">
                      <FileText className="w-4 h-4 mr-2" />
                      Sample Submission
                    </Button>
                  </a>
                )}
              </div>
            </Card>
          )}

          {/* Submit CTA */}
          <Card className="p-8 bg-primary-blue/5 border-primary-blue/20">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-xl font-bold mb-1">Ready to practice?</h3>
                <p className="text-text-secondary text-sm">Submit your predictions and see where you rank.</p>
              </div>
              {isAuthenticated ? (
                <Link href={`/practice/${problem.id}/submit`}>
                  <Button variant="primary" size="lg">Submit Solution</Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button variant="primary" size="lg">Log in to Submit</Button>
                </Link>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div>
          {leaderboard.length > 0 ? (
            <LeaderboardTable
              data={leaderboard.map((e) => ({
                ...e,
                userName: e.userName ?? undefined,
                isCurrentUser: e.userId === currentUserId,
              }))}
              currentUserId={currentUserId ?? undefined}
            />
          ) : (
            <div className="py-24 text-center text-text-tertiary">
              <Trophy className="w-16 h-16 mx-auto mb-4 opacity-40" />
              <p className="text-lg mb-2">No submissions yet</p>
              <p className="text-sm">Be the first to submit!</p>
            </div>
          )}
        </div>
      )}

      {/* My Submissions Tab */}
      {activeTab === 'my_submissions' && (
        <div>
          {!isAuthenticated ? (
            <div className="py-24 text-center text-text-tertiary">
              <p className="text-lg mb-4">Log in to see your submissions</p>
              <Link href="/login">
                <Button variant="primary">Log In</Button>
              </Link>
            </div>
          ) : mySubmissions.length === 0 ? (
            <div className="py-24 text-center text-text-tertiary">
              <Clock className="w-16 h-16 mx-auto mb-4 opacity-40" />
              <p className="text-lg mb-2">No submissions yet</p>
              <Link href={`/practice/${problem.id}/submit`}>
                <Button variant="primary" className="mt-4">Submit Solution</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {mySubmissions.map((sub) => (
                <Card key={sub.id} className={`p-5 ${sub.is_best_score ? 'border-primary-blue/30 bg-primary-blue/5' : ''}`}>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      {sub.is_best_score && <Badge variant="green">Best</Badge>}
                      <Badge
                        variant={
                          sub.validation_status === 'valid'
                            ? 'green'
                            : sub.validation_status === 'invalid'
                            ? 'red'
                            : 'yellow'
                        }
                      >
                        {sub.validation_status}
                      </Badge>
                      <span className="text-sm text-text-secondary">{sub.file_name}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      {sub.score !== null && (
                        <span className="text-lg font-bold text-text-primary font-mono">
                          {sub.score.toFixed(metricInfo?.decimals ?? 4)}
                        </span>
                      )}
                      <span className="text-xs text-text-tertiary">
                        {new Date(sub.submitted_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {sub.validation_errors && sub.validation_errors.length > 0 && (
                    <div className="mt-3 p-3 bg-error/10 rounded text-sm text-error">
                      {Array.isArray(sub.validation_errors)
                        ? sub.validation_errors.join(', ')
                        : String(sub.validation_errors)}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
