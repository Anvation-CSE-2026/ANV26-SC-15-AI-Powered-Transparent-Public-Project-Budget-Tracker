/**
 * CivicSight Project Identifier Generator
 * Standardized municipal format: PRJ-YYYY-XXXXX
 * Example: PRJ-2026-00042
 */

export function generateProjectNumber(year?: number, sequenceNumber?: number): string {
  const targetYear = year ?? new Date().getFullYear();
  
  let seqStr: string;
  if (sequenceNumber !== undefined && sequenceNumber >= 0) {
    seqStr = sequenceNumber.toString().padStart(5, '0');
  } else {
    // Generate secure random 5-digit number from 1 to 99999
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    seqStr = randomNum.toString();
  }

  return `PRJ-${targetYear}-${seqStr}`;
}

export function isValidProjectNumber(val: string): boolean {
  if (!val || typeof val !== 'string') return false;
  const projectNumberRegex = /^PRJ-\d{4}-\d{5}$/;
  return projectNumberRegex.test(val);
}
