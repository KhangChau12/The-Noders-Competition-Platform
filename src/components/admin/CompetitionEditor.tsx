'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { buttonClasses } from '@/components/ui/Button';
import { SCORING_METRIC_INFO } from '@/lib/constants';
import MarkdownEditor from './MarkdownEditor';
import { FormSection, Field, ChoiceCards, FormMessage, ShortTextField, field, toVnInput, fromVnInput } from './FormBits';
import { cn } from '@/lib/utils/cn';

type Metric = keyof typeof SCORING_METRIC_INFO;
type Result = { error?: string; success?: boolean } | undefined;

export interface CompetitionDraft {
  id?: string;
  title: string;
  description: string;
  problem_statement: string | null;
  competition_type: '3-phase' | '4-phase';
  participation_type: 'individual' | 'team';
  scoring_metric: Metric;
  registration_start: string | null;
  registration_end: string | null;
  public_test_end: string | null;
  private_test_end: string | null;
  dataset_url: string | null;
  sample_submission_url: string | null;
  daily_submission_limit: number;
  total_submission_limit: number | null;
  max_file_size_mb: number;
  min_team_size: number | null;
  max_team_size: number | null;
}

interface Props {
  mode: 'create' | 'edit';
  initial: CompetitionDraft;
  /** create: createCompetition(fd). edit: (fd) => updateCompetition(id, fd). */
  save: (fd: FormData) => Promise<Result & { competitionId?: string }>;
  /** Rendered under the form (edit mode: answer keys, danger zone). */
  below?: React.ReactNode;
}

const DAY = 864e5;
const plusDays = (vn: string, d: number) => (vn ? toVnInput(new Date(new Date(fromVnInput(vn)).getTime() + d * DAY).toISOString()) : '');
function span(a: string, b: string): string | null {
  if (!a || !b) return null;
  const ms = new Date(fromVnInput(b)).getTime() - new Date(fromVnInput(a)).getTime();
  if (!(ms > 0)) return null;
  const d = Math.floor(ms / DAY);
  const h = Math.round((ms - d * DAY) / 3600_000);
  return `${d ? `${d} day${d === 1 ? '' : 's'}` : ''}${d && h ? ' ' : ''}${h ? `${h} h` : ''}` || '0 h';
}

