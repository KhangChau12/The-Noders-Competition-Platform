import { Children } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils/cn';

interface MarkdownProps {
  children: string;
  className?: string;
  /** Text colour class for section numbers and list markers (e.g. a phase or domain colour). */
  accent?: string;
}

/*
 * Typography for problem statements — one scale for every contest and practice page.
 *
 *   Section (##)       22px / bold / primary, number in mono accent, rule above
 *   Sub-section (###)  18px / semibold / primary
 *   Label (####)       13px / semibold / uppercase / tertiary
 *   Body               16px (15px on phones) / 1.75 / secondary, max 72ch
 *   Bold               semibold / primary — used for labels and key terms
 *   Italic             italic / secondary — used for notes and citations
 *   Code               mono 13px on raised chip
 */
const BODY = 'text-[0.9375rem] leading-[1.75] text-text-secondary sm:text-base';

/** "1. Problem Overview" → [number, title] so the number can be styled apart. */
function splitNumber(children: React.ReactNode): [string | null, React.ReactNode] {
  const arr = Children.toArray(children);
  const first = arr[0];
  if (typeof first === 'string') {
    const m = first.match(/^(\d{1,2})\.\s+([\s\S]*)$/);
    if (m) return [m[1].padStart(2, '0'), [m[2], ...arr.slice(1)]];
  }
  return [null, children];
}

function components(accent: string): Components {
  const Section = ({ children }: { children?: React.ReactNode }) => {
    const [num, rest] = splitNumber(children);
    return (
      <h3 className="mb-4 mt-10 flex items-baseline gap-3 border-t border-border-default pt-8 text-[1.25rem] font-bold leading-snug text-text-primary first:mt-0 first:border-t-0 first:pt-0 sm:text-[1.375rem]">
        {num && <span className={cn('font-mono text-base font-medium', accent)}>{num}</span>}
        <span>{rest}</span>
      </h3>
    );
  };
  return {
    h1: Section,
    h2: Section,
    h3: ({ children }) => <h4 className="mb-3 mt-7 text-[1.0625rem] font-semibold leading-snug text-text-primary first:mt-0 sm:text-lg">{children}</h4>,
    h4: ({ children }) => <h5 className="mb-2.5 mt-6 text-[0.8125rem] font-semibold uppercase tracking-[0.06em] text-text-tertiary first:mt-0">{children}</h5>,
    h5: ({ children }) => <h5 className="mb-2.5 mt-6 text-[0.8125rem] font-semibold uppercase tracking-[0.06em] text-text-tertiary first:mt-0">{children}</h5>,
    h6: ({ children }) => <h5 className="mb-2.5 mt-6 text-[0.8125rem] font-semibold uppercase tracking-[0.06em] text-text-tertiary first:mt-0">{children}</h5>,
    p: ({ children }) => <p className={cn(BODY, 'mb-4 max-w-[72ch] last:mb-0')}>{children}</p>,
    ul: ({ children }) => <ul className={cn('mb-5 max-w-[72ch] list-disc space-y-2.5 pl-5 last:mb-0', accent.replace('text-', 'marker:text-'))}>{children}</ul>,
    ol: ({ children }) => <ol className="mb-5 max-w-[72ch] list-decimal space-y-2.5 pl-6 last:mb-0 marker:font-mono marker:text-sm marker:text-text-muted">{children}</ol>,
    li: ({ children }) => <li className={cn(BODY, 'pl-1.5 [&>p]:mb-0')}>{children}</li>,
    a: ({ children, href }) => (
      <a href={href} target="_blank" rel="noopener noreferrer" className="break-all text-blue underline underline-offset-2 hover:text-blue-soft">
        {children}
      </a>
    ),
    strong: ({ children }) => <strong className="font-semibold text-text-primary">{children}</strong>,
    em: ({ children }) => <em className="italic text-text-secondary">{children}</em>,
    code: ({ children, className: cls }) => {
      const isBlock = /language-/.test(cls ?? '') || (typeof children === 'string' && children.includes('\n'));
      if (isBlock) return <code className="font-mono text-[0.8125rem] leading-relaxed text-text-secondary">{children}</code>;
      return <code className="whitespace-nowrap rounded-md bg-bg-raised px-1.5 py-0.5 font-mono text-[0.8125rem] text-text-primary">{children}</code>;
    },
    pre: ({ children }) => <pre className="mb-5 overflow-x-auto rounded-xl bg-bg-primary p-4 last:mb-0">{children}</pre>,
    blockquote: ({ children }) => <blockquote className="mb-5 max-w-[72ch] rounded-xl border-l-[3px] border-border-subtle bg-bg-elevated px-5 py-3.5 last:mb-0 [&_p]:text-text-tertiary">{children}</blockquote>,
    table: ({ children }) => (
      <div className="mb-5 overflow-x-auto rounded-xl bg-bg-elevated last:mb-0">
        <table className="w-full border-collapse text-[0.9375rem]">{children}</table>
      </div>
    ),
    th: ({ children }) => <th className="border-b border-border-default px-4 py-3 text-left text-[0.8125rem] font-semibold text-text-tertiary">{children}</th>,
    td: ({ children }) => <td className="border-t border-border-default px-4 py-3 align-top text-text-secondary first:font-semibold first:text-text-primary">{children}</td>,
    hr: () => <hr className="my-8 border-border-default" />,
  };
}

export function Markdown({ children, className, accent = 'text-blue' }: MarkdownProps) {
  const text = (children ?? '').replace(/\r\n?/g, '\n').trim();
  return (
    <div className={cn('break-words', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components(accent)}>
        {text}
      </ReactMarkdown>
    </div>
  );
}
