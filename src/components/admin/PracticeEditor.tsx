'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { buttonClasses } from '@/components/ui/Button';
import { SCORING_METRIC_INFO, DEFAULT_PRACTICE_LIMITS } from '@/lib/constants';
import { domainFromTags, DOMAIN_UI } from '@/lib/ui/phase';
import MarkdownEditor from './MarkdownEditor';
import { FormSection, Field, ChoiceCards, FormMessage, ShortTextField, field } from './FormBits';
import { cn } from '@/lib/utils/cn';

type Metric = keyof typeof SCORING_METRIC_INFO;
type Level = '' | 'beginner' | 'intermediate' | 'advanced';

export interface PracticeDraft {
  title: string;
  description: string;
  problem_statement: string | null;
  scoring_metric: Metric;
  difficulty: Exclude<Level, ''> | null;
  dataset_url: string | null;
  sample_submission_url: string | null;
  daily_submission_limit: number;
  total_submission_limit: number;
  max_file_size_mb: number;
}

interface Props {
  mode: 'create' | 'edit';
  initial: PracticeDraft;
  tags: { id: string; name: string; slug: string }[];
  initialTagIds: string[];
  /** Current answer key file name (edit mode). */
  currentKey?: string | null;
  save: (fd: FormData) => Promise<{ error?: string | null; success?: boolean } | undefined>;
  below?: React.ReactNode;
}

const fileInput = cn(field, 'cursor-pointer py-2.5 file:mr-3 file:rounded-md file:border-0 file:bg-bg-raised file:px-3 file:py-1.5 file:text-sm file:text-text-primary');

