/**
 * Turn whatever the scoring function stored in `validation_errors` into one
 * readable line. The shape has varied (string, string[], {message}, {errors: []}).
 */
export function validationSummary(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) {
    const first = raw.map((x) => validationSummary(x)).filter(Boolean) as string[];
    if (first.length === 0) return null;
    return first.length > 1 ? `${first[0]} (+${first.length - 1} more)` : first[0];
  }
  if (typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    if (typeof o.message === 'string') return o.message;
    if (typeof o.error === 'string') return o.error;
    if (o.errors) return validationSummary(o.errors);
    const firstString = Object.values(o).find((v) => typeof v === 'string');
    if (typeof firstString === 'string') return firstString;
  }
  return null;
}
