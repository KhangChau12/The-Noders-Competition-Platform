'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface ScoreDataPoint {
  submissionNumber: number;
  score: number;
  timestamp: string;
}

interface ScoreChartProps {
  data: ScoreDataPoint[];
  title?: string;
  className?: string;
}

const ScoreChart: React.FC<ScoreChartProps> = ({
  data,
  title = 'Score History',
  className = '',
}) => {
  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-bg-surface border border-border-default rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold text-text-primary mb-1">
            Submission #{data.submissionNumber}
          </p>
          <p className="text-lg font-bold font-mono text-primary-blue mb-1">
            {data.score.toFixed(6)}
          </p>
          <p className="text-xs text-text-tertiary">
            {new Date(data.timestamp).toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className={`bg-bg-surface border border-border-default rounded-lg p-8 ${className}`}>
        <h3 className="text-lg font-semibold text-text-primary mb-4">{title}</h3>
        <div className="text-center py-12">
          <div className="text-5xl mb-4">📊</div>
          <p className="text-text-secondary">
            No submission data available yet. Submit your first solution to see your progress!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-bg-surface border border-border-default rounded-lg p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-1">{title}</h3>
        <p className="text-sm text-text-tertiary">
          Track your score improvement over {data.length} submissions
        </p>
      </div>

      <div className="w-full" style={{ height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />

            <XAxis
              dataKey="submissionNumber"
              stroke="#94A3B8"
              tick={{ fill: '#94A3B8', fontSize: 12 }}
              tickLine={{ stroke: '#334155' }}
              label={{
                value: 'Submission Number',
                position: 'insideBottom',
                offset: -5,
                style: { fill: '#94A3B8', fontSize: 12 },
              }}
            />

            <YAxis
              stroke="#94A3B8"
              tick={{ fill: '#94A3B8', fontSize: 12 }}
              tickLine={{ stroke: '#334155' }}
              domain={['dataMin - 0.01', 'dataMax + 0.01']}
              tickFormatter={(value) => value.toFixed(3)}
              label={{
                value: 'Score',
                angle: -90,
                position: 'insideLeft',
                style: { fill: '#94A3B8', fontSize: 12 },
              }}
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
              formatter={() => 'Score'}
            />

            <Area
              type="monotone"
              dataKey="score"
              stroke="#2563EB"
              strokeWidth={2}
              fill="url(#scoreGradient)"
              activeDot={{ r: 6, fill: '#2563EB' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Summary */}
      <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t border-border-default">
        <div className="text-center">
          <p className="text-sm text-text-tertiary mb-1">Best Score</p>
          <p className="text-xl font-bold font-mono text-primary-blue">
            {Math.max(...data.map((d) => d.score)).toFixed(6)}
          </p>
        </div>
        <div className="text-center border-x border-border-default">
          <p className="text-sm text-text-tertiary mb-1">Latest Score</p>
          <p className="text-xl font-bold font-mono text-text-primary">
            {data[data.length - 1].score.toFixed(6)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-text-tertiary mb-1">Improvement</p>
          <p
            className={`text-xl font-bold font-mono ${
              data[data.length - 1].score > data[0].score
                ? 'text-success'
                : data[data.length - 1].score < data[0].score
                ? 'text-error'
                : 'text-text-tertiary'
            }`}
          >
            {data[data.length - 1].score > data[0].score ? '+' : ''}
            {((data[data.length - 1].score - data[0].score) * 100).toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default ScoreChart;