export default function PracticeEditor({ mode, initial, tags, initialTagIds, currentKey, save, below }: Props) {
  const router = useRouter();
  const [metric, setMetric] = useState<Metric>(initial.scoring_metric);
  const [level, setLevel] = useState<Level>(initial.difficulty ?? '');
  const [tagIds, setTagIds] = useState<string[]>(initialTagIds);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const chosen = tags.filter((t) => tagIds.includes(t.id));
  const domain = DOMAIN_UI[domainFromTags(chosen)];

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    fd.delete('tagIds');
    tagIds.forEach((id) => fd.append('tagIds', id));
    // An empty file input still sends an empty File; drop it so edit keeps the current key.
    const key = fd.get('answerKey');
    if (key instanceof File && key.size === 0) fd.delete('answerKey');
    const res = await save(fd);
    setBusy(false);
    if (res?.error) return setError(res.error);
    router.push('/admin/practice');
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <form id="practice-form" onSubmit={onSubmit} className="flex flex-col gap-5">
          <FormSection n={1} title="Basics">
            <Field label="Title" htmlFor="title" required>
              <input id="title" name="title" defaultValue={initial.title} required className={field} placeholder="e.g. Vietnamese news topic classification" />
            </Field>
            <ShortTextField id="description" name="description" label="Short description" defaultValue={initial.description} hint="Plain text, one or two sentences. Shown on practice cards and the page header." />
            <Field label="Problem statement" htmlFor="problemStatement" hint="Shown in full on the problem page. Leave empty to reuse the short description.">
              <MarkdownEditor id="problemStatement" name="problemStatement" defaultValue={initial.problem_statement ?? ''} placeholder="## Overview

Describe the task, the data and the evaluation." />
            </Field>
          </FormSection>

          <FormSection n={2} title="Scoring and level" tone="violet">
            <Field label="Scoring metric" htmlFor="scoringMetric" hint={`${SCORING_METRIC_INFO[metric].higher_is_better ? 'Higher' : 'Lower'} is better.`}>
              <select id="scoringMetric" name="scoringMetric" value={metric} onChange={(e) => setMetric(e.target.value as Metric)} className={cn(field, 'sm:max-w-[360px]')}>
                {Object.entries(SCORING_METRIC_INFO).map(([k, m]) => (
                  <option key={k} value={k}>
                    {m.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Level">
              <ChoiceCards
                name="difficulty"
                value={level}
                onChange={setLevel}
                columns={3}
                options={[
                  { value: 'beginner', label: 'Beginner' },
                  { value: 'intermediate', label: 'Intermediate' },
                  { value: 'advanced', label: 'Advanced' },
                ]}
              />
              {level && (
                <button type="button" onClick={() => setLevel('')} className="self-start text-sm text-text-tertiary hover:text-white">
                  Clear level
                </button>
              )}
            </Field>
          </FormSection>

          <FormSection n={3} title="Tags" sub="NLP, CV and tabular tags also set the domain colour." tone="teal">
            {tags.length === 0 ? (
              <p className="text-[15px] text-text-tertiary">
                No tags yet.{' '}
                <Link href="/admin/practice/tags" className="link">
                  Create some
                </Link>
                .
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => {
                  const on = tagIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setTagIds((p) => (on ? p.filter((x) => x !== t.id) : [...p, t.id]))}
                      className={cn('min-h-[40px] rounded-full border px-4 text-sm font-semibold transition-colors', on ? 'border-teal bg-teal-bg text-teal' : 'border-border-subtle text-text-secondary hover:border-text-muted')}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
            )}
            <p className="text-sm text-text-muted">
              Shown under <span className={domain.text}>{domain.label}</span>.{' '}
              <Link href="/admin/practice/tags" className="link">
                Manage tags
              </Link>
            </p>
          </FormSection>

          <FormSection n={4} title="Data, limits and answer key" tone="amber">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Dataset link" htmlFor="datasetUrl">
                <input id="datasetUrl" name="datasetUrl" type="url" defaultValue={initial.dataset_url ?? ''} placeholder="https://…" className={field} />
              </Field>
              <Field label="Starter notebook or sample" htmlFor="sampleSubmissionUrl" hint="A Colab link shows as “Open in Colab”.">
                <input id="sampleSubmissionUrl" name="sampleSubmissionUrl" type="url" defaultValue={initial.sample_submission_url ?? ''} placeholder="https://colab.research.google.com/…" className={field} />
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Valid submissions per day" htmlFor="dailySubmissionLimit">
                <input id="dailySubmissionLimit" name="dailySubmissionLimit" type="number" min={1} max={100} defaultValue={initial.daily_submission_limit} required className={field} />
              </Field>
              <Field label="Total" htmlFor="totalSubmissionLimit" hint="0 = no limit">
                <input id="totalSubmissionLimit" name="totalSubmissionLimit" type="number" min={0} defaultValue={initial.total_submission_limit} className={field} />
              </Field>
              <Field label="Max file size (MB)" htmlFor="maxFileSizeMb">
                <input id="maxFileSizeMb" name="maxFileSizeMb" type="number" min={1} max={100} defaultValue={initial.max_file_size_mb} required className={field} />
              </Field>
            </div>
            <Field
              label={mode === 'create' ? 'Answer key' : 'Replace answer key'}
              htmlFor="answerKey"
              required={mode === 'create'}
              hint={mode === 'edit' ? (currentKey ? <>Current: <span className="font-mono">{currentKey}</span>. Leave empty to keep it.</> : 'No answer key yet: submissions can’t be scored.') : 'CSV with the same ids as the test data. Kept private.'}
            >
              <input id="answerKey" name="answerKey" type="file" accept=".csv" required={mode === 'create'} className={fileInput} />
            </Field>
          </FormSection>
        </form>
        {below}
      </div>

      <aside className="flex w-full flex-col gap-4 lg:sticky lg:top-[90px] lg:w-[320px] lg:shrink-0">
        <div className="flex flex-col gap-3 rounded-[18px] bg-navy p-6 text-white">
          <span className="text-[13px] font-semibold text-navy-text">{mode === 'create' ? 'New practice problem' : 'Editing'}</span>
          <ul className="flex flex-col gap-1.5 text-[15px] text-navy-text">
            <li>{SCORING_METRIC_INFO[metric].name}</li>
            <li>{level ? level[0].toUpperCase() + level.slice(1) : 'No level set'}</li>
            <li>{chosen.length ? chosen.map((t) => t.name).join(', ') : 'No tags'}</li>
          </ul>
          <FormMessage error={error} />
          <button type="submit" form="practice-form" disabled={busy} className={buttonClasses({ variant: 'primary', size: 'lg', className: 'mt-1 w-full' })}>
            {busy ? 'Saving…' : mode === 'create' ? 'Create problem' : 'Save changes'}
          </button>
          <Link href="/admin/practice" className="text-center text-sm text-navy-text hover:text-white">
            Cancel
          </Link>
        </div>
      </aside>
    </div>
  );
}

export const EMPTY_PRACTICE: PracticeDraft = {
  title: '',
  description: '',
  problem_statement: '',
  scoring_metric: 'accuracy',
  difficulty: null,
  dataset_url: null,
  sample_submission_url: null,
  daily_submission_limit: DEFAULT_PRACTICE_LIMITS.DAILY,
  total_submission_limit: DEFAULT_PRACTICE_LIMITS.TOTAL,
  max_file_size_mb: DEFAULT_PRACTICE_LIMITS.MAX_FILE_SIZE_MB,
};
