import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export type CardTone = 'surface' | 'neutral' | 'violet' | 'blue' | 'amber' | 'teal';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Kept for legacy callers; all variants share one flat style now. */
  variant?: 'default' | 'hover' | 'interactive' | 'elevated';
  padding?: 'sm' | 'md' | 'lg' | 'none';
  /** Tinted ground. `surface` is the plain dark card. */
  tone?: CardTone;
}

export const CARD_TONE: Record<CardTone, string> = {
  surface: 'bg-bg-surface',
  neutral: 'bg-bg-elevated',
  violet: 'bg-violet-bg',
  blue: 'bg-blue-bg',
  amber: 'bg-amber-bg',
  teal: 'bg-teal-bg',
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'none', tone = 'surface', children, ...props }, ref) => {
    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-5 sm:p-6',
      lg: 'p-6 sm:p-8',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl',
          CARD_TONE[tone],
          variant === 'interactive' && 'lift cursor-pointer',
          paddings[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4 flex flex-col gap-1', className)} {...props} />;
}

function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-lg font-bold leading-snug text-text-primary', className)} {...props} />;
}

function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-text-tertiary', className)} {...props} />;
}

function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(className)} {...props} />;
}

function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center pt-5', className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
