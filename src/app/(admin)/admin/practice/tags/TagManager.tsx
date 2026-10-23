'use client';

import { useState, useTransition } from 'react';
import { createTag, updateTag, deleteTag } from './actions';
import { buttonClasses } from '@/components/ui/Button';
import { field, FormMessage } from '@/components/admin/FormBits';
import { domainFromTags, DOMAIN_UI } from '@/lib/ui/phase';
import { cn } from '@/lib/utils/cn';

interface Tag {
  id: string;
  name: string;
  slug: string;
  uses: number;
}

export default function TagManager({ tags }: { tags: Tag[] }) {
  const [pending, start] = useTransition();
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const run = (fn: () => Promise<{ error?: string | null } | undefined>, after?: () => void) => {
    setError('');
    start(async () => {
      const r = await fn();
      if (r?.error) return setError(r.error);
      after?.();
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!newName.trim()) return;
          const fd = new FormData();
          fd.set('name', newName);
          run(() => createTag(fd), () => setNewName(''));
        }}
        className="flex flex-col gap-2.5 rounded-[18px] bg-teal-bg p-5 sm:flex-row sm:items-end sm:p-6"
      >
        <label className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-sm font-semibold">New tag</span>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. NLP, Computer vision, Tabular" className={field} />
        </label>
        <button type="submit" disabled={pending || !newName.trim()} className={buttonClasses({ variant: 'accent', tone: 'teal', className: 'min-h-[48px]' })}>
          Add tag
        </button>
      </form>

      <FormMessage error={error} />

      {tags.length === 0 ? (
        <p className="rounded-2xl bg-bg-elevated px-6 py-5 text-text-tertiary">No tags yet.</p>
      ) : (
        <ul className="overflow-hidden rounded-[18px] bg-bg-surface">
          {tags.map((t) => {
            const d = DOMAIN_UI[domainFromTags([t])];
            return (
              <li key={t.id} className="flex flex-col gap-3 border-t border-border-default px-5 py-4 first:border-t-0 sm:flex-row sm:items-center sm:gap-5 sm:px-6">
                {editing === t.id ? (
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus aria-label="Tag name" className={cn(field, 'sm:flex-1')} />
                ) : (
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{t.name}</span>
                    <span className="block text-sm text-text-muted">
                      <span className="font-mono">{t.slug}</span> · {t.uses} problem{t.uses === 1 ? '' : 's'} · <span className={d.text}>{d.label}</span>
                    </span>
                  </span>
                )}
                <span className="flex flex-wrap items-center gap-2">
                  {editing === t.id ? (
                    <>
                      <button
                        type="button"
                        disabled={pending || !editName.trim()}
                        onClick={() => {
                          const fd = new FormData();
                          fd.set('name', editName);
                          run(() => updateTag(t.id, fd), () => setEditing(null));
                        }}
                        className={buttonClasses({ variant: 'secondary', size: 'sm' })}
                      >
                        Save
                      </button>
                      <button type="button" onClick={() => setEditing(null)} className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
                        Cancel
                      </button>
                    </>
                  ) : confirmId === t.id ? (
                    <>
                      <span className="text-sm text-text-tertiary">{t.uses ? `Remove from ${t.uses} problem${t.uses === 1 ? '' : 's'}?` : 'Delete?'}</span>
                      <button type="button" disabled={pending} onClick={() => run(() => deleteTag(t.id), () => setConfirmId(null))} className={buttonClasses({ variant: 'danger', size: 'sm' })}>
                        Delete
                      </button>
                      <button type="button" onClick={() => setConfirmId(null)} className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
                        Keep
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(t.id);
                          setEditName(t.name);
                        }}
                        className={buttonClasses({ variant: 'ghost', size: 'sm' })}
                      >
                        Rename
                      </button>
                      <button type="button" onClick={() => setConfirmId(t.id)} className="min-h-[40px] rounded-lg px-3 text-sm font-semibold text-error hover:bg-error/10">
                        Delete
                      </button>
                    </>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
