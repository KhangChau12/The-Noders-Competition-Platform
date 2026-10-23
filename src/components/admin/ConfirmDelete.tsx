'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import { buttonClasses } from '@/components/ui/Button';
import { FIELD_CLASS } from '@/components/ui/Input';
import { cn } from '@/lib/utils/cn';

interface ConfirmDeleteProps {
  /** What is being deleted, e.g. "competition". */
  noun: string;
  /** The name the admin must type to confirm. */
  name: string;
  /** Extra consequences shown in the dialog. */
  note?: string;
  action: () => Promise<{ error?: string } | { success: boolean } | undefined>;
  /** Where to go afterwards (default: refresh in place). */
  after?: string;
  className?: string;
}

/** "Delete" button + dialog that asks the admin to type the name. */
export default function ConfirmDelete({ noun, name, note, action, after, className }: ConfirmDeleteProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const close = () => {
    if (busy) return;
    setOpen(false);
    setTyped('');
    setError('');
  };

  async function run() {
    setBusy(true);
    setError('');
    const res = await action();
    if (res && 'error' in res && res.error) {
      setBusy(false);
      return setError(res.error);
    }
    setBusy(false);
    setOpen(false);
    if (after) router.push(after);
    router.refresh();
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cn('min-h-[40px] rounded-lg px-3 text-sm font-semibold text-error hover:bg-error/10', className)}>
        Delete
      </button>
      <Modal
        isOpen={open}
        onClose={close}
        title={`Delete this ${noun}?`}
        size="sm"
        footer={
          <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <button type="button" onClick={close} className={buttonClasses({ variant: 'outline' })}>
              Cancel
            </button>
            <button type="button" onClick={run} disabled={busy || typed.trim() !== name.trim()} className={buttonClasses({ variant: 'danger' })}>
              {busy ? 'Deleting…' : `Delete ${noun}`}
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-3 text-[15px] text-text-secondary">
          {note && <p>{note}</p>}
          <p>
            Type <span className="font-semibold text-text-primary">{name}</span> to confirm.
          </p>
          <input value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus className={cn(FIELD_CLASS, 'border-border-subtle')} aria-label={`${noun} name`} />
          {error && (
            <p role="alert" className="text-sm text-amber">
              {error}
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}
