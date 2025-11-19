import React from 'react';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              ref={ref}
              type="checkbox"
              className={`
                w-5 h-5 rounded border-2 border-border-default
                bg-bg-surface
                text-primary-blue
                focus:ring-2 focus:ring-border-focus focus:ring-offset-0
                hover:border-border-focus
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                cursor-pointer
                ${error ? 'border-error focus:ring-error' : ''}
                ${className}
              `}
              {...props}
            />
          </div>
          {label && (
            <div className="ml-3">
              <label
                htmlFor={props.id}
                className="text-sm font-medium text-text-primary cursor-pointer"
              >
                {label}
                {props.required && <span className="text-error ml-1">*</span>}
              </label>
              {helperText && !error && (
                <p className="text-xs text-text-tertiary mt-1">{helperText}</p>
              )}
              {error && (
                <p className="text-xs text-error mt-1">{error}</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
