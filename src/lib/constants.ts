/**
 * Application-wide constants
 */

export const APP_NAME = 'AI Competition Platform';
export const APP_DESCRIPTION = 'Compete in AI challenges and test your skills';

// Competition phases
export const COMPETITION_PHASES = {
  UPCOMING: 'upcoming',
  REGISTRATION: 'registration',
  PUBLIC_TEST: 'public_test',
  PRIVATE_TEST: 'private_test',
  ENDED: 'ended',
} as const;

// Competition types
export const COMPETITION_TYPES = {
  THREE_PHASE: '3-phase',
  FOUR_PHASE: '4-phase',
} as const;

// Participation types
export const PARTICIPATION_TYPES = {
  INDIVIDUAL: 'individual',
  TEAM: 'team',
} as const;

// User roles
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

// Registration statuses
export const REGISTRATION_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

// Submission validation statuses
export const VALIDATION_STATUSES = {
  PENDING: 'pending',
  VALID: 'valid',
  INVALID: 'invalid',
} as const;

// Submission limits (defaults)
export const DEFAULT_SUBMISSION_LIMITS = {
  DAILY: 5,
  TOTAL: 50,
  MAX_FILE_SIZE_MB: 10,
} as const;

// Scoring metrics
export const SCORING_METRICS = {
  F1_SCORE: 'f1_score',
  ACCURACY: 'accuracy',
  PRECISION: 'precision',
  RECALL: 'recall',
} as const;

// Date formats
export const DATE_FORMATS = {
  SHORT: 'MMM d, yyyy',
  LONG: 'MMMM d, yyyy',
  WITH_TIME: 'MMM d, yyyy h:mm a',
  ISO: "yyyy-MM-dd'T'HH:mm:ss",
} as const;
