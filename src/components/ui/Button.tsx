import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon, children, disabled, asChild, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-border-focus focus:ring-offset-2 focus:ring-offset-bg-primary disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';

    const variants = {
      primary: 'bg-gradient-brand text-white shadow-md hover:shadow-lg hover:shadow-glow-blue-md hover:-translate-y-0.5',
      secondary: 'bg-bg-surface border border-border-default text-text-primary hover:bg-bg-elevated hover:border-primary-blue/30',
      outline: 'border border-border-default text-text-primary hover:border-primary-blue hover:bg-primary-blue/5 hover:text-primary-blue',
      ghost: 'text-text-primary hover:bg-bg-surface hover:text-primary-blue',
      danger: 'bg-error text-white hover:bg-error/90 hover:shadow-lg hover:shadow-error/20',
      success: 'bg-success text-white hover:bg-success/90 hover:shadow-lg hover:shadow-success/20',
    };

    // Mobile gets a 44px min touch target; sm:min-h-0 restores the compact
    // desktop sizing so existing desktop layouts are unaffected.
    const sizes = {
      sm: 'min-h-[44px] sm:min-h-0 px-3 py-2.5 sm:py-1.5 text-sm',
      md: 'min-h-[44px] sm:min-h-0 px-5 py-2.5 text-base',
      lg: 'px-8 py-3.5 text-lg',
    };

    const buttonClasses = cn(baseStyles, variants[variant], sizes[size], loading && 'opacity-70', className);

    if (asChild) {
      // Apply button styles to the child element instead of rendering our own button.
      const child = children as React.ReactElement;
      if (child && child.type) {
        return React.cloneElement(child, {
          className: cn(buttonClasses, child.props.className),
          ...props,
        });
      }
    }

    return (
      <button
        ref={ref}
        className={buttonClasses}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!loading && icon && <span className="mr-2">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
