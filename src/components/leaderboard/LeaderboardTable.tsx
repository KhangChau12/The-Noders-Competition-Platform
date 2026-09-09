'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils/cn';

export interface LeaderboardEntry {
  rank: number;
  userId?: string;
  teamId?: string;
  userName?: string;
  teamName?: string;
  /** The single score (standard variant). */
  score?: number;
  /** Final variant — public / private / average scores. */
  publicScore?: number | null;
  privateScore?: number | null;
  averageScore?: number | null;
  totalSubmissions: number;
  lastSubmissionAt?: string;
  isCurrentUser?: boolean;
}

interface LeaderboardTableProps {
  data: LeaderboardEntry[];
  currentUserId?: string;
  loading?: boolean;
  className?: string;
  /** 'standard' → one score column; 'final' → public / private / average. */
  variant?: 'standard' | 'final';
  /** Show a "Team" column after the name (individual leaderboard of a team competition). */
  showTeam?: boolean;
  /** Header for the score column, e.g. "F1 Score ↑". */
  metricLabel?: string;
  /** Decimal places for score formatting. */
  decimals?: number;
  /** Lower score is better → sort ascending by default. */
  scoreAscending?: boolean;
  /** Column shown between name and score; defaults to true. */
  showSubmissions?: boolean;
  /** "When" column; defaults to true for standard, false for final. */
  showWhen?: boolean;
  emptyMessage?: string;
}

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
const RANK_TONE: Record<number, string> = {
  1: 'text-[#FBBF24]',
  2: 'text-text-secondary',
  3: 'text-[#A78BFA]',
};

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

