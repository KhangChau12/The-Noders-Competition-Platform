import { cn } from '@/lib/utils/cn';

const PALETTE = ['bg-navy-ink', 'bg-teal-line', 'bg-[#6A4A2A]', 'bg-violet-line'];

export function initialsOf(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

interface AvatarProps {
  name: string | null | undefined;
  src?: string | null;
  size?: number;
  /** Pick a stable colour from the name instead of the default navy. */
  colorful?: boolean;
  className?: string;
}

export function Avatar({ name, src, size = 32, colorful, className }: AvatarProps) {
  const style = { width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.38)) };
  let color = 'bg-navy-ink';
  if (colorful && name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
    color = PALETTE[h % PALETTE.length];
  }

  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" style={style} className={cn('shrink-0 rounded-full object-cover', className)} />;
  }

  return (
    <span
      aria-hidden
      style={style}
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white', color, className)}
    >
      {initialsOf(name)}
    </span>
  );
}
