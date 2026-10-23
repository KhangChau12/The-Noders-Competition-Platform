'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { FIELD_CLASS } from '@/components/ui/Input';
import { cn } from '@/lib/utils/cn';

const field = cn(FIELD_CLASS, 'border-border-subtle');

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: React.ReactNode;
  /** Right side of the label row (e.g. "Forgot password?"). */
  extra?: React.ReactNode;
}

export function AuthField({ label, hint, extra, className, id, name, ...props }: FieldProps) {
  const fid = id ?? `f-${name}`;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-baseline justify-between gap-3">
        <label htmlFor={fid} className="text-sm font-semibold">
          {label}
        </label>
        {extra}
      </span>
      <input id={fid} name={name} className={cn(field, className)} {...props} />
      {hint && <span className="text-sm text-text-muted">{hint}</span>}
    </div>
  );
}

/** Password input with a show/hide button (44px target). */
export function PasswordField({ label, hint, extra, id, name, ...props }: FieldProps) {
  const [show, setShow] = useState(false);
  const fid = id ?? `f-${name}`;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-baseline justify-between gap-3">
        <label htmlFor={fid} className="text-sm font-semibold">
          {label}
        </label>
        {extra}
      </span>
      <span className="relative block">
        <input id={fid} name={name} type={show ? 'text' : 'password'} className={cn(field, 'pr-12')} {...props} />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
          className="absolute right-0.5 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-text-muted hover:text-white"
        >
          {show ? <EyeOff className="h-[18px] w-[18px]" aria-hidden /> : <Eye className="h-[18px] w-[18px]" aria-hidden />}
        </button>
      </span>
      {hint && <span className="text-sm text-text-muted">{hint}</span>}
    </div>
  );
}
