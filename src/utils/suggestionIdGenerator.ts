/**
 * Generates human-readable, unique civic suggestion tracking numbers in format SGG-YYYY-XXXXX.
 * Example: SGG-2026-00001 or SGG-2026-49102
 */
export function generateSuggestionNumber(sequentialId?: number): string {
  const year = new Date().getFullYear();

  if (sequentialId !== undefined && sequentialId > 0) {
    const padded = String(sequentialId).padStart(5, '0');
    return `SGG-${year}-${padded}`;
  }

  // Generate randomized 5-digit municipal batch tracking identifier
  const randomNumeric = Math.floor(10000 + Math.random() * 90000);
  return `SGG-${year}-${randomNumeric}`;
}

/**
 * Validates if a string adheres to the municipal suggestion number format (SGG-YYYY-XXXXX).
 */
export function isValidSuggestionNumber(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  return /^SGG-\d{4}-\d{5}$/.test(value.trim());
}
