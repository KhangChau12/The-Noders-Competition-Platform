'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { buttonClasses } from '@/components/ui/Button';

/** Big mono code field. Navigates to /verify/[code]. */
export default function VerifyForm({ initial = '' }: { initial?: string }) {
  const router = useRouter();
  const [code, setCode] = useState(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (!c) return setError('Enter the code printed on the certificate.');
    setBusy(true);
    router.push(`/verify/${encodeURIComponent(c)}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <label htmlFor="code" className="text-sm font-semibold">
        Verification code
      </label>
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <input
          id="code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError('');
          }}
          placeholder="PAIC-2026-X7K9"
          autoComplete="off"
          spellCheck={false}
          autoFocus
          className="min-h-[56px] min-w-0 flex-1 rounded-xl border border-border-subtle bg-bg-primary px-4 font-mono text-lg uppercase tracking-[0.08em] placeholder:text-text-disabled focus:border-blue focus:outline-none sm:text-xl"
        />
        <button type="submit" disabled={busy} className={buttonClasses({ variant: 'accent', tone: 'teal', size: 'lg', className: 'min-h-[56px]' })}>
          {busy ? 'Checking…' : 'Verify'}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-amber">
          {error}
        </p>
      )}
    </form>
  );
}
