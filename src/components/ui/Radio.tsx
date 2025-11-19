import React from 'react';

interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  options,
  value,
  onChange,
  label,
  error,
  helperText,
  required,
  disabled,
  className = '',
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-semibold mb-3 text-text-primary">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <div className="space-y-3">
        {options.map((option) => (
          <div
            key={option.value}
            className={`
              flex items-start p-4 rounded-lg border-2 border-border-default
              bg-bg-surface
              hover:border-border-focus
              transition-all duration-200
              ${value === option.value ? 'border-primary-blue bg-primary-blue/5' : ''}
              ${option.disabled || disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            onClick={() => {
              if (!option.disabled && !disabled && onChange) {
                onChange(option.value);
              }
            }}
          >
            <div className="flex items-center h-5">
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={(e) => onChange && onChange(e.target.value)}
                disabled={option.disabled || disabled}
                className={`
                  w-5 h-5 border-2 border-border-default
                  bg-bg-surface
                  text-primary-blue
                  focus:ring-2 focus:ring-border-focus focus:ring-offset-0
                  transition-all duration-200
                  cursor-pointer
                  disabled:cursor-not-allowed
                `}
              />
            </div>
            <div className="ml-3 flex-1">
              <label
                className="text-sm font-medium text-text-primary cursor-pointer"
              >
                {option.label}
              </label>
              {option.description && (
                <p className="text-xs text-text-tertiary mt-1">
                  {option.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      {error && (
        <p className="mt-2 text-sm text-error">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-2 text-sm text-text-tertiary">{helperText}</p>
      )}
    </div>
  );
};

RadioGroup.displayName = 'RadioGroup';
