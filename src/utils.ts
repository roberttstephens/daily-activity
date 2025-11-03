/**
 * Utility functions shared across the application.
 */

/**
 * Validates that a date string is in YYYY-MM-DD format.
 * @param dateStr - The date string to validate
 * @returns true if valid, false otherwise
 */
export function isValidDateFormat(dateStr: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}
