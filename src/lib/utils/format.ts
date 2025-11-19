/**
 * Format a number with commas (e.g., 1000 -> 1,000)
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Format a score to fixed decimal places
 */
export function formatScore(score: number, decimals: number = 4): string {
  return score.toFixed(decimals);
}

/**
 * Format file size to human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, total: number): string {
  if (total === 0) return '0%';
  const percentage = (value / total) * 100;
  return percentage.toFixed(1) + '%';
}

/**
 * Pluralize a word based on count
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return `${count} ${singular}`;
  return `${count} ${plural || singular + 's'}`;
}

/**
 * Convert string to slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Format phase name for display
 */
export function formatPhaseName(phase: string): string {
  const phaseNames: Record<string, string> = {
    upcoming: 'Upcoming',
    registration: 'Registration',
    public_test: 'Public Test',
    private_test: 'Private Test',
    ended: 'Ended',
  };
  return phaseNames[phase] || capitalize(phase.replace('_', ' '));
}

/**
 * Get phase color class
 */
export function getPhaseColor(phase: string): string {
  const colors: Record<string, string> = {
    upcoming: 'text-text-tertiary',
    registration: 'text-phase-registration',
    public_test: 'text-phase-public',
    private_test: 'text-phase-private',
    ended: 'text-phase-ended',
  };
  return colors[phase] || 'text-text-secondary';
}

/**
 * Get phase badge variant
 */
export function getPhaseBadgeVariant(phase: string): 'purple' | 'blue' | 'cyan' | 'gray' {
  const variants: Record<string, 'purple' | 'blue' | 'cyan' | 'gray'> = {
    registration: 'purple',
    public_test: 'blue',
    private_test: 'cyan',
    ended: 'gray',
    upcoming: 'gray',
  };
  return variants[phase] || 'gray';
}

/**
 * Get status badge variant
 */
export function getStatusBadgeVariant(status: string): 'green' | 'yellow' | 'red' | 'gray' {
  const variants: Record<string, 'green' | 'yellow' | 'red' | 'gray'> = {
    approved: 'green',
    pending: 'yellow',
    rejected: 'red',
    valid: 'green',
    invalid: 'red',
  };
  return variants[status] || 'gray';
}
