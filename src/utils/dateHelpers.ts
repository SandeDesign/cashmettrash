/**
 * Date helper utilities for booking system
 * Ensures all bookings align to week boundaries (Sunday end dates, Monday start dates)
 */

/**
 * Rounds a date forward to the next Sunday (or same day if already Sunday)
 * @param date - The date to round
 * @returns Date object set to next Sunday at 23:59:59
 */
export function roundToNextSunday(date: Date): Date {
  const result = new Date(date);
  const currentDay = result.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  // If not already Sunday, move to next Sunday
  if (currentDay !== 0) {
    const daysUntilSunday = 7 - currentDay;
    result.setDate(result.getDate() + daysUntilSunday);
  }

  // Set to end of day
  result.setHours(23, 59, 59, 999);

  return result;
}

/**
 * Gets the Monday immediately following a given date
 * @param date - The date to calculate from
 * @returns Date object set to next Monday at 00:00:00
 */
export function getNextMonday(date: Date): Date {
  const result = new Date(date);
  const currentDay = result.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  // Calculate days until next Monday
  const daysUntilMonday = currentDay === 0 ? 1 : (8 - currentDay);
  result.setDate(result.getDate() + daysUntilMonday);

  // Set to start of day
  result.setHours(0, 0, 0, 0);

  return result;
}

/**
 * Calculates the end date for a booking starting from a given date
 * Ensures the end date falls on a Sunday
 * @param startDate - The booking start date
 * @param weeks - Number of weeks for the booking
 * @returns Date object set to the Sunday that ends the booking period
 */
export function calculateBookingEndDate(startDate: Date | string, weeks: number): Date {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const endDate = new Date(start);

  // Add the number of weeks
  endDate.setDate(endDate.getDate() + (weeks * 7));

  // Round to next Sunday to ensure week boundary
  return roundToNextSunday(endDate);
}

/**
 * Validates if a date string is valid
 * @param dateStr - The date string to validate
 * @returns true if valid, false otherwise
 */
export function isValidDate(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Fixes an invalid date by calculating it from start_date and weeks_rented
 * @param startDate - The booking start date
 * @param weeks - Number of weeks rented
 * @returns ISO string of the calculated end date (on a Sunday)
 */
export function fixInvalidEndDate(startDate: string, weeks: number): string {
  return calculateBookingEndDate(startDate, weeks).toISOString();
}
