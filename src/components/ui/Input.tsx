import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    const baseStyles = 'w-full px-4 py-3 bg-bg-surface border rounded-lg transition-all duration-200 focus:outline-none focus:border-transparent focus:ring-2 focus:ring-primary-blue text-text-primary placeholder:text-text-disabled hover:border-border-subtle';

    const errorStyles = error ? 'border-error focus:border-transparent focus:ring-error' : 'border-border-default';

    return (
      <div className="w-full">
        <input
          ref={ref}
          className={cn(baseStyles, errorStyles, className)}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-error">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
