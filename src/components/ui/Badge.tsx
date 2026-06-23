import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

type BadgeVariant =
  | 'default' | 'primary' | 'secondary'
  | 'success' | 'warning' | 'error' | 'danger'
  | 'blue' | 'purple' | 'green' | 'red' | 'yellow' | 'cyan' | 'gray'
  | 'outline' | 'tech'
  | 'registration' | 'public' | 'private' | 'ended';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

// Unified Badge — superset of both products' variants, identical styling to the
// Community site's Badge. Default style is NOT uppercase/mono (only `tech` is)
// so status/phase labels read naturally.
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'blue', size = 'sm', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2';

    const variants: Record<BadgeVariant, string> = {
      default: 'bg-bg-elevated text-text-primary',
      primary: 'bg-primary-blue text-white',
      secondary: 'bg-bg-elevated/50 text-text-secondary border border-border-default',
      success: 'bg-success/20 text-success border border-success/30',
      warning: 'bg-warning/20 text-warning border border-warning/30',
      error: 'bg-error/20 text-error border border-error/30',
      danger: 'bg-error/20 text-error border border-error/30',
      blue: 'bg-phase-public/20 text-phase-public border border-phase-public/30',
      purple: 'bg-phase-registration/20 text-phase-registration border border-phase-registration/30',
      green: 'bg-success/20 text-success border border-success/30',
      red: 'bg-error/20 text-error border border-error/30',
      yellow: 'bg-warning/20 text-warning border border-warning/30',
      cyan: 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30',
      gray: 'bg-phase-ended/20 text-text-tertiary border border-phase-ended/30',
      outline: 'bg-transparent border border-border-default text-text-secondary',
      tech: 'bg-primary-blue/15 text-accent-cyan font-mono uppercase tracking-wide border border-primary-blue/30',
      registration: 'bg-phase-registration/20 text-[#A78BFA] border border-phase-registration/30',
      public: 'bg-phase-public/20 text-[#60A5FA] border border-phase-public/30',
      private: 'bg-accent-cyan/20 text-[#22D3EE] border border-accent-cyan/30',
      ended: 'bg-phase-ended/20 text-text-tertiary border border-phase-ended/30',
    };

    const sizes = {
      sm: 'px-2.5 py-0.5 text-xs rounded-full',
      md: 'px-3 py-1 text-sm rounded-full',
    };

    return (
      <span
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
