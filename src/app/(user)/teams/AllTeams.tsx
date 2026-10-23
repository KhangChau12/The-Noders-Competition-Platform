'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

export interface TeamRow {
  id: string;
  name: string;
  description: string | null;
  leader: string;
  members: number;
  mine: boolean;
}

const PAGE = 30;

/** Every team on the platform, searchable by team or leader name. */
export default function AllTeams({ teams }: { teams: TeamRow[] }) {
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(PAGE);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? teams.filter((t) => t.name.toLowerCase().includes(s) || t.leader.toLowerCase().includes(s)) : teams;
  }, [q, teams]);

  return (
    <div className="flex flex-col gap-4">
      <label className="relative block w-full sm:max-w-[360px]">
        <span className="sr-only">Search teams</span>
        <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setLimit(PAGE);
          }}
          placeholder="Team or leader name"
          className="min-h-[44px] w-full rounded-lg border border-border-subtle bg-bg-primary pl-10 pr-3.5 text-[15px] placeholder:text-text-disabled focus:border-blue focus:outline-none"
        />
      </label>

      {list.length === 0 ? (
        <p className="rounded-2xl bg-bg-elevated px-6 py-5 text-text-tertiary">{q ? `No team matches “${q}”.` : 'No teams yet.'}</p>
      ) : (
        <ul className="overflow-hidden rounded-2xl bg-bg-surface">
          {list.slice(0, limit).map((t) => (
            <li key={t.id} className="border-t border-border-default first:border-t-0">
              <Link href={`/teams/${t.id}`} className="flex items-center gap-4 px-4 py-3.5 text-text-primary hover:bg-white/[0.03] sm:px-6">
                <Avatar name={t.name} size={36} colorful />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-semibold">{t.name}</span>
                    {t.mine && <span className="shrink-0 rounded-full bg-amber-bg px-2 py-0.5 text-xs font-semibold text-amber">Yours</span>}
                  </span>
                  <span className="block truncate text-sm text-text-muted">{t.description || `Led by ${t.leader}`}</span>
                </span>
                <span className="hidden shrink-0 text-sm text-text-tertiary sm:block">Led by {t.leader}</span>
                <span className="w-[4.5rem] shrink-0 text-right text-sm text-text-tertiary">
                  <span className="font-mono text-text-secondary">{t.members}</span> {t.members === 1 ? 'member' : 'members'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {list.length > limit && (
        <button type="button" onClick={() => setLimit((l) => l + PAGE)} className="min-h-[44px] self-start rounded-lg border border-border-subtle px-5 text-[15px] font-semibold hover:border-text-muted">
          Show {Math.min(PAGE, list.length - limit)} more
        </button>
      )}
    </div>
  );
}
