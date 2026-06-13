'use client';

import React, { useState } from 'react';
import { Badge } from '../ui/Badge';

interface LeaderboardEntry {
  rank: number;
  userId?: string;
  teamId?: string;
  userName?: string;
  teamName?: string;
  score: number;
  totalSubmissions: number;
  lastSubmissionAt: string;
  isCurrentUser?: boolean;
}

interface LeaderboardTableProps {
  data: LeaderboardEntry[];
  currentUserId?: string;
  loading?: boolean;
  className?: string;
}

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
const RANK_COLOR: Record<number, string> = {
  1: 'text-yellow-400',
  2: 'text-slate-400',
  3: 'text-orange-400',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  data,
  currentUserId,
  loading = false,
  className = '',
}) => {
  const [sortKey, setSortKey] = useState<'rank' | 'score' | 'totalSubmissions'>('rank');
  const [sortAsc, setSortAsc] = useState(true);

  const toggle = (key: typeof sortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const sorted = [...data].sort((a, b) => {
    const av = a[sortKey] as number;
    const bv = b[sortKey] as number;
    return sortAsc ? av - bv : bv - av;
  });

  const SortBtn = ({ col, label }: { col: typeof sortKey; label: string }) => (
    <button
      onClick={() => toggle(col)}
      className={`whitespace-nowrap select-none text-xs font-semibold uppercase tracking-wide transition-colors ${
        sortKey === col ? 'text-primary-blue' : 'text-text-tertiary hover:text-text-secondary'
      }`}
    >
      {label}{sortKey === col ? (sortAsc ? ' ▲' : ' ▼') : ''}
    </button>
  );

  if (loading) {
    return <div className="py-16 text-center text-text-tertiary text-sm">Loading…</div>;
  }

  if (data.length === 0) {
    return (
      <div className="py-16 text-center text-text-tertiary text-sm">
        No submissions yet. Be the first to submit!
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto rounded-xl border border-border-default ${className}`}>
      <table className="w-full border-collapse min-w-0">
        <thead className="bg-bg-elevated border-b border-border-default">
          <tr>
            <th className="px-3 py-3 text-left w-12">
              <SortBtn col="rank" label="Rank" />
            </th>
            <th className="px-3 py-3 text-left">
              <span className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                Participant
              </span>
            </th>
            <th className="px-3 py-3 text-right">
              <SortBtn col="score" label="Score" />
            </th>
            {/* Submissions column hidden on xs */}
            <th className="hidden sm:table-cell px-3 py-3 text-center">
              <SortBtn col="totalSubmissions" label="Subs" />
            </th>
            <th className="hidden sm:table-cell px-3 py-3 text-right">
              <span className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                When
              </span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-default">
          {sorted.map((row, i) => {
            const name = row.userName || row.teamName || 'Anonymous';
            const isMe = row.isCurrentUser;
            const medal = MEDAL[row.rank];
            const rankColor = RANK_COLOR[row.rank] || 'text-text-tertiary';

            return (
              <tr
                key={row.userId || row.teamId || i}
                className={`transition-colors ${
                  isMe
                    ? 'bg-primary-blue/10 border-l-2 border-l-primary-blue'
                    : row.rank <= 3
                    ? 'bg-warning/[0.04]'
                    : 'hover:bg-bg-elevated'
                }`}
              >
                {/* Rank */}
                <td className="px-3 py-3 text-center w-12">
                  {medal ? (
                    <span className="text-lg leading-none">{medal}</span>
                  ) : (
                    <span className={`font-bold text-sm font-mono ${rankColor}`}>#{row.rank}</span>
                  )}
                </td>

                {/* Name */}
                <td className="px-3 py-3 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 shrink-0 rounded-full bg-primary-blue/20 flex items-center justify-center text-xs font-bold text-primary-blue">
                      {name[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-text-primary truncate max-w-[120px] sm:max-w-[200px]">
                        {name}
                      </p>
                      {isMe && (
                        <Badge variant="blue" className="text-[10px] px-1.5 py-0">You</Badge>
                      )}
                    </div>
                  </div>
                </td>

                {/* Score */}
                <td className="px-3 py-3 text-right">
                  <span className="font-mono font-bold text-primary-blue text-sm">
                    {typeof row.score === 'number' ? row.score.toFixed(4) : '—'}
                  </span>
                </td>

                {/* Submissions (sm+) */}
                <td className="hidden sm:table-cell px-3 py-3 text-center">
                  <span className="text-xs text-text-tertiary font-mono">{row.totalSubmissions}</span>
                </td>

                {/* Time (sm+) */}
                <td className="hidden sm:table-cell px-3 py-3 text-right">
                  <span className="text-xs text-text-tertiary">{timeAgo(row.lastSubmissionAt)}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default LeaderboardTable;
