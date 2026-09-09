import { cn } from '@/lib/utils/cn';
import {
  getCompetitionPhase,
  getCountdown,
  type CompetitionPhase,
} from '@/lib/utils/competition';

interface PhaseTimelineProps {
  competition: {
    competition_type: '3-phase' | '4-phase';
    registration_start: string;
    registration_end: string;
    public_test_start: string;
    public_test_end: string;
    private_test_start: string | null;
    private_test_end: string | null;
  };
  now?: Date;
  /** Card variant: hide the date-mark row, keep only the rail + "closes in" line. */
  compact?: boolean;
  className?: string;
}

type SegState = 'done' | 'active' | 'upcoming';

interface Seg {
  id: string;
  label: string;
  shortLabel: string;
  start: number;
  end: number;
  state: SegState;
  progress: number; // 0–100, only meaningful when active
  phase: 'registration' | 'public' | 'private';
}

const fmt = (t: number) =>
  new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

function buildSegments(c: PhaseTimelineProps['competition'], now: number): Seg[] {
  const segs: { id: Seg['id']; label: string; shortLabel: string; start: number; end: number; phase: Seg['phase'] }[] = [
    {
      id: 'registration',
      label: 'Registration',
      shortLabel: 'Reg',
      start: new Date(c.registration_start).getTime(),
      end: new Date(c.registration_end).getTime(),
      phase: 'registration',
    },
    {
      id: 'public',
      label: 'Public test',
      shortLabel: 'Public',
      start: new Date(c.public_test_start).getTime(),
      end: new Date(c.public_test_end).getTime(),
      phase: 'public',
    },
  ];

  if (c.competition_type === '4-phase' && c.private_test_start && c.private_test_end) {
    segs.push({
      id: 'private',
      label: 'Private test',
      shortLabel: 'Priv',
      start: new Date(c.private_test_start).getTime(),
      end: new Date(c.private_test_end).getTime(),
      phase: 'private',
    });
  }

  return segs.map((s) => {
    let state: SegState;
    let progress = 0;
    if (now >= s.end) state = 'done';
    else if (now < s.start) state = 'upcoming';
    else {
      state = 'active';
      progress = s.end > s.start ? ((now - s.start) / (s.end - s.start)) * 100 : 0;
    }
    return { ...s, state, progress: Math.min(100, Math.max(0, progress)) };
  });
}

const PHASE_COLOR: Record<Seg['phase'], string> = {
  registration: '#A78BFA',
  public: '#2563EB',
  private: '#22D3EE',
};

/**
 * Segmented phase rail + date marks + a "<phase> closes in <t>" line.
 * Not a card — renders on bare background. Replaces HorizontalTimeline.
 */
export default function PhaseTimeline({
  competition,
  now = new Date(),
  compact = false,
  className,
}: PhaseTimelineProps) {
  const nowMs = now.getTime();
  const segments = buildSegments(competition, nowMs);
  const phase = getCompetitionPhase(competition, now);
  const countdown = getCountdown(competition, phase, now);

  const railStyle = (seg: Seg): React.CSSProperties => {
    if (seg.state === 'done') {
      return seg.phase === 'registration'
        ? { background: 'rgba(167,139,250,0.4)' }
        : { background: 'var(--color-phase-ended)' };
    }
    if (seg.state === 'upcoming') return { background: 'var(--color-bg-elevated)' };
    const c = PHASE_COLOR[seg.phase];
    return {
      background: `linear-gradient(90deg, ${c} ${seg.progress}%, var(--color-bg-elevated) ${seg.progress}%)`,
    };
  };

  const activeLabel = countdownLabelFor(phase);

  return (
    <div className={className}>
      <div className="flex gap-[3px] h-1 rounded-full overflow-hidden">
        {segments.map((seg) => (
          <div key={seg.id} className="flex-1 rounded-[2px]" style={railStyle(seg)} />
        ))}
      </div>

      {!compact && (
        <div className="flex mt-[9px]">
          {segments.map((seg) => (
            <div key={seg.id} className="flex-1 min-w-0 pr-2">
              <span
                className={cn(
                  'block text-[0.6875rem] font-semibold uppercase tracking-[0.07em] mb-0.5',
                  seg.state === 'active' ? 'text-[#60A5FA]' : 'text-text-tertiary'
                )}
              >
                <span className="sm:hidden">{seg.shortLabel}</span>
                <span className="hidden sm:inline">{seg.label}</span>
              </span>
              <span
                className={cn(
                  'font-mono text-[0.6875rem]',
                  seg.state === 'active' ? 'text-[#60A5FA]' : 'text-text-disabled'
                )}
              >
                {fmt(seg.start)} – {fmt(seg.end)}
              </span>
            </div>
          ))}
        </div>
      )}

      {countdown && activeLabel && (
        <p className="mt-[11px] text-sm text-text-tertiary">
          {activeLabel}{' '}
          <span className="font-mono font-bold text-[#60A5FA]">
            {countdown.days > 0 && `${countdown.days}d `}
            {countdown.hours}h
            {countdown.days === 0 && ` ${countdown.minutes}m`}
          </span>
        </p>
      )}
    </div>
  );
}

function countdownLabelFor(phase: CompetitionPhase): string | null {
  switch (phase) {
    case 'upcoming':
      return 'Registration opens in';
    case 'registration':
      return 'Registration closes in';
    case 'public_test':
      return 'Public test closes in';
    case 'private_test':
      return 'Private test closes in';
    default:
      return null;
  }
}
