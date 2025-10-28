import { z } from 'zod';

/**
 * Input validation schemas for user-submitted content
 * Prevents malformed data, special characters, and potential injection attacks
 */

// For user initials (leaderboards)
export const initialsSchema = z.string()
  .length(3, 'Initials must be exactly 3 characters')
  .regex(/^[A-Z]{3}$/, 'Initials must be 3 uppercase letters only')
  .transform(s => s.toUpperCase());

// For display names (profiles)
export const displayNameSchema = z.string()
  .trim()
  .min(2, 'Display name must be at least 2 characters')
  .max(50, 'Display name must be less than 50 characters')
  .regex(/^[a-zA-Z0-9\s-]+$/, 'Only letters, numbers, spaces, and hyphens allowed');

// For feedback and dispute text
export const feedbackTextSchema = z.string()
  .trim()
  .min(10, 'Feedback must be at least 10 characters')
  .max(1000, 'Feedback must be less than 1000 characters')
  .regex(/^[\w\s.,!?'\-–—""]+$/, 'Only standard characters and punctuation allowed');

// For word dispute reasons
export const disputeReasonSchema = z.string()
  .trim()
  .min(10, 'Please provide at least 10 characters explaining the issue')
  .max(500, 'Reason must be less than 500 characters')
  .regex(/^[\w\s.,!?'\-–—""]+$/, 'Only standard characters and punctuation allowed');
