/**
 * Validates and constrains counter values within allowed range
 * @param value - The counter value to validate
 * @returns The validated counter value
 */
export function validateCounter(value: number): number {
  // Ensure value is not negative
  if (value < 0) {
    return 0;
  }

  // Ensure value does not exceed maximum
  if (value > 999) {
    return 999;
  }

  // Return original value if within valid range
  return value;
}

/**
 * Checks if a counter increment operation would be valid
 * @param currentValue - The current counter value
 * @returns Boolean indicating if increment is allowed
 */
export function canIncrement(currentValue: number): boolean {
  return currentValue < 999;
}

/**
 * Checks if a counter decrement operation would be valid
 * @param currentValue - The current counter value
 * @returns Boolean indicating if decrement is allowed
 */
export function canDecrement(currentValue: number): boolean {
  return currentValue > 0;
}