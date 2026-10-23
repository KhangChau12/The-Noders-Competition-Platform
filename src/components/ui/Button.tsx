import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';
import { Loader2 } from 'lucide-react';

export type Tone = 'violet' | 'blue' | 'amber' | 'teal';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'accent';
  /** Colour for `variant="accent"` — a solid phase colour with dark text. */
  tone?: Tone;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  asChild?: boolean;
}

export const TONE_SOLID: Record<Tone, string> = {
  violet: 'bg-violet text-violet-ink hover:bg-violet-soft',
  blue: 'bg-blue text-blue-ink hover:bg-blue-soft',
  amber: 'bg-amber text-amber-ink hover:bg-amber-soft',
  teal: 'bg-teal text-teal-ink hover:bg-teal-soft',
};

export function buttonClasses({
  variant = 'primary',
  tone = 'blue',
  size = 'md',
  className,
}: Pick<ButtonProps, 'variant' | 'tone' | 'size' | 'className'>) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 whitespace-nowrap';

  const variants = {
    primary: 'bg-text-primary text-bg-primary hover:bg-white',
    secondary: 'bg-bg-raised text-text-primary hover:bg-border-subtle',
    outline: 'border border-border-subtle text-text-primary hover:border-text-muted hover:bg-white/[0.03]',
    ghost: 'text-text-tertiary hover:text-text-primary hover:bg-white/[0.05]',
    danger: 'bg-error text-bg-primary hover:bg-[#EE9A8C]',
    success: TONE_SOLID.teal,
    accent: TONE_SOLID[tone],
  };

  // Every size keeps a 44px+ touch target on phones.
  const sizes = {
    sm: 'min-h-[40px] px-3.5 text-sm',
    md: 'min-h-[44px] px-5 text-[0.9375rem]',
    lg: 'min-h-[50px] px-6 text-base',
  };

  return cn(base, variants[variant], sizes[size], className);
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', tone, size = 'md', loading, icon, children, disabled, asChild, ...props }, ref) => {
    const classes = cn(buttonClasses({ variant, tone, size }), loading && 'opacity-70', className);

    if (asChild) {
      const child = children as React.ReactElement;
      if (child && child.type) {
        return React.cloneElement(child, {
          className: cn(classes, child.props.className),
          ...props,
        });
      }
    }

    return (
      <button ref={ref} className={classes} disabled={disabled || loading} {...props}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icon}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
