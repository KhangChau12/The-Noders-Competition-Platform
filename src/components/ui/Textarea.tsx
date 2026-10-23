import React from 'react';
import { cn } from '@/lib/utils/cn';
import { FIELD_CLASS } from './Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-text-primary">
            {label}
            {props.required && <span className="ml-1 text-error">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(FIELD_CLASS, 'min-h-[100px] resize-y py-3', error ? 'border-error' : 'border-border-subtle', className)}
          aria-invalid={error ? true : undefined}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-error">{error}</p>}
        {helperText && !error && <p className="mt-1.5 text-sm text-text-muted">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
