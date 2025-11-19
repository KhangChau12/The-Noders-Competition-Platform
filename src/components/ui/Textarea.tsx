import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold mb-2 text-text-primary">
            {label}
            {props.required && <span className="text-error ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            w-full px-4 py-3 rounded-lg
            bg-bg-surface border border-border-default
            text-text-primary placeholder:text-text-disabled
            focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-transparent
            hover:border-border-focus
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            resize-y min-h-[100px]
            ${error ? 'border-error focus:ring-error' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-error">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm text-text-tertiary">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
