export function formatDateToDDMMYYYY(value: string): string {
  if (!value.trim()) {
    return "";
  }

  const numeric = Number(value);
  if (!Number.isNaN(numeric) && numeric > 1 && numeric < 100000) {
    const excelEpoch = Date.UTC(1899, 11, 30);
    const parsed = new Date(excelEpoch + numeric * 24 * 60 * 60 * 1000);
    return formatParts(parsed.getUTCDate(), parsed.getUTCMonth() + 1, parsed.getUTCFullYear());
  }

  const slashParts = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slashParts) {
    const day = Number(slashParts[1]);
    const month = Number(slashParts[2]);
    const year = normalizeYear(Number(slashParts[3]));
    if (isValidDateParts(day, month, year)) {
      return formatParts(day, month, year);
    }
  }

  const isoDate = new Date(value);
  if (!Number.isNaN(isoDate.getTime())) {
    return formatParts(isoDate.getDate(), isoDate.getMonth() + 1, isoDate.getFullYear());
  }

  return value;
}

export function todayDDMMYYYY(date = new Date()): string {
  return formatParts(date.getDate(), date.getMonth() + 1, date.getFullYear());
}

function normalizeYear(year: number): number {
  if (year < 100) {
    return year > 50 ? 1900 + year : 2000 + year;
  }

  return year;
}

function isValidDateParts(day: number, month: number, year: number): boolean {
  return day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2200;
}

function formatParts(day: number, month: number, year: number): string {
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}
