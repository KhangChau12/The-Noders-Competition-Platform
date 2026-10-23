'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { buttonClasses } from '@/components/ui/Button';

export interface CertRow {
  id: string;
  verification_code: string;
  recipient_name: string;
  file_path: string;
  file_type: string;
  issued_at: string;
}

export default function CertificatesList({ certificates: initial }: { certificates: CertRow[] }) {
  const supabase = createClient();
  const [certs, setCerts] = useState(initial);
  const [q, setQ] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? certs.filter((c) => c.recipient_name.toLowerCase().includes(s) || c.verification_code.toLowerCase().includes(s)) : certs;
  }, [q, certs]);

  const urlOf = (path: string) => supabase.storage.from('certificates').getPublicUrl(path).data.publicUrl;

  async function remove(c: CertRow) {
    setBusy(c.id);
    setError('');
    const { error: storageError } = await supabase.storage.from('certificates').remove([c.file_path]);
    if (storageError) console.error('Storage delete error:', storageError);
    const { error: dbError } = await supabase.from('certificates').delete().eq('id', c.id);
    setBusy(null);
    setConfirmId(null);
    if (dbError) return setError(`Couldn’t delete: ${dbError.message}`);
    setCerts((all) => all.filter((x) => x.id !== c.id));
  }

  if (certs.length === 0) {
    return <p className="rounded-2xl bg-bg-elevated px-6 py-5 text-text-tertiary">No certificates for this contest yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-[360px]">
          <span className="sr-only">Search certificates</span>
          <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name or code"
            className="min-h-[44px] w-full rounded-lg border border-border-subtle bg-bg-primary pl-10 pr-3.5 text-[15px] placeholder:text-text-disabled focus:border-blue focus:outline-none"
          />
        </label>
        <span className="text-sm text-text-muted">
          {list.length} of {certs.length}
        </span>
      </div>
      {error && <p className="text-sm text-amber">{error}</p>}
      <ul className="overflow-hidden rounded-[18px] bg-bg-surface">
        {list.map((c) => (
          <li key={c.id} className="flex flex-col gap-3 border-t border-border-default px-5 py-4 first:border-t-0 sm:flex-row sm:items-center sm:gap-5 sm:px-6">
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{c.recipient_name}</span>
              <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-text-muted">
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(c.verification_code);
                    setCopied(c.id);
                    setTimeout(() => setCopied(null), 1500);
                  }}
                  className="min-h-[32px] break-all text-left font-mono text-teal hover:underline"
                  title="Copy code"
                >
                  {copied === c.id ? 'Copied' : c.verification_code}
                </button>
                <span>
                  {c.file_type.toUpperCase()} · {new Date(c.issued_at).toLocaleDateString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh' })}
                </span>
              </span>
            </span>
            <span className="flex flex-wrap items-center gap-2">
              {confirmId === c.id ? (
                <>
                  <span className="text-sm text-text-tertiary">Delete file and code?</span>
                  <button type="button" disabled={busy === c.id} onClick={() => remove(c)} className={buttonClasses({ variant: 'danger', size: 'sm' })}>
                    {busy === c.id ? 'Deleting…' : 'Delete'}
                  </button>
                  <button type="button" onClick={() => setConfirmId(null)} className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
                    Keep
                  </button>
                </>
              ) : (
                <>
                  <a href={urlOf(c.file_path)} target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
                    Open ↗
                  </a>
                  <a href={`/verify/${encodeURIComponent(c.verification_code)}`} target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
                    Verify page
                  </a>
                  <button type="button" onClick={() => setConfirmId(c.id)} className="min-h-[40px] rounded-lg px-3 text-sm font-semibold text-error hover:bg-error/10">
                    Delete
                  </button>
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
