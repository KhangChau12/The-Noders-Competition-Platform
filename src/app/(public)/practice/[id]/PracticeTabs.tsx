'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { BookOpen, Trophy, Clock, FileText, Download, CheckCircle, XCircle, Loader } from 'lucide-react';
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
  const decimals = metricInfo?.decimals ?? 4;

  const tabs: { id: Tab; label: string; shortLabel: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', shortLabel: 'Overview', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'leaderboard', label: `Leaderboard (${leaderboard.length})`, shortLabel: `Board (${leaderboard.length})`, icon: <Trophy className="w-4 h-4" /> },
    { id: 'my_submissions', label: 'My Submissions', shortLabel: 'My Subs', icon: <Clock className="w-4 h-4" /> },
  ];

  return (
    <div>
      {/* Tab nav */}
      <div className="flex border-b border-border-default mb-6 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 sm:px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === tab.id
                ? 'border-primary-blue text-primary-blue'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            <span className="hidden sm:block">{tab.icon}</span>
            <span className="sm:hidden">{tab.shortLabel}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          {/* Problem statement */}
          <Card className="lg:col-span-2 p-4 sm:p-6 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Problem Statement</h2>
            <div className="text-text-secondary leading-relaxed text-sm sm:text-base whitespace-pre-wrap break-words overflow-hidden">
              {problem.problem_statement || problem.description}
            </div>
          </Card>

          {/* Sidebar */}
          <div className="space-y-4 lg:sticky lg:top-24 min-w-0">
            {/* At a glance */}
            <Card className="p-4 sm:p-5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary mb-4">
                At a Glance
              </h3>
              <dl className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-text-tertiary">Metric</dt>
                  <dd className="font-semibold text-text-primary text-right">
                    {metricInfo?.name ?? problem.scoring_metric}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-text-tertiary">Goal</dt>
                  <dd className="font-medium text-text-secondary text-right text-xs">
                    {metricInfo?.higher_is_better ? 'Higher is better ↑' : 'Lower is better ↓'}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-text-tertiary">Participants</dt>
                  <dd className="font-semibold text-text-primary font-mono">{leaderboard.length}</dd>
                </div>
                <div className="border-t border-border-default" />
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-text-tertiary">Daily limit</dt>
                  <dd className="font-semibold text-text-primary font-mono">{problem.daily_submission_limit}/day</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-text-tertiary">Total limit</dt>
                  <dd className="font-semibold text-text-primary font-mono">
                    {problem.total_submission_limit === 0 ? 'Unlimited' : problem.total_submission_limit}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-text-tertiary">Max file</dt>
                  <dd className="font-semibold text-text-primary font-mono">{problem.max_file_size_mb} MB</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-text-tertiary">Format</dt>
                  <dd className="font-semibold text-text-primary font-mono text-xs">CSV (id,label)</dd>
                </div>
              </dl>
              {metricInfo?.description && (
                <p className="text-text-tertiary text-xs leading-relaxed mt-4 pt-4 border-t border-border-default">
                  {metricInfo.description}
                </p>
              )}
            </Card>

            {/* Downloads */}
            {(problem.dataset_url || problem.sample_submission_url) && (
              <Card className="p-4 sm:p-5">
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary mb-3">
                  Downloads
                </h3>
                <div className="space-y-2">
                  {problem.dataset_url && (
                    <a href={problem.dataset_url} target="_blank" rel="noopener noreferrer" className="block">
                      <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                        <Download className="w-4 h-4" />
                        Dataset
                      </Button>
                    </a>
                  )}
                  {problem.sample_submission_url && (
                    <a href={problem.sample_submission_url} target="_blank" rel="noopener noreferrer" className="block">
                      <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                        <FileText className="w-4 h-4" />
                        Sample Submission
                      </Button>
                    </a>
                  )}
                </div>
              </Card>
            )}

            {/* Submit CTA */}
            <Card className="p-4 sm:p-5 bg-primary-blue/5 border-primary-blue/20">
              <h3 className="font-bold text-sm mb-1">Ready to practice?</h3>
              <p className="text-text-secondary text-xs mb-4 leading-relaxed">
                Submit your predictions and see where you rank on the leaderboard.
              </p>
              {isAuthenticated ? (
                <Link href={`/practice/${problem.id}/submit`} className="block">
                  <Button variant="primary" size="sm" className="w-full">Submit Solution</Button>
                </Link>
              ) : (
                <Link href="/login" className="block">
                  <Button variant="primary" size="sm" className="w-full">Log in to Submit</Button>
                </Link>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* ── Leaderboard ── */}
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
            <div className="py-20 text-center text-text-tertiary">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-base mb-1">No submissions yet</p>
              <p className="text-sm">Be the first to submit!</p>
            </div>
          )}
        </div>
      )}

      {/* ── My Submissions ── */}
      {activeTab === 'my_submissions' && (
        <div>
          {!isAuthenticated ? (
            <div className="py-20 text-center text-text-tertiary">
              <p className="text-base mb-4">Log in to see your submissions</p>
              <Link href="/login">
                <Button variant="primary" size="sm">Log In</Button>
              </Link>
            </div>
          ) : mySubmissions.length === 0 ? (
            <div className="py-20 text-center text-text-tertiary">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-base mb-1">No submissions yet</p>
              <Link href={`/practice/${problem.id}/submit`}>
                <Button variant="primary" size="sm" className="mt-4">Submit Solution</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {mySubmissions.map((sub) => {
                const isValid = sub.validation_status === 'valid';
                const isInvalid = sub.validation_status === 'invalid';
                return (
                  <Card
                    key={sub.id}
                    className={`p-4 ${sub.is_best_score ? 'border-primary-blue/30 bg-primary-blue/5' : ''}`}
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      {/* Left: badges + filename */}
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        {sub.is_best_score && (
                          <Badge variant="green" className="shrink-0">Best</Badge>
                        )}
                        <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                          isValid ? 'text-success bg-success/10' :
                          isInvalid ? 'text-error bg-error/10' :
                          'text-text-tertiary bg-bg-elevated'
                        }`}>
                          {isValid ? <CheckCircle className="w-3 h-3" /> : isInvalid ? <XCircle className="w-3 h-3" /> : <Loader className="w-3 h-3 animate-spin" />}
                          {sub.validation_status}
                        </span>
                        <span className="text-xs text-text-tertiary truncate max-w-[140px] sm:max-w-xs">
                          {sub.file_name}
                        </span>
                      </div>

                      {/* Right: score + time */}
                      <div className="flex items-center gap-4 shrink-0">
                        {sub.score !== null && (
                          <span className="font-mono font-bold text-text-primary text-base">
                            {sub.score.toFixed(decimals)}
                          </span>
                        )}
                        <span className="text-xs text-text-tertiary whitespace-nowrap">
                          {new Date(sub.submitted_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Error message */}
                    {sub.validation_errors && sub.validation_errors.length > 0 && (
                      <div className="mt-3 p-3 bg-error/10 rounded-lg text-xs text-error leading-relaxed">
                        {Array.isArray(sub.validation_errors)
                          ? sub.validation_errors.join(', ')
                          : String(sub.validation_errors)}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
