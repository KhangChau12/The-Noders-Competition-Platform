'use client';

import { Fragment, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Markdown } from '@/components/ui/Markdown';
import LeaderboardTable, { type LeaderboardEntry } from '@/components/leaderboard/LeaderboardTable';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { SCORING_METRIC_INFO, metricShortName } from '@/lib/constants';
import type { PracticeProblemRow, PracticeTag } from '@/types/database.types';

interface LeaderboardRow {
  rank: number;
  userId: string;
  userName: string | null;
  score: number;
  totalSubmissions: number;
  lastSubmissionAt: string;
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
  leaderboard: LeaderboardRow[];
  mySubmissions: MySubmission[];
  currentUserId: string | null;
  isAuthenticated: boolean;
  myBestScore: MySubmission | null;
  myRank: number | null;
  decimals: number;
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
  decimals,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>(
    leaderboard.length > 0 ? 'leaderboard' : 'overview'
  );
  const metricInfo = SCORING_METRIC_INFO[problem.scoring_metric as keyof typeof SCORING_METRIC_INFO];
  const higherIsBetter = metricInfo?.higher_is_better !== false;

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'leaderboard', label: 'Leaderboard', count: leaderboard.length },
    { id: 'my_submissions', label: 'My Submissions', count: mySubmissions.length || undefined },
  ];

  const rows: LeaderboardEntry[] = leaderboard.map((e) => ({
    rank: e.rank,
    userId: e.userId,
    userName: e.userName ?? undefined,
    score: e.score,
    totalSubmissions: e.totalSubmissions,
    lastSubmissionAt: e.lastSubmissionAt,
    isCurrentUser: e.userId === currentUserId,
  }));

  return (
    <div>
      {/* ── Action line ── */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 mb-6">
        {isAuthenticated ? (
          <Link href={`/practice/${problem.id}/submit`}>
            <Button variant="primary" size="sm" className="gap-2">
              {myBestScore ? 'Submit again' : 'Submit solution'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        ) : (
          <Link href="/login">
            <Button variant="primary" size="sm">
              Log in to submit
            </Button>
          </Link>
        )}

        {problem.dataset_url && (
          <a
            href={problem.dataset_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary"
          >
            <span className="text-[#60A5FA]">↓</span> Dataset
          </a>
        )}
        {problem.sample_submission_url && (
          <a
            href={problem.sample_submission_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary"
          >
            <span className="text-[#60A5FA]">↓</span> Sample submission
          </a>
        )}

        {myBestScore && (
          <>
            <span className="flex-1 hidden sm:block" />
            <span className="text-sm text-text-tertiary">
              best{' '}
              <span className="font-mono text-[#FBBF24]">
                {myBestScore.score?.toFixed(decimals)}
              </span>
              {myRank && (
                <>
                  {' · '}rank <span className="font-mono text-text-secondary">#{myRank}</span>
                </>
              )}
            </span>
          </>
        )}
      </div>

      {/* ── Tab nav ── */}
      <div className="flex gap-1 border-b border-border-default mb-5 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-[11px] text-sm font-bold whitespace-nowrap shrink-0 border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? 'border-primary-blue text-text-primary'
                : 'border-transparent text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="font-mono text-[0.6875rem] text-text-disabled ml-1.5">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {activeTab === 'overview' && (
        <div className="max-w-[72ch]">
          <h3 className="text-lg font-extrabold text-text-primary mb-3">Problem statement</h3>
          <Markdown>{problem.problem_statement || problem.description}</Markdown>

          <h3 className="text-lg font-extrabold text-text-primary mt-8 mb-2">Scoring &amp; limits</h3>
          <p className="text-sm text-text-secondary leading-[1.65] mb-1.5">
            <span className="text-text-primary font-bold">
              {metricInfo?.name ?? problem.scoring_metric}
            </span>{' '}
            — {higherIsBetter ? 'Higher is better ↑' : 'Lower is better ↓'}.
          </p>
          {(metricInfo as any)?.description && (
            <p className="text-sm text-text-tertiary leading-[1.65] mb-3">
              {(metricInfo as any).description}
            </p>
          )}
          <p className="text-sm text-text-secondary leading-[1.65]">
            Submit a <span className="font-mono text-[#22D3EE]">.csv</span> file, up to{' '}
            {problem.max_file_size_mb} MB, with columns{' '}
            <span className="font-mono text-[#22D3EE]">id, label</span>.{' '}
            {problem.daily_submission_limit} submissions per day
            {problem.total_submission_limit === 0
              ? ', no total cap.'
              : `, ${problem.total_submission_limit} total.`}
          </p>
        </div>
      )}

      {/* ── Leaderboard ── */}
      {activeTab === 'leaderboard' && (
        <LeaderboardTable
          data={rows}
          currentUserId={currentUserId ?? undefined}
          decimals={decimals}
          scoreAscending={!higherIsBetter}
          metricLabel={`${metricShortName(problem.scoring_metric)} ${higherIsBetter ? '↑' : '↓'}`}
          showSubmissions={false}
          emptyMessage="No submissions yet. Be the first to submit!"
        />
      )}

      {/* ── My Submissions ── */}
      {activeTab === 'my_submissions' && (
        <div>
          {!isAuthenticated ? (
            <div className="rounded-[10px] border border-border-default py-16 text-center">
              <p className="text-sm text-text-tertiary mb-4">Log in to see your submissions.</p>
              <Link href="/login">
                <Button variant="primary" size="sm">
                  Log in
                </Button>
              </Link>
            </div>
          ) : mySubmissions.length === 0 ? (
            <div className="rounded-[10px] border border-border-default py-16 text-center">
              <p className="text-sm text-text-tertiary mb-4">No submissions yet.</p>
              <Link href={`/practice/${problem.id}/submit`}>
                <Button variant="primary" size="sm">
                  Submit solution
                </Button>
              </Link>
            </div>
          ) : (
            <div className="rounded-[10px] border border-border-default overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-bg-elevated">
                    <tr>
                      {(
                        [
                          ['File', 'left'],
                          ['Status', 'left'],
                          ['Score', 'right'],
                          ['Submitted', 'right'],
                          ['Best', 'center'],
                        ] as const
                      ).map(([label, align]) => (
                        <th
                          key={label}
                          className={`px-3.5 py-[9px] text-xs font-semibold uppercase tracking-[0.07em] text-text-tertiary whitespace-nowrap ${
                            align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
                          }`}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mySubmissions.map((sub) => {
                      const status = sub.validation_status;
                      const hasErrors =
                        sub.validation_errors && sub.validation_errors.length > 0;
                      return (
                        <Fragment key={sub.id}>
                          <tr className="border-t border-border-default first:border-t-0 hover:bg-bg-elevated transition-colors">
                            <td className="px-3.5 py-[11px] max-w-[140px] sm:max-w-xs">
                              <span className="text-text-primary font-bold truncate block">
                                {sub.file_name}
                              </span>
                            </td>
                            <td className="px-3.5 py-[11px]">
                              <span
                                className={`font-bold ${
                                  status === 'valid'
                                    ? 'text-[#34D399]'
                                    : status === 'invalid'
                                      ? 'text-[#F87171]'
                                      : 'text-text-tertiary'
                                }`}
                              >
                                {status === 'valid'
                                  ? 'Valid'
                                  : status === 'invalid'
                                    ? 'Invalid'
                                    : 'Pending'}
                              </span>
                            </td>
                            <td className="px-3.5 py-[11px] text-right">
                              {sub.score !== null ? (
                                <span className="font-mono font-bold text-[#60A5FA]">
                                  {sub.score.toFixed(decimals)}
                                </span>
                              ) : (
                                <span className="text-text-tertiary">—</span>
                              )}
                            </td>
                            <td className="px-3.5 py-[11px] text-right">
                              <span className="font-mono text-xs text-text-tertiary whitespace-nowrap">
                                {new Date(sub.submitted_at).toLocaleDateString()}
                              </span>
                            </td>
                            <td className="px-3.5 py-[11px] text-center">
                              {sub.is_best_score && (
                                <span className="font-mono text-xs font-bold text-[#FBBF24]">BEST</span>
                              )}
                            </td>
                          </tr>
                          {hasErrors && (
                            <tr className="border-t border-border-default">
                              <td colSpan={5} className="px-3.5 py-2 bg-[#F87171]/10">
                                <span className="text-xs text-[#F87171] leading-relaxed">
                                  {Array.isArray(sub.validation_errors)
                                    ? sub.validation_errors.join(', ')
                                    : String(sub.validation_errors)}
                                </span>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
