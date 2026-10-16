/**
 * Timezone utilities for Vietnam (GMT+7)
 * Supabase stores all timestamps in UTC, we need to convert for display
 */

const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';
const VIETNAM_OFFSET_HOURS = 7;

/**
 * Format a UTC date string to Vietnam time (GMT+7)
 * @param utcDateString - ISO date string from database (UTC)
 * @param options - Intl.DateTimeFormatOptions for formatting
 */
export function formatToVietnamTime(
  utcDateString: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = new Date(utcDateString);

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: VIETNAM_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...options,
  };

  return new Intl.DateTimeFormat('en-GB', defaultOptions).format(date);
}

/**
 * Format date for datetime-local input (YYYY-MM-DDTHH:mm)
 * Converts UTC to Vietnam time
 */
export function toDateTimeLocalValue(utcDateString: string): string {
  const date = new Date(utcDateString);

  // Convert to Vietnam timezone
  const vnDate = new Date(date.toLocaleString('en-US', { timeZone: VIETNAM_TIMEZONE }));

  // Format as YYYY-MM-DDTHH:mm
  const year = vnDate.getFullYear();
  const month = String(vnDate.getMonth() + 1).padStart(2, '0');
  const day = String(vnDate.getDate()).padStart(2, '0');
  const hours = String(vnDate.getHours()).padStart(2, '0');
  const minutes = String(vnDate.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Get current time in Vietnam timezone for datetime-local input
 */
export function getCurrentVietnamDateTime(): string {
  const now = new Date();
  const vnNow = new Date(now.toLocaleString('en-US', { timeZone: VIETNAM_TIMEZONE }));

  const year = vnNow.getFullYear();
  const month = String(vnNow.getMonth() + 1).padStart(2, '0');
  const day = String(vnNow.getDate()).padStart(2, '0');
  const hours = String(vnNow.getHours()).padStart(2, '0');
  const minutes = String(vnNow.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Format date for display (short format)
 */
export function formatDateShort(utcDateString: string): string {
  return formatToVietnamTime(utcDateString, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format date and time for display
 */
export function formatDateTime(utcDateString: string): string {
  return formatToVietnamTime(utcDateString, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get timezone display name
 */
export function getTimezoneDisplay(): string {
  return 'GMT+7 (Vietnam)';
}

/**
 * Returns the Date object representing 00:00:00 (midnight) of today in Vietnam timezone (Asia/Ho_Chi_Minh - UTC+7).
 */
export function getVietnamTodayStart(now: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: VIETNAM_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;

  return new Date(`${year}-${month}-${day}T00:00:00+07:00`);
}

/**
 * Returns the Date object representing 00:00:00 (midnight) of the next day in Vietnam timezone (Asia/Ho_Chi_Minh - UTC+7).
 */
export function getVietnamNextResetTime(now: Date = new Date()): Date {
  const todayStart = getVietnamTodayStart(now);
  return new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
}

