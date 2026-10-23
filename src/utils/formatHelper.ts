/**
 * Utility untuk memformat nilai angka akademik agar selalu menampilkan
 * tepat 2 angka di belakang koma dengan pemisah koma khas Indonesia (misal: 98,57 atau 61,76).
 */
export function formatScore(val: number | string | undefined | null): string {
  if (val === undefined || val === null || val === '') return '0,00';
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'));
  if (isNaN(num)) return '0,00';
  return num.toFixed(2).replace('.', ',');
}

/**
 * Format angka umum dengan 2 angka di belakang koma
 */
export function formatNumber2Dec(val: number | string | undefined | null): string {
  return formatScore(val);
}
