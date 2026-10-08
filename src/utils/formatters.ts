/**
 * Formats monetary amounts in Indian Rupee format (Crores or Lakhs)
 */
export function formatCurrencyINR(amountInCrores: number): string {
  if (amountInCrores >= 1) {
    return `₹${amountInCrores.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr`;
  }
  const inLakhs = amountInCrores * 100;
  return `₹${inLakhs.toLocaleString('en-IN', { maximumFractionDigits: 2 })} L`;
}

/**
 * Formats a date string into readable civic format e.g. "12 Oct 2026"
 */
export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Formats percentage with sign e.g. "+26.25%" or "-8.00%"
 */
export function formatPercentage(val: number): string {
  const prefix = val > 0 ? '+' : '';
  return `${prefix}${val.toFixed(2)}%`;
}
