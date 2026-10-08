/**
 * CivicSight Contractor Submission Identifier Generator
 * Standardized municipal format: SUB-YYYY-XXXXX
 * Example: SUB-2026-00042
 */

export function generateSubmissionNumber(year?: number, sequenceNumber?: number): string {
  const targetYear = year ?? new Date().getFullYear();

  let seqStr: string;
  if (sequenceNumber !== undefined && sequenceNumber >= 0) {
    seqStr = sequenceNumber.toString().padStart(5, '0');
  } else {
    // Generate secure random 5-digit number from 10000 to 99999
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    seqStr = randomNum.toString();
  }

  return `SUB-${targetYear}-${seqStr}`;
}

export function isValidSubmissionNumber(val: string): boolean {
  if (!val || typeof val !== 'string') return false;
  const submissionNumberRegex = /^SUB-\d{4}-\d{5}$/;
  return submissionNumberRegex.test(val);
}
