'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import Card from '../ui/Card';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalCompetitions: number;
    activeCompetitions: number;
    totalSubmissions: number;
  };
  userGrowth: Array<{ month: string; users: number }>;
  submissionsByCompetition: Array<{ name: string; submissions: number }>;
  competitionPhases: Array<{ phase: string; count: number; color: string }>;
}

interface AnalyticsDashboardProps {
  data: AnalyticsData;
  loading?: boolean;
  className?: string;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  data,
  loading = false,
  className = '',
}) => {
  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-32 bg-bg-surface border border-border-default rounded-lg animate-pulse"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="h-80 bg-bg-surface border border-border-default rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const { overview, userGrowth, submissionsByCompetition, competitionPhases } = data;

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg-surface border border-border-default rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold text-text-primary mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-primary-blue/10 to-accent-cyan/10 border-primary-blue/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-tertiary mb-1">Total Users</p>
              <p className="text-3xl font-bold font-mono text-primary-blue">
                {overview.totalUsers.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary-blue/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-blue" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-accent-cyan/10 to-primary-blue/10 border-accent-cyan/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-tertiary mb-1">Total Competitions</p>
              <p className="text-3xl font-bold font-mono text-accent-cyan">
                {overview.totalCompetitions}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-accent-cyan/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-accent-cyan" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path
                  fillRule="evenodd"
                  d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-tertiary mb-1">Active Competitions</p>
              <p className="text-3xl font-bold font-mono text-success">
                {overview.activeCompetitions}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-success" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-tertiary mb-1">Total Submissions</p>
              <p className="text-3xl font-bold font-mono text-warning">
                {overview.totalSubmissions.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-warning" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card>
          <h3 className="text-lg font-semibold text-text-primary mb-4">User Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis
                dataKey="month"
                stroke="#94A3B8"
                tick={{ fill: '#94A3B8', fontSize: 12 }}
              />
              <YAxis stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#2563EB"
                strokeWidth={2}
                dot={{ fill: '#2563EB', r: 4 }}
                activeDot={{ r: 6 }}
                name="Users"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Competition Phases Pie Chart */}
        <Card>
          <h3 className="text-lg font-semibold text-text-primary mb-4">Competition Phases</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={competitionPhases}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {competitionPhases.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Submissions by Competition Bar Chart */}
      <Card>
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Submissions by Competition
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={submissionsByCompetition}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis
              dataKey="name"
              stroke="#94A3B8"
              tick={{ fill: '#94A3B8', fontSize: 12 }}
            />
            <YAxis stroke="#94A3B8" tick={{ fill: '#94A3B8', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="submissions" fill="#2563EB" radius={[8, 8, 0, 0]} name="Submissions" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;
