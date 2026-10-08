/**
 * Generates human-readable, unique municipal complaint tracking numbers in format CMP-YYYY-XXXXX.
 * Example: CMP-2026-00001 or CMP-2026-48291
 */
export function generateComplaintNumber(sequentialId?: number): string {
  const year = new Date().getFullYear();

  if (sequentialId !== undefined && sequentialId > 0) {
    const padded = String(sequentialId).padStart(5, '0');
    return `CMP-${year}-${padded}`;
  }

  // Generate randomized 5-digit municipal batch tracking identifier
  const randomNumeric = Math.floor(10000 + Math.random() * 90000);
  return `CMP-${year}-${randomNumeric}`;
}
