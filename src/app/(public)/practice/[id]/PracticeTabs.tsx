'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  BookOpen, Trophy, Clock, FileText, Download,
  CheckCircle, XCircle, Loader, ArrowRight, Target,
} from 'lucide-react';
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
  myBestScore: MySubmission | null;
  myRank: number | null;
}

type Tab = 'overview' | 'leaderboard' | 'my_submissions';

export default function PracticeTabs({
  problem,
  leaderboard,
  mySubmissions,
  currentUserId,
  isAuthenticated,
  myBestScore,
  myRank,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const metricInfo = SCORING_METRIC_INFO[problem.scoring_metric as keyof typeof SCORING_METRIC_INFO];
  const decimals = metricInfo?.decimals ?? 4;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview',       label: 'Overview',                     icon: <BookOpen className="w-4 h-4" /> },
    { id: 'leaderboard',    label: `Leaderboard (${leaderboard.length})`, icon: <Trophy className="w-4 h-4" /> },
    { id: 'my_submissions', label: 'My Submissions',               icon: <Clock className="w-4 h-4" /> },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
      {/* ── Left / main (2 cols on lg) ── */}
      {/* order-2 on mobile so sidebar CTA comes first (order-1), main content second */}
      <div className="lg:col-span-2 min-w-0 order-2 lg:order-1">

        {/* Personal stats strip — shown when user has a best score */}
        {isAuthenticated && myBestScore && (
          <Card className="p-4 mb-5 border-primary-blue/20 bg-primary-blue/5">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-text-disabled mb-0.5">Best Score</p>
                <p className="font-mono font-bold text-primary-blue text-xl leading-none">
                  {myBestScore.score?.toFixed(decimals)}
                </p>
              </div>
              {myRank && myRank > 0 && (
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-text-disabled mb-0.5">Your Rank</p>
                  <p className="font-bold text-text-primary text-xl leading-none">
                    #{myRank}
                    <span className="text-text-tertiary font-normal text-sm ml-1">/ {leaderboard.length}</span>
                  </p>
                </div>
              )}
              <div className="ml-auto shrink-0">
                <Link href={`/practice/${problem.id}/submit`}>
                  <Button variant="primary" size="sm" className="gap-1.5 whitespace-nowrap">
                    <ArrowRight className="w-4 h-4" />
                    <span className="hidden xs:inline">Submit Again</span>
                    <span className="xs:hidden">Submit</span>
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* Tab nav — py-3.5 ensures ≥44px touch height */}
        <div className="flex border-b border-border-default mb-5 sm:mb-6 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 sm:px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 min-h-[44px] ${
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

        {/* ── Overview ── */}
        {activeTab === 'overview' && (
          <Card className="p-4 sm:p-6 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Problem Statement</h2>
            <div className="text-text-secondary leading-relaxed text-sm sm:text-base whitespace-pre-wrap break-words overflow-hidden">
              {problem.problem_statement || problem.description}
            </div>
          </Card>
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
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          {sub.is_best_score && (
                            <Badge variant="green" className="shrink-0">Best</Badge>
                          )}
                          <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                            isValid   ? 'text-success bg-success/10' :
                            isInvalid ? 'text-error bg-error/10'     :
                                        'text-text-tertiary bg-bg-elevated'
                          }`}>
                            {isValid   ? <CheckCircle className="w-3 h-3" /> :
                             isInvalid ? <XCircle className="w-3 h-3" />     :
                                         <Loader className="w-3 h-3 animate-spin" />}
                            {sub.validation_status}
                          </span>
                          <span className="text-xs text-text-tertiary truncate max-w-[140px] sm:max-w-xs">
                            {sub.file_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          {sub.score !== null && (
                            <span className="font-mono font-bold text-primary-blue text-base">
                              {sub.score.toFixed(decimals)}
                            </span>
                          )}
                          <span className="text-xs text-text-tertiary whitespace-nowrap">
                            {new Date(sub.submitted_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
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

      {/* ── Sidebar — order-1 on mobile (above main), right col on lg ── */}
      <div className="space-y-4 sm:space-y-5 lg:sticky lg:top-24 self-start min-w-0 order-1 lg:order-2">

        {/* Submit CTA — most important action, always first in sidebar */}
        {!myBestScore && (
          <Card className="p-4 sm:p-5 bg-primary-blue/5 border-primary-blue/20">
            <h3 className="font-bold text-sm mb-1">Ready to practice?</h3>
            <p className="text-text-secondary text-xs mb-3 leading-relaxed">
              Submit your predictions and see where you rank on the leaderboard.
            </p>
            {isAuthenticated ? (
              <Link href={`/practice/${problem.id}/submit`} className="block">
                <Button variant="primary" size="sm" className="w-full gap-1.5">
                  <ArrowRight className="w-4 h-4" />
                  Submit Solution
                </Button>
              </Link>
            ) : (
              <Link href="/login" className="block">
                <Button variant="primary" size="sm" className="w-full">Log in to Submit</Button>
              </Link>
            )}
          </Card>
        )}

        {/* At a Glance */}
        <Card className="p-4 sm:p-5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary mb-4">
            At a Glance
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-bg-elevated rounded-xl border border-border-default">
              <p className="text-xs text-text-tertiary mb-1">Scoring Metric</p>
              <p className="font-semibold text-primary-blue text-sm">
                {metricInfo?.name ?? problem.scoring_metric}
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                {metricInfo?.higher_is_better ? 'Higher is better ↑' : 'Lower is better ↓'}
              </p>
              {(metricInfo as any)?.description && (
                <p className="text-xs text-text-tertiary mt-2 leading-relaxed">
                  {(metricInfo as any).description}
                </p>
              )}
            </div>
            <div className="p-3 bg-bg-elevated rounded-xl border border-border-default">
              <p className="text-xs text-text-tertiary mb-1">Submission Format</p>
              <p className="font-semibold text-sm flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-text-tertiary" />
                CSV File
              </p>
              <p className="text-xs text-text-tertiary mt-0.5">
                Max {problem.max_file_size_mb} MB · columns: id, label
              </p>
            </div>
          </div>
          <dl className="mt-3 space-y-2 text-sm border-t border-border-default pt-3">
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
          </dl>
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

        {/* Top participants preview — secondary info, last in sidebar */}
        <Card className="p-4 sm:p-5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-text-tertiary mb-4">
            Top Participants
          </h3>
          {leaderboard.length > 0 ? (
            <div className="space-y-2">
              {leaderboard.slice(0, 5).map((entry, index) => (
                <div
                  key={entry.userId}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${
                    index === 0 ? 'bg-warning/5 border-warning/20' : 'bg-bg-elevated border-border-default'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`font-bold text-sm shrink-0 ${
                      index === 0 ? 'text-warning' :
                      index === 1 ? 'text-text-secondary' :
                      index === 2 ? 'text-phase-registration' : 'text-text-tertiary'
                    }`}>
                      #{index + 1}
                    </span>
                    <span className="text-sm text-text-secondary truncate">
                      {entry.userName ?? 'Anonymous'}
                    </span>
                    {entry.userId === currentUserId && (
                      <span className="text-[10px] font-semibold text-primary-blue shrink-0">(you)</span>
                    )}
                  </div>
                  <span className="font-mono font-bold text-primary-blue text-sm shrink-0 ml-2">
                    {entry.score.toFixed(decimals)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-text-disabled opacity-40" />
              <p className="text-sm text-text-tertiary">No submissions yet</p>
            </div>
          )}
        </Card>

        {/* Submit CTA — repeated at bottom of sidebar for returning users */}
        {myBestScore && (
          <Card className="p-4 sm:p-5 bg-primary-blue/5 border-primary-blue/20">
            <Link href={`/practice/${problem.id}/submit`} className="block">
              <Button variant="primary" size="sm" className="w-full gap-1.5">
                <ArrowRight className="w-4 h-4" />
                Submit Again
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
