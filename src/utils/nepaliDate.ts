import NepaliDateModule from 'nepali-date-converter';

// Handle ESM/CJS default wrapper interop
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NepaliDate: any = (NepaliDateModule as any).default?.default || (NepaliDateModule as any).default || NepaliDateModule;

export const NEPALI_MONTH_NAMES_EN = [
  'Baishakh',
  'Jestha',
  'Ashadh',
  'Shrawan',
  'Bhadra',
  'Ashwin',
  'Kartik',
  'Mangsir',
  'Poush',
  'Magh',
  'Falgun',
  'Chaitra',
] as const;

export const NEPALI_MONTH_NAMES_NP = [
  'बैशाख',
  'जेठ',
  'असार',
  'श्रावण',
  'भाद्र',
  'आश्विन',
  'कार्तिक',
  'मंसिर',
  'पौष',
  'माघ',
  'फाल्गुन',
  'चैत्र',
] as const;

export const WEEKDAYS_EN = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export interface BSDateInfo {
  year: number;
  monthIndex: number; // 0-11
  monthNumber: number; // 1-12
  monthName: string;
  monthNameNepali: string;
  date: number; // 1-32
  dayOfWeek: number; // 0-6
  dayName: string;
  formatted: string; // e.g. "Bhadra 26, 2083"
  fullFormatted: string; // e.g. "Bhadra 26, 2083 (Saturday)"
}

/**
 * Returns today's ISO date string (YYYY-MM-DD) in local timezone.
 */
export function getTodayISODate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converts a Gregorian ISO date (YYYY-MM-DD) to Bikram Sambat details.
 */
export function isoToBS(isoDate: string): BSDateInfo {
  const [yearStr, monthStr, dayStr] = isoDate.split('-');
  // Create Date at noon local time to avoid timezone boundary slips
  const jsDate = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr), 12, 0, 0);
  const bs = new NepaliDate(jsDate);

  const year = bs.getYear();
  const monthIndex = bs.getMonth();
  const date = bs.getDate();
  const dayOfWeek = bs.getDay();
  const monthName = NEPALI_MONTH_NAMES_EN[monthIndex] || '';
  const monthNameNepali = NEPALI_MONTH_NAMES_NP[monthIndex] || '';
  const dayName = WEEKDAYS_EN[dayOfWeek] || '';

  return {
    year,
    monthIndex,
    monthNumber: monthIndex + 1,
    monthName,
    monthNameNepali,
    date,
    dayOfWeek,
    dayName,
    formatted: `${monthName} ${date}, ${year}`,
    fullFormatted: `${monthName} ${date}, ${year} • ${dayName}`,
  };
}

/**
 * Adds or subtracts days from an ISO date string and returns a new ISO date string.
 */
export function offsetISODate(isoDate: string, daysOffset: number): string {
  const [yearStr, monthStr, dayStr] = isoDate.split('-');
  const jsDate = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr), 12, 0, 0);
  jsDate.setDate(jsDate.getDate() + daysOffset);

  const year = jsDate.getFullYear();
  const month = String(jsDate.getMonth() + 1).padStart(2, '0');
  const day = String(jsDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks whether an ISO date is today.
 */
export function isTodayISO(isoDate: string): boolean {
  return isoDate === getTodayISODate();
}

/**
 * Returns all ISO dates corresponding to a specific BS month (0-indexed month).
 */
export function getISODatesForBSMonth(bsYear: number, bsMonthIndex: number): string[] {
  const dates: string[] = [];
  try {
    const daysInMonth = NepaliDate.getDaysInMonth(bsYear, bsMonthIndex);
    for (let day = 1; day <= daysInMonth; day++) {
      const nepaliDate = new NepaliDate(bsYear, bsMonthIndex, day);
      const jsDate = nepaliDate.toJsDate();
      const year = jsDate.getFullYear();
      const month = String(jsDate.getMonth() + 1).padStart(2, '0');
      const date = String(jsDate.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${date}`);
    }
  } catch {
    // Fallback if year is outside supported library range
  }
  return dates;
}

/**
 * Returns an array of ISO dates between startDate and endDate inclusive.
 */
export function getDatesBetween(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  if (startDate > endDate) return dates;
  let current = startDate;
  // Safety guard against infinite loops (max 366 days)
  let count = 0;
  while (current <= endDate && count < 366) {
    dates.push(current);
    current = offsetISODate(current, 1);
    count++;
  }
  return dates;
}

