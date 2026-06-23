import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'hover' | 'interactive' | 'elevated';
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

// Unified Card — variant set, hover behaviour and sub-components kept in sync
// with the Community site's Card. `padding` defaults to `none` here because
// existing Competition markup passes padding via className (e.g. `p-5 sm:p-6`).
const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'none', children, ...props }, ref) => {
    const baseStyles = 'bg-bg-surface border border-border-default rounded-xl transition-all duration-300';

    const variants = {
      default: 'hover:border-primary-blue hover:-translate-y-1',
      hover: 'hover:border-primary-blue hover:-translate-y-1',
      interactive: 'hover:border-primary-blue hover:-translate-y-1 hover:shadow-lg hover:shadow-primary-blue/10 cursor-pointer',
      elevated: 'bg-bg-elevated shadow-xl hover:-translate-y-1',
    };

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variants[variant], paddings[padding], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4 flex flex-col space-y-1.5', className)} {...props} />;
}

function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-lg font-semibold leading-none tracking-tight text-text-primary', className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-text-secondary', className)} {...props} />;
}

function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('pt-0', className)} {...props} />;
}

function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center pt-6', className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
