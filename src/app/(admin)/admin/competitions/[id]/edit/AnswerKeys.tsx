'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { uploadAnswerKey } from './actions';
import { buttonClasses } from '@/components/ui/Button';
import { FormSection } from '@/components/admin/FormBits';
import { cn } from '@/lib/utils/cn';

export interface KeyInfo {
  phase: 'public' | 'private';
  fileName: string | null;
  uploadedAt: string | null;
}

function KeyRow({ competitionId, info, label }: { competitionId: string; info: KeyInfo; label: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function upload() {
    if (!file) return;
    setBusy(true);
    setMsg(null);
    const fd = new FormData();
    fd.set('phase', info.phase);
    fd.set('file', file);
    const res = await uploadAnswerKey(competitionId, fd);
    setBusy(false);
    if ('error' in res && res.error) return setMsg({ ok: false, text: res.error });
    setMsg({ ok: true, text: 'Saved. New submissions are scored against it.' });
    setFile(null);
    router.refresh();
  }

  return (
    <div className={cn('flex flex-col gap-3 rounded-2xl p-5', info.fileName ? 'bg-bg-elevated' : 'bg-amber-bg')}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="font-semibold">{label}</span>
        <span className={cn('min-w-0 truncate text-sm', info.fileName ? 'text-text-tertiary' : 'text-amber')}>
          {info.fileName ? (
            <>
              <span className="font-mono">{info.fileName}</span>
              {info.uploadedAt && ` · ${new Date(info.uploadedAt).toLocaleDateString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh' })}`}
            </>
          ) : (
            'Missing: submissions can’t be scored'
          )}
        </span>
      </div>
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <label className="flex min-h-[44px] min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border-subtle px-4 text-sm text-text-tertiary hover:border-text-muted">
          <input type="file" accept=".csv" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <span className="truncate">{file ? file.name : info.fileName ? 'Choose a CSV to replace it' : 'Choose a CSV'}</span>
        </label>
        <button type="button" disabled={!file || busy} onClick={upload} className={buttonClasses({ variant: info.fileName ? 'secondary' : 'accent', tone: 'amber' })}>
          {busy ? 'Uploading…' : info.fileName ? 'Replace' : 'Upload'}
        </button>
      </div>
      {msg && <p className={cn('text-sm', msg.ok ? 'text-teal' : 'text-amber')}>{msg.text}</p>}
    </div>
  );
}

export default function AnswerKeys({ competitionId, fourPhase, keys }: { competitionId: string; fourPhase: boolean; keys: KeyInfo[] }) {
  const find = (p: 'public' | 'private') => keys.find((k) => k.phase === p) ?? { phase: p, fileName: null, uploadedAt: null };
  return (
    <FormSection n={5} title="Answer keys" sub="Uploads apply immediately. Existing scores are not recalculated." tone="amber">
      <KeyRow competitionId={competitionId} info={find('public')} label={fourPhase ? 'Public test' : 'Test'} />
      {fourPhase && <KeyRow competitionId={competitionId} info={find('private')} label="Private test" />}
    </FormSection>
  );
}
