'use client';

import { useEffect, useRef, useState } from 'react';
import Papa from 'papaparse';
import { useRouter } from 'next/navigation';
import { Check, Upload, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { validationSummary } from '@/lib/ui/validation';
import { cn } from '@/lib/utils/cn';

type Tone = 'blue' | 'amber' | 'violet' | 'teal';
type Result = { error?: string; success?: boolean; submissionId?: string } | undefined;

interface Props {
  maxMb: number;
  leftToday: number;
  /** Why uploading is blocked right now (limit reached, phase closed…). */
  blockedReason?: string | null;
  tone: Tone;
  /** Table the submission lands in, for polling its score. */
  table: 'submissions' | 'practice_submissions';
  metricName: string;
  decimals: number;
  submit: (fd: FormData) => Promise<Result>;
  /** Where "See the leaderboard" goes after a score. */
  boardHref: string;
}

interface Check {
  ok: boolean;
  label: string;
  note?: string;
}

type Step = 'empty' | 'picked' | 'uploading' | 'scoring' | 'done' | 'rejected' | 'slow';

const TONES: Record<Tone, { bg: string; strong: string; text: string; line: string; muted: string }> = {
  blue: { bg: 'bg-blue-bg', strong: 'bg-blue-strong', text: 'text-blue', line: 'border-blue-line', muted: 'text-blue-muted' },
  amber: { bg: 'bg-amber-bg', strong: 'bg-amber-strong', text: 'text-amber', line: 'border-amber-line', muted: 'text-amber-muted' },
  violet: { bg: 'bg-violet-bg', strong: 'bg-violet-strong', text: 'text-violet', line: 'border-violet-line', muted: 'text-violet-muted' },
  teal: { bg: 'bg-teal-bg', strong: 'bg-teal-strong', text: 'text-teal', line: 'border-teal-line', muted: 'text-teal-muted' },
};

/** Look at the file before it uses up a submission: header, duplicates, blanks, size. */
async function preflight(file: File, maxMb: number): Promise<{ checks: Check[]; rows: number; preview: string[] }> {
  const checks: Check[] = [];
  const tooBig = file.size > maxMb * 1024 * 1024;
  checks.push({ ok: file.name.toLowerCase().endsWith('.csv'), label: 'The file is a .csv' });
  checks.push({ ok: !tooBig, label: `${formatSize(file.size)}, ${tooBig ? 'over' : 'under'} the ${maxMb} MB limit` });

  const text = await file.text();
  const parsed = Papa.parse<string[]>(text, { skipEmptyLines: true });
  const data = parsed.data;
  const header = (data[0] ?? []).map((h) => String(h).trim().toLowerCase());
  const rows = Math.max(0, data.length - 1);
  checks.push({
    ok: header.length === 2 && header[0] === 'id' && header[1] === 'prediction',
    label: 'Header is id,prediction',
    note: header.length ? `Found: ${data[0].join(',')}` : 'The file looks empty',
  });
  checks.push({ ok: rows > 0, label: rows > 0 ? `${rows.toLocaleString('en-US')} prediction rows` : 'No prediction rows' });

  const seen = new Map<string, number>();
  let dup: string | null = null;
  let blank = 0;
  data.slice(1).forEach((r, i) => {
    const id = String(r[0] ?? '').trim();
    if (seen.has(id) && dup === null) dup = `${id} appears on rows ${seen.get(id)! + 2} and ${i + 2}`;
    seen.set(id, i);
    if (String(r[1] ?? '').trim() === '') blank++;
  });
  checks.push({ ok: dup === null, label: dup === null ? 'No duplicate ids' : 'Duplicate id', note: dup ?? undefined });
  checks.push({ ok: blank === 0, label: blank === 0 ? 'Every row has a prediction' : `${blank} row${blank > 1 ? 's have' : ' has'} no prediction` });

  // Header OK labels pass the note only when failing
  if (checks[2].ok) checks[2].note = undefined;
  return { checks, rows, preview: text.split(/\r?\n/).slice(0, 4) };
}

function formatSize(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export default function CsvUploader({ maxMb, leftToday, blockedReason, tone, table, metricName, decimals, submit, boardHref }: Props) {
  const router = useRouter();
  const t = TONES[tone];
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('empty');
  const [file, setFile] = useState<File | null>(null);
  const [checks, setChecks] = useState<Check[]>([]);
  const [preview, setPreview] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState<{ score: number | null; note: string | null }>({ score: null, note: null });
  const [subId, setSubId] = useState<string | null>(null);

  const ok = checks.length > 0 && checks.every((c) => c.ok);

  async function pick(f: File | undefined | null) {
    if (!f) return;
    setError('');
    setFile(f);
    const r = await preflight(f, maxMb);
    setChecks(r.checks);
    setPreview(r.preview);
    setStep('picked');
  }

  function reset() {
    setStep('empty');
    setFile(null);
    setChecks([]);
    setPreview([]);
    setError('');
    setSubId(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function send() {
    if (!file) return;
    setStep('uploading');
    setError('');
    const fd = new FormData();
    fd.append('file', file);
    const res = await submit(fd);
    if (!res || res.error || !res.submissionId) {
      setError(res?.error ?? 'Upload failed. Try again.');
      setStep('picked');
      return;
    }
    setSubId(res.submissionId);
    setStep('scoring');
  }

  // Poll the new submission until it's scored (or give up after ~90 s).
  useEffect(() => {
    if (step !== 'scoring' || !subId) return;
    const supabase = createClient();
    let tries = 0;
    let stop = false;
    const tick = async () => {
      if (stop) return;
      tries++;
      const { data } = (await supabase.from(table).select('validation_status, score, validation_errors').eq('id', subId).maybeSingle()) as {
        data: { validation_status: string; score: number | null; validation_errors: unknown } | null;
      };
      if (data?.validation_status === 'valid') {
        setResult({ score: data.score, note: null });
        setStep('done');
        router.refresh();
        return;
      }
      if (data?.validation_status === 'invalid') {
        setResult({ score: null, note: validationSummary(data.validation_errors) });
        setStep('rejected');
        router.refresh();
        return;
      }
      if (tries >= 45) {
        setStep('slow');
        router.refresh();
        return;
      }
      setTimeout(tick, 2000);
    };
    const first = setTimeout(tick, 1200);
    return () => {
      stop = true;
      clearTimeout(first);
    };
  }, [step, subId, table, router]);

  if (blockedReason && step === 'empty') {
    return <div className={cn('rounded-[18px] p-6 sm:p-8', t.bg)}><p className="font-semibold">{blockedReason}</p></div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {step === 'empty' && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pick(e.dataTransfer.files?.[0]);
          }}
          className={cn('flex flex-col items-center gap-3 rounded-[18px] border-2 border-dashed px-6 py-12 text-center sm:py-16', t.bg, dragging ? 'border-white/60' : t.line)}
        >
          <span aria-hidden className={cn('inline-flex h-16 w-16 items-center justify-center rounded-2xl', t.strong)}>
            <Upload className={cn('h-7 w-7', t.text)} />
          </span>
          <span className="text-xl font-bold">Drop your CSV here</span>
          <span className={cn('text-[15px]', t.muted)}>or pick it from your computer · up to {maxMb} MB</span>
          <input ref={inputRef} type="file" accept=".csv,text/csv" className="sr-only" id="csv-file" onChange={(e) => pick(e.target.files?.[0])} />
          <label htmlFor="csv-file" className={cn('mt-2 inline-flex min-h-[46px] cursor-pointer items-center rounded-lg px-5 font-semibold', tone === 'amber' ? 'bg-amber text-amber-ink' : tone === 'violet' ? 'bg-violet text-violet-ink' : tone === 'teal' ? 'bg-teal text-teal-ink' : 'bg-blue text-blue-ink')}>
            Choose file
          </label>
        </div>
      )}

      {(step === 'picked' || step === 'uploading') && file && (
        <div className="animate-fade-up overflow-hidden rounded-[18px] bg-bg-surface">
          <div className={cn('flex flex-wrap items-center justify-between gap-3 px-5 py-4', t.bg)}>
            <span className="min-w-0">
              <span className="block truncate font-mono">{file.name}</span>
              <span className={cn('block text-[13px]', t.muted)}>{formatSize(file.size)}</span>
            </span>
            <button type="button" onClick={reset} className="min-h-[40px] text-sm font-semibold text-text-tertiary hover:text-white" disabled={step === 'uploading'}>
              Choose another
            </button>
          </div>
          {preview.length > 0 && (
            <pre className="overflow-x-auto border-b border-border-default px-5 py-3.5 font-mono text-sm leading-[1.8] text-text-secondary">
              <span className="text-text-muted">{preview[0]}</span>
              {'\n' + preview.slice(1).join('\n')}
            </pre>
          )}
          <ul className="flex flex-col gap-2 p-5">
            {checks.map((c) => (
              <li key={c.label} className={cn('flex items-start gap-3 rounded-xl px-3 py-2.5 text-[15px]', !c.ok && 'bg-amber-bg')}>
                <span className={cn('mt-0.5 inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full', c.ok ? 'bg-teal-bg text-teal' : 'bg-amber text-amber-ink')}>
                  {c.ok ? <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden /> : <X className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />}
                </span>
                <span className="min-w-0">
                  <span className="block">{c.label}</span>
                  {c.note && !c.ok && <span className="block break-words text-[13px] text-amber-soft">{c.note}</span>}
                </span>
              </li>
            ))}
          </ul>
          {error && <p className="mx-5 mb-4 rounded-xl bg-amber-bg px-4 py-3 text-amber-soft">{error}</p>}
          <div className="flex flex-col gap-3 border-t border-border-default px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-text-tertiary">
              {ok ? 'Looks good. The score appears in a few seconds.' : 'This file would be rejected. Rejected files do not use a submission.'}
            </span>
            <Button variant="accent" tone={tone} onClick={send} disabled={!ok || leftToday <= 0} loading={step === 'uploading'}>
              {leftToday > 0 ? `Submit · uses 1 of ${leftToday}` : 'No submissions left today'}
            </Button>
          </div>
        </div>
      )}

      {step === 'scoring' && (
        <div className={cn('flex animate-fade-up flex-col gap-3.5 rounded-[18px] p-6 sm:p-8', t.bg)}>
          <span className={cn('text-[13px] font-semibold', t.text)}>Scoring</span>
          <span className="text-xl font-bold sm:text-2xl">Checking your predictions against the answer key…</span>
          <span aria-hidden className="block h-1.5 overflow-hidden rounded-full bg-black/30">
            <span className={cn('block h-1.5 w-2/5 animate-sweep rounded-full', tone === 'amber' ? 'bg-amber' : 'bg-blue')} />
          </span>
          <span className={cn('text-sm', t.muted)}>Usually a few seconds. The result also appears under My submissions.</span>
        </div>
      )}

      {step === 'done' && (
        <div className="flex animate-fade-up flex-col gap-5 rounded-[18px] bg-teal-bg p-6 sm:p-8">
          <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-teal">
            <Check className="h-4 w-4" strokeWidth={3} aria-hidden /> Valid · scored
          </span>
          <span className="font-mono text-[2.5rem] leading-none tracking-[-0.03em] sm:text-5xl">{result.score !== null ? result.score.toFixed(decimals) : '—'}</span>
          <span className="text-[15px] text-teal-soft">{metricName}. If it beats your best, the leaderboard already shows it.</span>
          <span className="flex flex-wrap gap-2.5">
            <a href={boardHref} className="inline-flex min-h-[44px] items-center rounded-lg bg-teal px-5 font-semibold text-teal-ink">
              See the leaderboard
            </a>
            <button type="button" onClick={reset} className="min-h-[44px] rounded-lg border border-teal-line px-5 font-semibold">
              Submit another
            </button>
          </span>
        </div>
      )}

      {step === 'rejected' && (
        <div className="flex animate-fade-up flex-col gap-4 rounded-[18px] bg-amber-bg p-6 sm:p-8">
          <span className="text-[13px] font-semibold text-amber">Rejected · did not count toward your limit</span>
          <span className="text-xl font-bold">{result.note ?? 'The file did not match the expected format.'}</span>
          <button type="button" onClick={reset} className="w-fit min-h-[44px] rounded-lg bg-amber px-5 font-semibold text-amber-ink">
            Fix and try again
          </button>
        </div>
      )}

      {step === 'slow' && (
        <div className="flex animate-fade-up flex-col gap-3 rounded-[18px] bg-bg-elevated p-6 sm:p-8">
          <span className="text-[13px] font-semibold text-text-tertiary">Still scoring</span>
          <span className="text-lg font-bold">This is taking longer than usual.</span>
          <span className="text-[15px] text-text-tertiary">The file is saved. If it remains pending, contact an organiser.</span>
          <button type="button" onClick={reset} className="w-fit min-h-[44px] rounded-lg border border-border-subtle px-5 font-semibold">
            Upload another file
          </button>
        </div>
      )}
    </div>
  );
}
