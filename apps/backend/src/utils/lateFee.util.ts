// [ASUMSI — belum pernah didiskusikan dengan owner, BUKAN keputusan final]
// Domain model (Contract) tidak punya field eksplisit "tanggal jatuh tempo
// bulanan". Asumsi yang dipakai di sini: due date tiap bulan = tanggal yang
// sama dengan Contract.startDate (mis. kontrak mulai tanggal 5 → jatuh tempo
// tiap tanggal 5). Kalau bulan referensi tidak punya tanggal itu (mis. mulai
// tanggal 31, referensi Februari), due date di-clamp ke hari terakhir bulan
// tersebut. Kalau asumsi ini salah, koreksi di sini saja — dipakai bareng
// oleh PaymentService & ReportService.

/**
 * Hitung tanggal jatuh tempo untuk suatu bulan referensi, berdasarkan
 * "tanggal anniversary" dari Contract.startDate.
 */
export function computeDueDate(contractStartDate: Date, referenceDate: Date): Date {
  const day = contractStartDate.getDate();
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const clampedDay = Math.min(day, lastDayOfMonth);

  return new Date(year, month, clampedDay);
}

export const LATE_FEE_RATE_PER_DAY = 0.01;
export const LATE_FEE_MAX_RATE = 0.2;

/**
 * Hitung denda keterlambatan: 1% dari rentAmount per hari terlambat
 * (dihitung dari tanggal jatuh tempo), maksimal 20% dari rentAmount.
 */
export function calculateLateFee(
  rentAmount: number,
  dueDate: Date,
  paymentDate: Date
): number {
  const msLate = paymentDate.getTime() - dueDate.getTime();
  const daysLate = Math.floor(msLate / (1000 * 60 * 60 * 24));

  if (daysLate <= 0) return 0;

  const rate = Math.min(daysLate * LATE_FEE_RATE_PER_DAY, LATE_FEE_MAX_RATE);
  return Math.round(rentAmount * rate);
}
