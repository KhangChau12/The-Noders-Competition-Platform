import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

type BadgeVariant =
  | 'default' | 'primary' | 'secondary'
  | 'success' | 'warning' | 'error' | 'danger'
  | 'blue' | 'purple' | 'green' | 'red' | 'yellow' | 'cyan' | 'gray'
  | 'outline' | 'tech'
  | 'registration' | 'public' | 'private' | 'ended'
  | 'violet' | 'amber' | 'teal';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  /** Show a coloured dot before the label (phase/status chips). */
  dot?: boolean;
}

const VIOLET = 'bg-violet-bg text-violet';
const BLUE = 'bg-blue-bg text-blue';
const AMBER = 'bg-amber-bg text-amber';
const TEAL = 'bg-teal-bg text-teal';
const GRAY = 'bg-bg-raised text-text-tertiary';

const VARIANTS: Record<BadgeVariant, string> = {
  default: GRAY,
  primary: BLUE,
  secondary: GRAY,
  success: TEAL,
  warning: AMBER,
  error: 'bg-[#2A1714] text-error',
  danger: 'bg-[#2A1714] text-error',
  blue: BLUE,
  purple: VIOLET,
  violet: VIOLET,
  green: TEAL,
  teal: TEAL,
  red: 'bg-[#2A1714] text-error',
  yellow: AMBER,
  amber: AMBER,
  cyan: TEAL,
  gray: GRAY,
  outline: 'border border-border-subtle text-text-tertiary',
  tech: 'bg-bg-raised text-text-secondary font-mono',
  registration: VIOLET,
  public: BLUE,
  private: AMBER,
  ended: GRAY,
};

// Small rounded-rectangle chip. Colour carries meaning (see tailwind.config.ts).
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'blue', size = 'sm', dot, children, ...props }, ref) => {
    const sizes = {
      sm: 'px-2.5 py-0.5 text-xs',
      md: 'px-3 py-1 text-[0.8125rem]',
    };

    return (
      <span
        ref={ref}
        className={cn('inline-flex items-center gap-1.5 rounded-md font-semibold', VARIANTS[variant], sizes[size], className)}
        {...props}
      >
        {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
