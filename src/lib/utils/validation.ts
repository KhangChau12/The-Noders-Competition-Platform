import Papa from 'papaparse';

/**
 * Email validation regex
 */
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Simple validation - just check minimum length
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate CSV file
 */
export async function validateCSVFile(
  file: File,
  answerKeyRowCount?: number
): Promise<{
  valid: boolean;
  errors: string[];
  data?: any[];
}> {
  const errors: string[] = [];

  // Check file type
  if (!file.name.endsWith('.csv')) {
    errors.push('File must be a CSV');
    return { valid: false, errors };
  }

  // Check file size (10MB default)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
    return { valid: false, errors };
  }

  // Parse CSV
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data;

        // Check if CSV has data
        if (data.length === 0) {
          errors.push('CSV file is empty');
          resolve({ valid: false, errors });
          return;
        }

        // Check column count (must be exactly 2)
        const columns = Object.keys(data[0] as object);
        if (columns.length !== 2) {
          errors.push(`CSV must have exactly 2 columns (id, prediction). Found ${columns.length} columns`);
          resolve({ valid: false, errors });
          return;
        }

        // Check if first column is 'id'
        if (columns[0].toLowerCase() !== 'id') {
          errors.push('First column must be named "id"');
        }

        // Check for duplicate IDs
        const ids = data.map((row: any) => row[columns[0]]);
        const uniqueIds = new Set(ids);
        if (ids.length !== uniqueIds.size) {
          errors.push('Duplicate IDs found in CSV');
        }

        // Check for missing values
        const hasNullValues = data.some((row: any) => {
          return Object.values(row).some((val) => val === null || val === undefined || val === '');
        });
        if (hasNullValues) {
          errors.push('CSV contains missing values');
        }

        // Check row count matches answer key (if provided)
        if (answerKeyRowCount !== undefined && data.length !== answerKeyRowCount) {
          errors.push(
            `Row count mismatch: expected ${answerKeyRowCount}, got ${data.length}`
          );
        }

        resolve({
          valid: errors.length === 0,
          errors,
          data: errors.length === 0 ? data : undefined,
        });
      },
      error: (error) => {
        errors.push(`Failed to parse CSV: ${error.message}`);
        resolve({ valid: false, errors });
      },
    });
  });
}

/**
 * Validate submission quota
 */
export function validateSubmissionQuota(
  currentCount: number,
  limit: number,
  type: 'daily' | 'total'
): {
  allowed: boolean;
  message?: string;
} {
  if (currentCount >= limit) {
    return {
      allowed: false,
      message: `${type === 'daily' ? 'Daily' : 'Total'} submission limit (${limit}) exceeded`,
    };
  }

  return { allowed: true };
}

/**
 * Validate competition dates
 */
export function validateCompetitionDates(dates: {
  registration_start: Date;
  registration_end: Date;
  public_test_start: Date;
  public_test_end: Date;
  private_test_start?: Date | null;
  private_test_end?: Date | null;
  competition_type: '3-phase' | '4-phase';
}): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Registration must end before public test starts
  if (dates.registration_end >= dates.public_test_start) {
    errors.push('Registration must end before public test starts');
  }

  // Public test must end after it starts
  if (dates.public_test_end <= dates.public_test_start) {
    errors.push('Public test end must be after public test start');
  }

  // For 4-phase competitions
  if (dates.competition_type === '4-phase') {
    if (!dates.private_test_start || !dates.private_test_end) {
      errors.push('4-phase competition must have private test dates');
    } else {
      // Private test must start after public test ends
      if (dates.private_test_start <= dates.public_test_end) {
        errors.push('Private test must start after public test ends');
      }

      // Private test must end after it starts
      if (dates.private_test_end <= dates.private_test_start) {
        errors.push('Private test end must be after private test start');
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize HTML to prevent XSS
 */
export function sanitizeHtml(html: string): string {
  // Basic sanitization - in production, use a library like DOMPurify
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
