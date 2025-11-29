'use client';

import { Card } from '@/components/ui/Card';
import { Clock, Users, Target, Lock, Calendar } from 'lucide-react';

interface CompetitionTimelineProps {
  competition: any;
}

export default function CompetitionTimeline({ competition }: CompetitionTimelineProps) {
  return (
    <Card className="p-8 bg-gradient-to-br from-bg-surface via-bg-elevated to-bg-surface">
      <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
        <Clock className="w-7 h-7 text-primary-blue" />
        Competition Timeline
      </h3>
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-blue via-accent-cyan to-primary-purple" />

        <div className="space-y-8">
          <TimelineItem
            label="Registration Period"
            start={competition.registration_start}
            end={competition.registration_end}
            color="blue"
            icon="users"
          />
          <TimelineItem
            label="Public Test Phase"
            start={competition.public_test_start}
            end={competition.public_test_end}
            color="cyan"
            icon="test"
          />
          {competition.competition_type === '4-phase' && competition.private_test_start && (
            <TimelineItem
              label="Private Test Phase"
              start={competition.private_test_start}
              end={competition.private_test_end}
              color="purple"
              icon="lock"
            />
          )}
        </div>
      </div>
    </Card>
  );
}

// Timeline Item Component
function TimelineItem({
  label,
  start,
  end,
  color = 'blue',
  icon = 'calendar'
}: {
  label: string;
  start: string;
  end: string;
  color?: 'blue' | 'cyan' | 'purple';
  icon?: 'users' | 'test' | 'lock' | 'calendar';
}) {
  const colorClasses = {
    blue: {
      bg: 'bg-primary-blue',
      border: 'border-primary-blue',
      text: 'text-primary-blue',
      gradient: 'from-primary-blue/20 to-primary-blue/5'
    },
    cyan: {
      bg: 'bg-accent-cyan',
      border: 'border-accent-cyan',
      text: 'text-accent-cyan',
      gradient: 'from-accent-cyan/20 to-accent-cyan/5'
    },
    purple: {
      bg: 'bg-primary-purple',
      border: 'border-primary-purple',
      text: 'text-primary-purple',
      gradient: 'from-primary-purple/20 to-primary-purple/5'
    }
  };

  const IconComponent = {
    users: Users,
    test: Target,
    lock: Lock,
    calendar: Calendar
  }[icon];

  const colors = colorClasses[color];

  return (
    <div className="relative flex items-start gap-4 pl-2">
      {/* Timeline dot */}
      <div className="relative z-10 flex-shrink-0">
        <div className={`w-12 h-12 rounded-full ${colors.bg} flex items-center justify-center shadow-lg`}>
          <IconComponent className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Content card */}
      <div className={`flex-1 p-5 bg-gradient-to-br ${colors.gradient} rounded-xl border-2 ${colors.border}/30 hover:${colors.border}/60 transition-all`}>
        <h4 className={`text-lg font-bold ${colors.text} mb-2`}>{label}</h4>
        <div className="flex items-center gap-2 text-text-secondary">
          <Calendar className="w-4 h-4" />
          <span className="font-mono text-sm">
            {new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="text-text-tertiary">→</span>
          <span className="font-mono text-sm">
            {new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
        <div className="mt-2 text-xs text-text-tertiary">
          Duration: {Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24))} days
        </div>
      </div>
    </div>
  );
}
