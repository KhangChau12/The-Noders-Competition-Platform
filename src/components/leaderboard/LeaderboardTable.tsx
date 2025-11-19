'use client';

import React from 'react';
import Table, { TableColumn } from '../ui/Table';
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

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  data,
  currentUserId,
  loading = false,
  className = '',
}) => {
  const columns: TableColumn<LeaderboardEntry>[] = [
    {
      key: 'rank',
      header: 'Rank',
      sortable: true,
      align: 'center',
      render: (value, row) => {
        const rankClasses = {
          1: 'text-yellow-400',
          2: 'text-gray-400',
          3: 'text-orange-400',
        };

        return (
          <div className="flex items-center justify-center gap-2">
            <span
              className={`text-xl font-bold font-mono ${
                rankClasses[row.rank as keyof typeof rankClasses] || 'text-text-primary'
              }`}
            >
              {row.rank <= 3 ? (
                <>
                  {row.rank === 1 && '🥇'}
                  {row.rank === 2 && '🥈'}
                  {row.rank === 3 && '🥉'}
                </>
              ) : (
                `#${row.rank}`
              )}
            </span>
          </div>
        );
      },
    },
    {
      key: 'participant',
      header: 'Participant',
      sortable: true,
      render: (_, row) => {
        const name = row.userName || row.teamName || 'Anonymous';
        const isTeam = !!row.teamId;

        return (
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                isTeam ? 'bg-accent-cyan/20 text-accent-cyan' : 'bg-primary-blue/20 text-primary-blue'
              }`}
            >
              {isTeam ? '👥' : name[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-text-primary">{name}</p>
              {row.isCurrentUser && (
                <Badge variant="blue" className="text-xs mt-1">
                  You
                </Badge>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'score',
      header: 'Best Score',
      sortable: true,
      align: 'center',
      render: (value) => (
        <span className="text-lg font-bold font-mono text-primary-blue">
          {typeof value === 'number' ? value.toFixed(6) : '-'}
        </span>
      ),
    },
    {
      key: 'totalSubmissions',
      header: 'Submissions',
      sortable: true,
      align: 'center',
      render: (value) => (
        <span className="font-mono text-text-primary">{value}</span>
      ),
    },
    {
      key: 'lastSubmissionAt',
      header: 'Last Submission',
      sortable: true,
      render: (value) => {
        if (!value) return <span className="text-text-tertiary">-</span>;

        const date = new Date(value);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        let timeAgo = '';
        if (diffInHours < 1) {
          const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
          timeAgo = `${diffInMinutes}m ago`;
        } else if (diffInHours < 24) {
          timeAgo = `${diffInHours}h ago`;
        } else {
          const diffInDays = Math.floor(diffInHours / 24);
          timeAgo = `${diffInDays}d ago`;
        }

        return (
          <div className="text-sm">
            <p className="text-text-secondary">{timeAgo}</p>
            <p className="text-xs text-text-tertiary">
              {date.toLocaleDateString()}
            </p>
          </div>
        );
      },
    },
  ];

  return (
    <div className={className}>
      <Table
        columns={columns}
        data={data}
        keyExtractor={(row) => row.userId || row.teamId || row.rank.toString()}
        highlightRow={(row) => row.isCurrentUser || false}
        emptyMessage="No submissions yet. Be the first to submit!"
      />
    </div>
  );
};

export default LeaderboardTable;
