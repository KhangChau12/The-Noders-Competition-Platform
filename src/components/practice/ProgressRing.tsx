/** Circular progress, e.g. "2/4" problems tried. */
export default function ProgressRing({ done, total, size = 88 }: { done: number; total: number; size?: number }) {
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const frac = total > 0 ? Math.min(1, done / total) : 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${done} of ${total} tried`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={10} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#6CC5A8"
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={`${Math.max(frac * c, 1)} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fill="#FFFFFF" className="font-mono" fontSize={size / 5}>
        {done}/{total}
      </text>
    </svg>
  );
}
