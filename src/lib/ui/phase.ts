import type { CompetitionPhase } from '@/lib/utils/competition';
import type { Tone } from '@/components/ui/Button';

/**
 * One place that says what each phase looks like.
 * Colour = meaning across the whole platform (see tailwind.config.ts).
 */
export interface PhaseUI {
  label: string;
  tone: Tone | 'gray';
  /** accent text colour */
  text: string;
  /** solid dot / bar colour */
  fill: string;
  /** tinted card ground */
  bg: string;
  /** tinted card on the navy band */
  strong: string;
}

export const PHASE_UI: Record<CompetitionPhase, PhaseUI> = {
  upcoming: { label: 'Coming soon', tone: 'gray', text: 'text-text-tertiary', fill: 'bg-text-muted', bg: 'bg-bg-elevated', strong: 'bg-navy-deep' },
  registration: { label: 'Registration open', tone: 'violet', text: 'text-violet', fill: 'bg-violet', bg: 'bg-violet-bg', strong: 'bg-violet-strong' },
  public_test: { label: 'Public test', tone: 'blue', text: 'text-blue', fill: 'bg-blue', bg: 'bg-blue-bg', strong: 'bg-blue-strong' },
  private_test: { label: 'Private test', tone: 'amber', text: 'text-amber', fill: 'bg-amber', bg: 'bg-amber-bg', strong: 'bg-amber-strong' },
  ended: { label: 'Ended', tone: 'gray', text: 'text-text-tertiary', fill: 'bg-text-muted', bg: 'bg-bg-elevated', strong: 'bg-navy-deep' },
};

export type Domain = 'nlp' | 'cv' | 'tabular' | 'other';

export const DOMAIN_UI: Record<Domain, { label: string; text: string; bg: string; border: string; muted: string; tone: Tone | 'gray' }> = {
  nlp: { label: 'NLP', text: 'text-violet', bg: 'bg-violet-bg', border: 'border-violet', muted: 'text-violet-muted', tone: 'violet' },
  cv: { label: 'Computer vision', text: 'text-amber', bg: 'bg-amber-bg', border: 'border-amber', muted: 'text-amber-muted', tone: 'amber' },
  tabular: { label: 'Tabular', text: 'text-teal', bg: 'bg-teal-bg', border: 'border-teal', muted: 'text-teal-muted', tone: 'teal' },
  other: { label: 'Other', text: 'text-text-tertiary', bg: 'bg-bg-elevated', border: 'border-border-subtle', muted: 'text-text-muted', tone: 'gray' },
};

/** Guess a practice problem's domain from its tag names/slugs. */
export function domainFromTags(tags: { name?: string | null; slug?: string | null }[] | undefined | null): Domain {
  for (const t of tags ?? []) {
    const s = `${t.slug ?? ''} ${t.name ?? ''}`.toLowerCase();
    if (/\bcv\b|cv[-_]|vision|image|detect|segment/.test(s)) return 'cv';
    if (/nlp|text|spacy|glove|token|language|bert/.test(s)) return 'nlp';
    if (/tabular|regression|multi-output|time.?series/.test(s)) return 'tabular';
  }
  return 'other';
}

/** Turn "CV_Classification" / "nlp-classification" into "Classification". */
export function prettyTag(name: string): string {
  return name
    .replace(/^(cv|nlp|tabular)[_-]/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
