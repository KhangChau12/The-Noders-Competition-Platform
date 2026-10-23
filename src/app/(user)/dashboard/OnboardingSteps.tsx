'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { buttonClasses, type Tone } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';

export interface Step {
  n: number;
  title: string;
  short: string;
  body: string;
  how: string[];
  time: string;
  cta: { href: string; label: string };
  tone: Tone;
  done: boolean;
  doneNote: string;
}

const T: Record<Tone, { bg: string; text: string; solid: string }> = {
  violet: { bg: 'bg-violet-bg', text: 'text-violet', solid: 'bg-violet' },
  blue: { bg: 'bg-blue-bg', text: 'text-blue', solid: 'bg-blue' },
  amber: { bg: 'bg-amber-bg', text: 'text-amber', solid: 'bg-amber' },
  teal: { bg: 'bg-teal-bg', text: 'text-teal', solid: 'bg-teal' },
};

const SKIP_KEY = 'noders:onboarding-skipped';
const HIDE_KEY = 'noders:onboarding-hidden';

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* private mode: just don't persist */
  }
}

/** One step at a time. Done steps collapse; later steps show a one-line summary. */
export default function OnboardingSteps({ steps }: { steps: Step[] }) {
  const [skipped, setSkipped] = useState<number[]>([]);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const s = read(SKIP_KEY);
    if (s) setSkipped(JSON.parse(s));
    setHidden(read(HIDE_KEY) === '1');
  }, []);

  if (hidden) return null;

  const isOff = (st: Step) => st.done || skipped.includes(st.n);
  const current = steps.find((s) => !isOff(s));

  const skip = (n: number) => {
    const next = [...skipped, n];
    setSkipped(next);
    write(SKIP_KEY, JSON.stringify(next));
  };

  return (
    <ol aria-label="Getting started" className="flex flex-col gap-2.5">
      {steps.map((s) => {
        const t = T[s.tone];
        if (s.done) {
          return (
            <li key={s.n} className="flex items-center gap-3.5 rounded-2xl bg-teal-bg px-5 py-3.5">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal text-teal-ink">
                <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
              </span>
              <span className="text-teal-soft">
                <span className="font-semibold text-text-primary">{s.title}</span> · {s.doneNote}
              </span>
            </li>
          );
        }
        if (current && s.n === current.n) {
          return (
            <li key={s.n} className={cn('flex flex-col gap-3.5 rounded-[18px] p-6 sm:p-8', t.bg)}>
              <span className="flex items-center gap-3">
                <span className={cn('inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-bg-primary', t.solid)}>{s.n}</span>
                <span className={cn('text-[13px] font-semibold', t.text)}>
                  Step {s.n} of {steps.length} · about {s.time}
                </span>
              </span>
              <h2 className="text-2xl font-bold leading-tight tracking-[-0.02em] sm:text-[1.75rem]">{s.title}</h2>
              <p className="max-w-[620px] text-base text-text-secondary sm:text-[17px]">{s.body}</p>
              <ul className="flex flex-col gap-1.5">
                {s.how.map((h, i) => (
                  <li key={i} className="flex items-baseline gap-3 rounded-xl bg-black/25 px-4 py-2.5 text-[15px]">
                    <span className={cn('font-mono text-[13px]', t.text)}>{String(i + 1).padStart(2, '0')}</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
              <span className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-2">
                <Link href={s.cta.href} className={buttonClasses({ variant: 'accent', tone: s.tone, size: 'lg' })}>
                  {s.cta.label}
                </Link>
                <button type="button" onClick={() => skip(s.n)} className="min-h-[44px] text-sm text-text-tertiary underline underline-offset-4 hover:text-white">
                  Skip for now
                </button>
              </span>
            </li>
          );
        }
        return (
          <li key={s.n} className="flex items-center gap-3.5 rounded-2xl bg-bg-surface px-5 py-3.5">
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border-subtle font-mono text-[13px] text-text-muted">{s.n}</span>
            <span className="min-w-0 leading-snug">
              <span className="block font-semibold text-text-secondary">{s.title}</span>
              <span className="block text-sm text-text-muted">{skipped.includes(s.n) ? 'Skipped for now' : s.short}</span>
            </span>
          </li>
        );
      })}
      {!current && (
        <li className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] bg-teal-bg px-6 py-5">
          <span>
            <span className="block text-lg font-bold">You&apos;re set.</span>
            <span className="text-teal-soft">From now on this page shows your contests, scores and teams.</span>
          </span>
          <button
            type="button"
            onClick={() => {
              setHidden(true);
              write(HIDE_KEY, '1');
            }}
            className="min-h-[40px] text-sm font-semibold text-teal hover:underline"
          >
            Hide this checklist
          </button>
        </li>
      )}
    </ol>
  );
}
