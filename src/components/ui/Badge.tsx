import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'blue' | 'purple' | 'green' | 'red' | 'yellow' | 'cyan' | 'gray' | 'outline' | 'registration' | 'public' | 'private' | 'ended' | 'tech' | 'secondary' | 'success' | 'danger';
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'blue', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-mono uppercase tracking-wide';

    const variants = {
      blue: 'bg-phase-public/20 text-phase-public border border-phase-public/30',
      purple: 'bg-phase-registration/20 text-phase-registration border border-phase-registration/30',
      green: 'bg-success/20 text-success border border-success/30',
      red: 'bg-error/20 text-error border border-error/30',
      yellow: 'bg-warning/20 text-warning border border-warning/30',
      cyan: 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30',
      gray: 'bg-phase-ended/20 text-text-tertiary border border-phase-ended/30',
      outline: 'bg-transparent border border-border-default text-text-secondary',
      // Competition phase variants
      registration: 'bg-phase-registration/20 text-[#A78BFA] border border-phase-registration/30',
      public: 'bg-phase-public/20 text-[#60A5FA] border border-phase-public/30',
      private: 'bg-accent-cyan/20 text-[#22D3EE] border border-accent-cyan/30',
      ended: 'bg-phase-ended/20 text-text-tertiary border border-phase-ended/30',
      // Other variants
      tech: 'bg-primary-blue/15 text-accent-cyan border border-primary-blue/30',
      secondary: 'bg-bg-elevated/50 text-text-secondary border border-border-default',
      success: 'bg-success/20 text-success border border-success/30',
      danger: 'bg-error/20 text-error border border-error/30',
    };

    return (
      <span
        ref={ref}
        className={cn(baseStyles, variants[variant], className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
