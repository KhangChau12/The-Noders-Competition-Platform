import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

/** Shared field look: 48px tall, dark well, blue focus ring. */
export const FIELD_CLASS =
  'w-full min-h-[48px] rounded-lg border bg-bg-primary px-3.5 text-base text-text-primary transition-colors placeholder:text-text-disabled focus:outline-none focus:border-blue disabled:cursor-not-allowed disabled:opacity-50';

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, error, ...props }, ref) => {
  return (
    <div className="w-full">
      <input
        ref={ref}
        className={cn(FIELD_CLASS, error ? 'border-error' : 'border-border-subtle', className)}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-error">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