export default function CompetitionEditor({ mode, initial, save, below }: Props) {
  const router = useRouter();
  const [type, setType] = useState(initial.competition_type);
  const [part, setPart] = useState(initial.participation_type);
  const [metric, setMetric] = useState<Metric>(initial.scoring_metric);
  const [regStart, setRegStart] = useState(toVnInput(initial.registration_start));
  const [regEnd, setRegEnd] = useState(toVnInput(initial.registration_end));
  const [pubEnd, setPubEnd] = useState(toVnInput(initial.public_test_end));
  const [privEnd, setPrivEnd] = useState(toVnInput(initial.private_test_end));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const four = type === '4-phase';

  // Fill the rest of the timeline with 7 / 14 / 7 days the first time a start is picked.
  function pickStart(v: string) {
    setRegStart(v);
    if (v && !regEnd && !pubEnd) {
      const r = plusDays(v, 7);
      const p = plusDays(r, 14);
      setRegEnd(r);
      setPubEnd(p);
      if (!privEnd) setPrivEnd(plusDays(p, 7));
    }
  }

  const timelineError = useMemo(() => {
    const t = (v: string) => (v ? new Date(fromVnInput(v)).getTime() : NaN);
    if (!regStart || !regEnd || !pubEnd || (four && !privEnd)) return 'Fill in every date.';
    if (!(t(regStart) < t(regEnd))) return 'Registration must close after it opens.';
    if (!(t(regEnd) < t(pubEnd))) return 'The public test must end after registration closes.';
    if (four && !(t(pubEnd) < t(privEnd))) return 'The private test must end after the public test.';
    return null;
  }, [regStart, regEnd, pubEnd, privEnd, four]);

  const bars = useMemo(() => {
    const t = (v: string) => new Date(fromVnInput(v)).getTime();
    if (timelineError) return null;
    const parts = [
      { label: 'Registration', a: regStart, b: regEnd, cls: 'bg-violet' },
      { label: 'Public test', a: regEnd, b: pubEnd, cls: 'bg-blue' },
      ...(four ? [{ label: 'Private test', a: pubEnd, b: privEnd, cls: 'bg-amber' }] : []),
    ];
    const total = t(parts[parts.length - 1].b) - t(regStart);
    return parts.map((p) => ({ ...p, pct: ((t(p.b) - t(p.a)) / total) * 100 }));
  }, [timelineError, regStart, regEnd, pubEnd, privEnd, four]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (timelineError) return setError(timelineError);
    setBusy(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    // All boundaries go to the server as full ISO strings (Vietnam time entered).
    fd.set('registrationStart', fromVnInput(regStart));
    fd.set('registrationEnd', fromVnInput(regEnd));
    fd.set('publicTestStart', fromVnInput(regEnd));
    fd.set('publicTestEnd', fromVnInput(pubEnd));
    if (four) {
      fd.set('privateTestStart', fromVnInput(pubEnd));
      fd.set('privateTestEnd', fromVnInput(privEnd));
    } else {
      fd.delete('privateTestStart');
      fd.delete('privateTestEnd');
    }
    const res = await save(fd);
    setBusy(false);
    if (res?.error) return setError(res.error);
    router.push('/admin/competitions');
    router.refresh();
  }

  const metricInfo = SCORING_METRIC_INFO[metric];

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <form id="competition-form" onSubmit={onSubmit} className="flex flex-col gap-5">
          <FormSection n={1} title="Basics" sub="What people see on the contest card and page.">
            <Field label="Title" htmlFor="title" required hint="Optionally begin with a short code, e.g. “PAIC 2026: …”.">
              <input id="title" name="title" defaultValue={initial.title} required className={field} />
            </Field>
            <ShortTextField id="description" name="description" label="Short description" defaultValue={initial.description} hint="Plain text, one or two sentences. Shown on contest cards and the page header." />
            <Field label="Problem statement" htmlFor="problemStatement" hint="Shown in full on the contest page. Leave empty to reuse the short description.">
              <MarkdownEditor id="problemStatement" name="problemStatement" defaultValue={initial.problem_statement ?? ''} placeholder="## Overview

Describe the task, the data and the evaluation." />
            </Field>
          </FormSection>

          <FormSection n={2} title="Format" tone="violet">
            <Field label="Phases">
              <ChoiceCards
                name="competitionType"
                value={type}
                onChange={setType}
                options={[
                  { value: '3-phase', label: '3 phases', sub: 'Registration → public test → ended' },
                  { value: '4-phase', label: '4 phases', sub: 'Adds a private test that decides the final rank' },
                ]}
              />
            </Field>
            <Field label="Who enters">
              <ChoiceCards
                name="participationType"
                value={part}
                onChange={setPart}
                options={[
                  { value: 'individual', label: 'Individuals' },
                  { value: 'team', label: 'Teams', sub: 'Leaders register; members share limits' },
                ]}
              />
            </Field>
            {part === 'team' && (
              <div className="grid grid-cols-2 gap-4 sm:max-w-[360px]">
                <Field label="Min team size" htmlFor="minTeamSize">
                  <input id="minTeamSize" name="minTeamSize" type="number" min={1} defaultValue={initial.min_team_size ?? 1} className={field} />
                </Field>
                <Field label="Max team size" htmlFor="maxTeamSize">
                  <input id="maxTeamSize" name="maxTeamSize" type="number" min={1} defaultValue={initial.max_team_size ?? 3} className={field} />
                </Field>
              </div>
            )}
            <Field label="Scoring metric" htmlFor="scoringMetric" hint={`${metricInfo.higher_is_better ? 'Higher' : 'Lower'} is better.`}>
              <select id="scoringMetric" name="scoringMetric" value={metric} onChange={(e) => setMetric(e.target.value as Metric)} className={cn(field, 'sm:max-w-[360px]')}>
                {Object.entries(SCORING_METRIC_INFO).map(([k, m]) => (
                  <option key={k} value={k}>
                    {m.name}
                  </option>
                ))}
              </select>
            </Field>
          </FormSection>

          <FormSection n={3} title="Timeline" sub="Vietnam time (UTC+7). Each phase starts the moment the previous one ends." tone="blue">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Registration opens" htmlFor="regStart" required>
                <input id="regStart" type="datetime-local" value={regStart} onChange={(e) => pickStart(e.target.value)} required className={field} />
              </Field>
              <Field label="Registration closes · public test starts" htmlFor="regEnd" required hint={span(regStart, regEnd) ?? undefined}>
                <input id="regEnd" type="datetime-local" value={regEnd} onChange={(e) => setRegEnd(e.target.value)} required className={field} />
              </Field>
              <Field label={four ? 'Public test ends · private test starts' : 'Public test ends · contest ends'} htmlFor="pubEnd" required hint={span(regEnd, pubEnd) ?? undefined}>
                <input id="pubEnd" type="datetime-local" value={pubEnd} onChange={(e) => setPubEnd(e.target.value)} required className={field} />
              </Field>
              {four && (
                <Field label="Private test ends · contest ends" htmlFor="privEnd" required hint={span(pubEnd, privEnd) ?? undefined}>
                  <input id="privEnd" type="datetime-local" value={privEnd} onChange={(e) => setPrivEnd(e.target.value)} required className={field} />
                </Field>
              )}
            </div>
            {bars ? (
              <div>
                <div className="flex h-3 overflow-hidden rounded-full" aria-hidden>
                  {bars.map((b) => (
                    <span key={b.label} className={b.cls} style={{ width: `${b.pct}%` }} />
                  ))}
                </div>
                <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-text-tertiary">
                  {bars.map((b) => (
                    <li key={b.label} className="flex items-center gap-2">
                      <span className={cn('h-2 w-2 rounded-full', b.cls)} aria-hidden />
                      {b.label} · {span(b.a, b.b)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              regStart && <p className="text-sm text-amber">{timelineError}</p>
            )}
          </FormSection>

          <FormSection n={4} title="Data and limits" tone="teal">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Dataset link" htmlFor="datasetUrl" hint="Shown to approved participants once the contest is running.">
                <input id="datasetUrl" name="datasetUrl" type="url" defaultValue={initial.dataset_url ?? ''} placeholder="https://drive.google.com/…" className={field} />
              </Field>
              <Field label="Sample submission link" htmlFor="sampleSubmissionUrl">
                <input id="sampleSubmissionUrl" name="sampleSubmissionUrl" type="url" defaultValue={initial.sample_submission_url ?? ''} placeholder="https://…" className={field} />
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Valid submissions per day" htmlFor="dailySubmissionLimit" hint="Per person or per team. Resets at midnight.">
                <input id="dailySubmissionLimit" name="dailySubmissionLimit" type="number" min={1} defaultValue={initial.daily_submission_limit} className={field} />
              </Field>
              <Field label="Total submissions" htmlFor="totalSubmissionLimit" hint="Over the whole contest.">
                <input id="totalSubmissionLimit" name="totalSubmissionLimit" type="number" min={1} defaultValue={initial.total_submission_limit ?? 10000} className={field} />
              </Field>
              <Field label="Max file size (MB)" htmlFor="maxFileSizeMb">
                <input id="maxFileSizeMb" name="maxFileSizeMb" type="number" min={1} max={100} defaultValue={initial.max_file_size_mb} className={field} />
              </Field>
            </div>
          </FormSection>

          {mode === 'create' && (
            <FormSection n={5} title="Answer keys" sub="Private. Must use the same id column as the test data." tone="amber">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={four ? 'Public test answer key' : 'Answer key'} htmlFor="publicAnswerKey" required>
                  <input id="publicAnswerKey" name="publicAnswerKey" type="file" accept=".csv" required className={cn(field, 'cursor-pointer py-2.5 file:mr-3 file:rounded-md file:border-0 file:bg-bg-raised file:px-3 file:py-1.5 file:text-sm file:text-text-primary')} />
                </Field>
                {four && (
                  <Field label="Private test answer key" htmlFor="privateAnswerKey" required>
                    <input id="privateAnswerKey" name="privateAnswerKey" type="file" accept=".csv" required className={cn(field, 'cursor-pointer py-2.5 file:mr-3 file:rounded-md file:border-0 file:bg-bg-raised file:px-3 file:py-1.5 file:text-sm file:text-text-primary')} />
                  </Field>
                )}
              </div>
            </FormSection>
          )}
        </form>
        {below}
      </div>

      <aside className="flex w-full flex-col gap-4 lg:sticky lg:top-[90px] lg:w-[320px] lg:shrink-0">
        <div className="flex flex-col gap-3 rounded-[18px] bg-navy p-6 text-white">
          <span className="text-[13px] font-semibold text-navy-text">{mode === 'create' ? 'New competition' : 'Editing'}</span>
          <ul className="flex flex-col gap-1.5 text-[15px] text-navy-text">
            <li>{four ? '4 phases' : '3 phases'} · {part === 'team' ? 'teams' : 'individuals'}</li>
            <li>{metricInfo.name}</li>
            <li className={timelineError ? 'text-amber-soft' : undefined}>{timelineError ?? `Runs ${span(regStart, four ? privEnd : pubEnd)}`}</li>
          </ul>
          <FormMessage error={error} />
          <button type="submit" form="competition-form" disabled={busy} className={buttonClasses({ variant: 'primary', size: 'lg', className: 'mt-1 w-full' })}>
            {busy ? 'Saving…' : mode === 'create' ? 'Create competition' : 'Save changes'}
          </button>
          <a href="/admin/competitions" className="text-center text-sm text-navy-text hover:text-white">
            Cancel
          </a>
        </div>
      </aside>
    </div>
  );
}
