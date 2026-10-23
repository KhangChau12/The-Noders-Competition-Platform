/**
 * Display helpers. Everything is shown in Vietnam time (Asia/Ho_Chi_Minh),
 * whatever timezone the server runs in.
 */
const TZ = 'Asia/Ho_Chi_Minh';

function parts(iso: string | Date) {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const f = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
  const p = Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value]));
  return { day: p.day, month: p.month, year: p.year, time: `${p.hour}:${p.minute}` };
}

/** "18 Jan 2026" */
export function vnDate(iso: string | Date): string {
  const p = parts(iso);
  return `${p.day} ${p.month} ${p.year}`;
}

/** "18 Jan" */
export function vnDay(iso: string | Date): string {
  const p = parts(iso);
  return `${p.day} ${p.month}`;
}

/** "23:00" */
export function vnTime(iso: string | Date): string {
  return parts(iso).time;
}

/** "18 Jan 2026, 23:00" */
export function vnDateTime(iso: string | Date): string {
  const p = parts(iso);
  return `${p.day} ${p.month} ${p.year}, ${p.time}`;
}

/** "4 – 17 Jan 2026", "28 Nov – 28 Dec 2025", "4 Jan" when same day. */
export function vnRange(startIso: string, endIso: string): string {
  const a = parts(startIso);
  const b = parts(endIso);
  if (a.day === b.day && a.month === b.month && a.year === b.year) return `${a.day} ${a.month} ${a.year}`;
  if (a.year !== b.year) return `${a.day} ${a.month} ${a.year} – ${b.day} ${b.month} ${b.year}`;
  if (a.month !== b.month) return `${a.day} ${a.month} – ${b.day} ${b.month} ${b.year}`;
  return `${a.day} – ${b.day} ${b.month} ${b.year}`;
}

/** "03d 14h" / "14h 22m" / "22m" until the target, or null if passed. */
export function shortCountdown(target: string | Date, now: Date = new Date()): string | null {
  const ms = new Date(target).getTime() - now.getTime();
  if (ms <= 0) return null;
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const pad = (n: number) => String(n).padStart(2, '0');
  if (d > 0) return `${pad(d)}d ${pad(h)}h`;
  if (h > 0) return `${pad(h)}h ${pad(m)}m`;
  return `${m}m`;
}

/**
 * Midnight of the current day in Vietnam, as a UTC Date. Daily submission
 * limits reset at this moment, wherever the server runs.
 */
export function vnDayStart(now: Date = new Date()): Date {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
  const [y, m, d] = f.format(now).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) - 7 * 3_600_000);
}

/** Midnight of the next Vietnam day (when the daily limit resets). */
export function vnNextDayStart(now: Date = new Date()): Date {
  return new Date(vnDayStart(now).getTime() + 86_400_000);
}

/** "2 days ago", "just now" */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const s = Math.round((now.getTime() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} day${d > 1 ? 's' : ''} ago`;
  return vnDate(iso);
}
