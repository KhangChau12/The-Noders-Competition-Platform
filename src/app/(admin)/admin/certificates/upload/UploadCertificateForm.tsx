'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { buttonClasses } from '@/components/ui/Button';
import { Field, FormMessage, field } from '@/components/admin/FormBits';
import { cn } from '@/lib/utils/cn';

interface Props {
  competitions: { id: string; title: string }[];
  prefixMap: Record<string, string>;
  selectedCompetitionId: string | null;
  userId: string;
}

// No 0/O/1/I so codes read back unambiguously.
function generateCode(length = 4): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < length; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
  return s;
}

const VALID_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];

/** One certificate at a time: file + recipient → verification code. */
export default function UploadCertificateForm({ competitions, prefixMap: initialPrefixes, selectedCompetitionId, userId }: Props) {
  const [prefixMap, setPrefixMap] = useState(initialPrefixes);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const [competitionId, setCompetitionId] = useState(selectedCompetitionId || '');
  const [prefix, setPrefix] = useState(selectedCompetitionId ? initialPrefixes[selectedCompetitionId] || '' : '');
  const [suffix, setSuffix] = useState(generateCode(4));
  const [recipient, setRecipient] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ code: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const prefixLocked = !!(competitionId && prefixMap[competitionId]);
  const code = prefix && suffix ? `${prefix}-${suffix}` : '';

  function pickCompetition(id: string) {
    setCompetitionId(id);
    setPrefix(prefixMap[id] ?? '');
  }

  function pickFile(f: File | undefined) {
    if (!f) return;
    if (!VALID_TYPES.includes(f.type)) return setError('Choose a PDF, PNG or JPG file.');
    if (f.size > 10 * 1024 * 1024) return setError('The file must be under 10 MB.');
    setError('');
    setFile(f);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!competitionId || !prefix || !suffix || !recipient.trim() || !file) return setError('Fill in every field.');
    setBusy(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
      const filePath = `${competitionId}/${code}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('certificates').upload(filePath, file);
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      if (!prefixMap[competitionId]) {
        await supabase.from('certificate_prefixes').upsert({ competition_id: competitionId, prefix } as any);
        setPrefixMap((m) => ({ ...m, [competitionId]: prefix }));
      }

      const { error: dbError } = await supabase.from('certificates').insert({
        verification_code: code,
        competition_id: competitionId,
        recipient_name: recipient.trim(),
        file_path: filePath,
        file_type: ext,
        issued_by: userId,
      } as any);
      if (dbError) {
        await supabase.storage.from('certificates').remove([filePath]);
        throw new Error(dbError.code === '23505' ? 'That code is already used. Generate a new suffix.' : `Database error: ${dbError.message}`);
      }

      setDone({ code, name: recipient.trim() });
      setRecipient('');
      setSuffix(generateCode(4));
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err: any) {
      setError(err.message || 'Failed to upload certificate');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col gap-5 rounded-[18px] bg-teal-bg p-6 sm:p-8">
        <div>
          <p className="text-[13px] font-semibold text-teal">Certificate issued</p>
          <p className="mt-1 text-xl font-bold">{done.name}</p>
        </div>
        <div className="flex flex-col gap-2 rounded-xl bg-black/25 p-4 sm:flex-row sm:items-center sm:justify-between">
          <code className="break-all font-mono text-2xl text-teal">{done.code}</code>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(done.code);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className={buttonClasses({ variant: 'secondary', size: 'sm', className: 'self-start sm:self-auto' })}
          >
            {copied ? 'Copied' : 'Copy code'}
          </button>
        </div>
        <p className="text-[15px] text-teal-soft">Anyone can check it at /verify/{done.code}.</p>
        <div className="flex flex-wrap gap-2.5">
          <button type="button" onClick={() => setDone(null)} className={buttonClasses({ variant: 'accent', tone: 'teal' })}>
            Upload another
          </button>
          <Link href={`/admin/certificates/${competitionId}`} className={buttonClasses({ variant: 'outline' })}>
            See all for this contest
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5 rounded-[18px] bg-bg-surface p-5 sm:p-7">
      <Field label="Competition" htmlFor="competition" required>
        <select id="competition" value={competitionId} onChange={(e) => pickCompetition(e.target.value)} required className={field}>
          <option value="">Choose a competition</option>
          {competitions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_200px]">
        <Field label="Code prefix" htmlFor="prefix" required hint={prefixLocked ? 'Set for this contest. Every certificate uses it.' : 'Saved for this contest after the first upload.'}>
          <input id="prefix" value={prefix} onChange={(e) => setPrefix(e.target.value.toUpperCase())} disabled={prefixLocked} placeholder="PAIC-2026" maxLength={20} className={cn(field, 'font-mono uppercase')} />
        </Field>
        <Field label="Suffix" htmlFor="suffix" required>
          <span className="flex gap-2">
            <input id="suffix" value={suffix} onChange={(e) => setSuffix(e.target.value.toUpperCase())} maxLength={10} className={cn(field, 'min-w-0 font-mono uppercase')} />
            <button type="button" onClick={() => setSuffix(generateCode(4))} aria-label="Generate a new suffix" className={buttonClasses({ variant: 'secondary', className: 'min-h-[48px] px-3.5' })}>
              ↻
            </button>
          </span>
        </Field>
      </div>
      {code && (
        <p className="rounded-xl bg-bg-elevated px-4 py-3 text-[15px] text-text-tertiary">
          Code: <span className="break-all font-mono text-teal">{code}</span>
        </p>
      )}

      <Field label="Recipient name" htmlFor="recipient" required hint="Exactly as printed on the certificate.">
        <input id="recipient" value={recipient} onChange={(e) => setRecipient(e.target.value)} required className={field} />
      </Field>

      <Field label="Certificate file" htmlFor="certfile" required hint="PDF, PNG or JPG, up to 10 MB.">
        <label
          htmlFor="certfile"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            pickFile(e.dataTransfer.files?.[0]);
          }}
          className={cn('flex min-h-[96px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed px-4 py-5 text-center', file ? 'border-teal bg-teal-bg' : 'border-border-subtle hover:border-text-muted')}
        >
          <input ref={fileRef} id="certfile" type="file" accept=".pdf,.png,.jpg,.jpeg" className="sr-only" onChange={(e) => pickFile(e.target.files?.[0])} />
          {file ? (
            <>
              <span className="break-all font-semibold">{file.name}</span>
              <span className="text-sm text-teal-soft">{(file.size / 1024 / 1024).toFixed(2)} MB · tap to change</span>
            </>
          ) : (
            <>
              <span className="font-semibold">Drop the file here or tap to choose</span>
              <span className="text-sm text-text-muted">PDF or image</span>
            </>
          )}
        </label>
      </Field>

      <FormMessage error={error} />
      <button type="submit" disabled={busy} className={buttonClasses({ variant: 'primary', size: 'lg', className: 'w-full sm:w-auto sm:self-start' })}>
        {busy ? 'Uploading…' : 'Issue certificate'}
      </button>
    </form>
  );
}
