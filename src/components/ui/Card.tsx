import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const baseStyles = 'bg-bg-surface border border-border-default rounded-xl transition-all duration-300';

    const variants = {
      default: 'hover:border-primary-blue hover:-translate-y-1 hover:shadow-lg hover:shadow-primary-blue/10',
      elevated: 'bg-bg-elevated shadow-xl hover:-translate-y-1 hover:shadow-2xl',
    };

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variants[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