type SortKey = 'rank' | 'score' | 'totalSubmissions';

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  data,
  currentUserId,
  loading = false,
  className = '',
  variant = 'standard',
  showTeam = false,
  metricLabel = 'Score',
  decimals = 4,
  scoreAscending = false,
  showSubmissions = true,
  showWhen,
  emptyMessage = 'No submissions yet. Be the first to submit!',
}) => {
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortAsc, setSortAsc] = useState(true);

  const whenVisible = showWhen ?? variant === 'standard';
  const isFinal = variant === 'final';

  const toggle = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(key === 'rank');
    }
  };

  const sortValue = (row: LeaderboardEntry, key: SortKey): number => {
    if (key === 'score') return (isFinal ? row.averageScore ?? row.publicScore : row.score) ?? 0;
    return (row[key] as number) ?? 0;
  };

  const sorted = [...data].sort((a, b) => {
    const av = sortValue(a, sortKey);
    const bv = sortValue(b, sortKey);
    if (sortKey === 'score') {
      // respect metric direction: dir applies to the "natural" (asc-toggle) order
      const better = scoreAscending ? av - bv : bv - av;
      return sortAsc ? better : -better;
    }
    return sortAsc ? av - bv : bv - av;
  });

  const fmt = (v?: number | null) =>
    v === null || v === undefined ? null : v.toFixed(decimals);

  const SortHead = ({ col, label, align = 'left', cls }: { col: SortKey; label: string; align?: 'left' | 'right' | 'center'; cls?: string }) => (
    <th
      className={cn(
        'px-3.5 py-[9px] text-xs font-semibold uppercase tracking-[0.07em] whitespace-nowrap',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        align === 'left' && 'text-left',
        cls
      )}
    >
      <button
        onClick={() => toggle(col)}
        className={cn(
          'select-none transition-colors',
          sortKey === col ? 'text-[#60A5FA]' : 'text-text-tertiary hover:text-text-secondary'
        )}
      >
        {label}
        {sortKey === col ? (sortAsc ? ' ▲' : ' ▼') : ''}
      </button>
    </th>
  );

  const PlainHead = ({ label, align = 'left', cls }: { label: string; align?: 'left' | 'right' | 'center'; cls?: string }) => (
    <th
      className={cn(
        'px-3.5 py-[9px] text-xs font-semibold uppercase tracking-[0.07em] text-text-tertiary whitespace-nowrap',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        align === 'left' && 'text-left',
        cls
      )}
    >
      {label}
    </th>
  );

  // On phones the standard variant drops Subs + When so the score stays in view.
  const secondaryCol = 'hidden sm:table-cell';

  if (loading) {
    return (
      <div className={cn('rounded-[10px] border border-border-default py-16 text-center text-text-tertiary text-sm', className)}>
        Loading leaderboard…
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn('rounded-[10px] border border-border-default py-16 text-center text-text-tertiary text-sm', className)}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn('rounded-[10px] border border-border-default overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-bg-elevated">
            <tr>
              <SortHead col="rank" label="Rank" />
              <PlainHead label={showTeam ? 'Member' : isFinal ? 'Team' : 'Participant'} />
              {showTeam && <PlainHead label="Team" />}
              {isFinal ? (
                <>
                  <PlainHead label="Public" align="center" />
                  <PlainHead label="Private" align="center" />
                  <SortHead col="score" label="Average" align="center" />
                </>
              ) : (
                <SortHead col="score" label={metricLabel} align="right" />
              )}
              {showSubmissions && (
                <SortHead
                  col="totalSubmissions"
                  label="Subs"
                  align="center"
                  cls={isFinal ? undefined : secondaryCol}
                />
              )}
              {whenVisible && (
                <PlainHead
                  label={isFinal ? 'When' : 'Submitted'}
                  align="right"
                  cls={isFinal ? undefined : secondaryCol}
                />
              )}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => {
              const name = row.userName || row.teamName || 'Anonymous';
              const isMe = row.isCurrentUser ?? (!!currentUserId && row.userId === currentUserId);
              const medal = MEDAL[row.rank];
              const rankTone = RANK_TONE[row.rank] ?? 'text-text-tertiary';

              return (
                <tr
                  key={row.userId || row.teamId || i}
                  className={cn(
                    'border-t border-border-default first:border-t-0 transition-colors',
                    isMe
                      ? 'bg-primary-blue/10 shadow-[inset_2px_0_0_var(--color-primary-blue)]'
                      : 'hover:bg-bg-elevated'
                  )}
                >
                  <td className="px-3.5 py-[11px]">
                    <span className={cn('font-mono font-bold', rankTone)}>
                      {medal ? `${medal} ${row.rank}` : row.rank}
                    </span>
                  </td>

                  <td className="px-3.5 py-[11px] whitespace-nowrap">
                    <span className="text-text-primary font-bold">{name}</span>
                    {isMe && (
                      <span className="font-mono text-[0.6875rem] text-[#60A5FA] ml-1.5">YOU</span>
                    )}
                  </td>

                  {showTeam && (
                    <td className="px-3.5 py-[11px] whitespace-nowrap">
                      <span className="font-mono text-xs text-text-tertiary">
                        {row.teamName || '—'}
                      </span>
                    </td>
                  )}

                  {isFinal ? (
                    <>
                      <td className="px-3.5 py-[11px] text-center">
                        {fmt(row.publicScore) ? (
                          <span className="font-mono font-bold text-[#60A5FA]">{fmt(row.publicScore)}</span>
                        ) : (
                          <span className="text-text-tertiary">—</span>
                        )}
                      </td>
                      <td className="px-3.5 py-[11px] text-center">
                        {fmt(row.privateScore) ? (
                          <span className="font-mono font-bold text-[#22D3EE]">{fmt(row.privateScore)}</span>
                        ) : (
                          <span className="text-text-tertiary">—</span>
                        )}
                      </td>
                      <td className="px-3.5 py-[11px] text-center">
                        {fmt(row.averageScore) ? (
                          <span className="font-mono font-bold text-[#FBBF24]">{fmt(row.averageScore)}</span>
                        ) : (
                          <span className="text-text-tertiary">—</span>
                        )}
                      </td>
                    </>
                  ) : (
                    <td className="px-3.5 py-[11px] text-right">
                      <span className="font-mono font-bold text-[#60A5FA]">
                        {typeof row.score === 'number' ? row.score.toFixed(decimals) : '—'}
                      </span>
                    </td>
                  )}

                  {showSubmissions && (
                    <td className={cn('px-3.5 py-[11px] text-center', !isFinal && secondaryCol)}>
                      <span className="font-mono text-xs text-text-tertiary">{row.totalSubmissions}</span>
                    </td>
                  )}

                  {whenVisible && (
                    <td className={cn('px-3.5 py-[11px] text-right', !isFinal && secondaryCol)}>
                      <span className="font-mono text-xs text-text-tertiary whitespace-nowrap">
                        {timeAgo(row.lastSubmissionAt)}
                      </span>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaderboardTable;
