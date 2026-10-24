import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { splitTitle } from '@/lib/data/competitions';
import { PHASE_UI } from '@/lib/ui/phase';
import type { MyTeam, MyRegistration } from '@/lib/data/user';
import { cn } from '@/lib/utils/cn';

/** A team the viewer belongs to: role, description, members, contests, quick links. */
export default function TeamCard({ team: t, tint, contests }: { team: MyTeam; tint: string; contests: MyRegistration[] }) {
  const names = t.members.map((m) => m.name);
  const shown = names.slice(0, 3).join(', ');
  return (
    <article className={cn('lift relative flex flex-col overflow-hidden rounded-[18px]', tint)}>
      <div className="flex flex-col gap-3 p-6 pb-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 text-xl font-bold leading-tight">
            {/* Stretched link: the whole card opens the team; footer links sit above it. */}
            <Link href={`/teams/${t.id}`} className="block truncate text-text-primary after:absolute after:inset-0 after:content-['']">
              {t.name}
            </Link>
          </h3>
          <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[13px] font-semibold', t.isLeader ? 'bg-amber/15 text-amber' : 'bg-teal/15 text-teal')}>{t.isLeader ? 'Leader' : 'Member'}</span>
        </div>
        <p className={cn('line-clamp-2 text-[15px]', t.description ? 'text-text-secondary' : 'italic text-text-muted')}>{t.description || 'No description yet.'}</p>
      </div>

      <div className="flex items-center gap-3 border-t border-white/[0.06] px-6 py-4">
        <span className="flex shrink-0 -space-x-2">
          {t.members.slice(0, 4).map((m) => (
            <Avatar key={m.userId} name={m.name} size={32} colorful className="ring-2 ring-bg-primary" />
          ))}
        </span>
        <span className="min-w-0 text-sm leading-snug">
          <span className="block font-semibold text-text-primary">
            {t.members.length} member{t.members.length === 1 ? '' : 's'}
          </span>
          <span className="block truncate text-text-tertiary">
            {shown}
            {names.length > 3 ? ` +${names.length - 3}` : ''}
          </span>
        </span>
      </div>

      <div className="flex flex-col gap-2 border-t border-white/[0.06] px-6 py-4 text-sm">
        <span className="text-[13px] text-text-muted">Contests</span>
        {contests.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {contests.map((r) => (
              <li key={r.competitionId} className="flex items-center gap-2">
                <span className={cn('h-2 w-2 shrink-0 rounded-full', PHASE_UI[r.phase].fill)} aria-hidden />
                <span className="font-semibold text-text-primary">{splitTitle(r.title).code ?? r.title}</span>
                <span className="text-text-muted">· {r.status === 'approved' ? PHASE_UI[r.phase].label : r.status === 'pending' ? 'Waiting for approval' : 'Not approved'}</span>
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-text-tertiary">Not registered for an open contest</span>
        )}
      </div>

      <div className="relative z-10 mt-auto flex items-center justify-between gap-3 border-t border-white/[0.06] bg-black/15 px-6 py-3">
        <Link href={`/teams/${t.id}`} className="inline-flex min-h-[40px] items-center text-sm font-semibold text-text-primary hover:underline">
          Open team →
        </Link>
        {t.isLeader && (
          <Link href={`/teams/${t.id}#invite`} className="inline-flex min-h-[40px] items-center text-sm font-semibold text-blue hover:underline">
            Invite members
          </Link>
        )}
      </div>
    </article>
  );
}
