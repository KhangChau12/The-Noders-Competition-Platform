'use client';

import { useRef, useState } from 'react';
import { Bold, Italic, Heading2, Heading3, List, ListOrdered, Link2, Code, Quote, Table, Minus, LayoutTemplate } from 'lucide-react';
import { Markdown } from '@/components/ui/Markdown';
import { FIELD_CLASS } from '@/components/ui/Input';
import { cn } from '@/lib/utils/cn';

interface Props {
  id: string;
  name: string;
  defaultValue?: string;
  rows?: number;
  placeholder?: string;
}

type View = 'write' | 'preview' | 'split';

/**
 * Markdown field with a formatting toolbar and live preview. The preview uses
 * the same <Markdown> renderer as the public pages, so what you see is what
 * participants see. The value is submitted through a normal named textarea.
 */
export default function MarkdownEditor({ id, name, defaultValue = '', rows = 14, placeholder }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [view, setView] = useState<View>('write');

  /** Replace the selection, keeping focus and a sensible caret. */
  function apply(fn: (sel: string) => { text: string; select?: [number, number] }) {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b } = el;
    const { text, select } = fn(value.slice(a, b));
    const next = value.slice(0, a) + text + value.slice(b);
    setValue(next);
    requestAnimationFrame(() => {
      el.focus();
      const [s, e] = select ?? [a + text.length, a + text.length];
      el.setSelectionRange(a + s, a + e);
    });
  }

  const wrap = (mark: string, fallback: string) =>
    apply((sel) => {
      const inner = sel || fallback;
      return { text: `${mark}${inner}${mark}`, select: [mark.length, mark.length + inner.length] };
    });

  /** Prefix every selected line (or start a new line). */
  const prefix = (make: (i: number) => string, fallback: string) =>
    apply((sel) => {
      const el = ref.current!;
      const atLineStart = el.selectionStart === 0 || value[el.selectionStart - 1] === '\n';
      const lines = (sel || fallback).split('\n');
      const text = (atLineStart ? '' : '\n') + lines.map((l, i) => make(i) + l).join('\n');
      return { text };
    });

  const block = (snippet: string) =>
    apply(() => {
      const el = ref.current!;
      const before = value.slice(0, el.selectionStart);
      const lead = before === '' || before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n';
      return { text: `${lead}${snippet}\n` };
    });

  const tools: { label: string; icon: React.ElementType; run: () => void; key?: string }[] = [
    { label: 'Heading', icon: Heading2, run: () => prefix(() => '## ', 'Heading') },
    { label: 'Subheading', icon: Heading3, run: () => prefix(() => '### ', 'Subheading') },
    { label: 'Bold (Ctrl+B)', icon: Bold, run: () => wrap('**', 'bold text'), key: 'b' },
    { label: 'Italic (Ctrl+I)', icon: Italic, run: () => wrap('*', 'italic text'), key: 'i' },
    { label: 'Inline code', icon: Code, run: () => wrap('`', 'code') },
    { label: 'Bulleted list', icon: List, run: () => prefix(() => '- ', 'Item') },
    { label: 'Numbered list', icon: ListOrdered, run: () => prefix((i) => `${i + 1}. `, 'Item') },
    { label: 'Quote / note', icon: Quote, run: () => prefix(() => '> ', 'Note') },
    {
      label: 'Link (Ctrl+K)',
      icon: Link2,
      key: 'k',
      run: () =>
        apply((sel) => {
          const label = sel || 'link text';
          return { text: `[${label}](https://)`, select: [label.length + 3, label.length + 11] };
        }),
    },
    { label: 'Table', icon: Table, run: () => block('| Column | Description |\n| --- | --- |\n| id | Row identifier |\n| prediction | Your answer |') },
    { label: 'Divider', icon: Minus, run: () => block('---') },
  ];

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!(e.ctrlKey || e.metaKey)) return;
    const t = tools.find((x) => x.key === e.key.toLowerCase());
    if (t) {
      e.preventDefault();
      t.run();
    }
  }

  const TEMPLATE = `## 1. Problem Overview

Describe the task and why it matters.

## 2. Training Data

Describe the files and columns:

- **file.csv:** what it contains.
- **column_name:** what it means.

## 3. Problem Requirements

- **Input:** what the model receives.
- **Output:** what the model must predict.
- **Available packages:** allowed libraries.
- **Internet access:** allowed or not.

## 4. Evaluation Metrics

**Metric name:** how submissions are scored.`;

  function insertTemplate() {
    if (value.trim() && !window.confirm('Replace the current text with the standard outline?')) return;
    setValue(TEMPLATE);
    setView('write');
  }

  const words = value.trim() ? value.trim().split(/\s+/).length : 0;
  const showEditor = view !== 'preview';
  const showPreview = view !== 'write';

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-primary focus-within:border-blue">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-default bg-bg-elevated px-2 py-1.5">
        <div role="toolbar" aria-label="Formatting" className={cn('scrollbar-none flex min-w-0 items-center gap-0.5 overflow-x-auto', !showEditor && 'invisible')}>
          {tools.map((t, i) => (
            <button
              key={t.label}
              type="button"
              title={t.label}
              aria-label={t.label}
              onClick={t.run}
              className={cn('inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-text-tertiary hover:bg-white/[0.06] hover:text-white', (i === 2 || i === 5 || i === 8) && 'ml-1.5')}
            >
              <t.icon className="h-4 w-4" aria-hidden />
            </button>
          ))}
        </div>
        <div role="tablist" aria-label="View" className="flex shrink-0 rounded-lg bg-bg-primary p-0.5 text-sm">
          {(
            [
              ['write', 'Write', ''],
              ['split', 'Split', 'hidden lg:inline-flex'],
              ['preview', 'Preview', ''],
            ] as const
          ).map(([v, label, cls]) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={cn('inline-flex min-h-[32px] items-center rounded-md px-3 font-semibold', cls, view === v ? 'bg-bg-raised text-white' : 'text-text-tertiary hover:text-white')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={cn(view === 'split' && 'lg:grid lg:grid-cols-2')}>
        <textarea
          ref={ref}
          id={id}
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          rows={rows}
          placeholder={placeholder}
          className={cn(FIELD_CLASS, 'block h-auto resize-y rounded-none border-0 bg-transparent py-3 font-mono text-sm leading-relaxed focus:border-0', !showEditor && 'hidden')}
        />
        {showPreview && (
          <div className={cn('max-h-[640px] min-h-[200px] overflow-y-auto px-4 py-4 sm:px-5', view === 'split' && 'border-t border-border-default lg:border-l lg:border-t-0')}>
            {value.trim() ? <Markdown>{value}</Markdown> : <p className="text-sm text-text-disabled">Nothing to preview yet.</p>}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-default px-3 py-2 text-xs text-text-muted">
        <span>Sections: ## 1. Title · Labels: **Label:** text · Lists: - item</span>
        <button type="button" onClick={insertTemplate} className="inline-flex min-h-[28px] items-center gap-1.5 rounded-md px-2 font-semibold text-blue hover:bg-white/[0.05]">
          <LayoutTemplate className="h-3.5 w-3.5" aria-hidden />
          Insert standard outline
        </button>
        <span className="font-mono sm:ml-auto">{words} words</span>
      </div>
    </div>
  );
}
