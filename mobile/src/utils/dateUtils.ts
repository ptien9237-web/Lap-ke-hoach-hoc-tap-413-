/**
 * Strict date & timezone utility functions
 * Complies with requirement 7 (handling edge cases around midnight 23:30 / 00:00,
 * ISO 8601 with timezone, safe day comparison, next 48h calculation).
 */

import {
  parseISO,
  format,
  isToday,
  isTomorrow,
  isYesterday,
  isBefore,
  addDays,
  startOfDay,
  endOfDay,
  startOfWeek,
  eachDayOfInterval,
  isSameDay as dateFnsIsSameDay,
} from 'date-fns';

/**
 * Format an ISO 8601 string into localized readable date & time
 * Example: "14:30 - 28/10/2026"
 */
export function formatDateTime(isoString: string): string {
  try {
    const date = parseISO(isoString);
    if (isNaN(date.getTime())) return isoString;
    return format(date, 'HH:mm - dd/MM/yyyy');
  } catch {
    return isoString;
  }
}

/**
 * Format time only: "23:30"
 */
export function formatTime(isoString: string): string {
  try {
    const date = parseISO(isoString);
    if (isNaN(date.getTime())) return '';
    return format(date, 'HH:mm');
  } catch {
    return '';
  }
}

/**
 * Format date only: "28/10/2026"
 */
export function formatDate(isoString: string): string {
  try {
    const date = parseISO(isoString);
    if (isNaN(date.getTime())) return '';
    return format(date, 'dd/MM/yyyy');
  } catch {
    return '';
  }
}

/**
 * Human-friendly due date label with Vietnamese localization
 * e.g. "Hôm nay 23:30", "Ngày mai 17:00", "Hôm qua", "28/10/2026"
 */
export function getRelativeDueLabel(isoString: string, referenceDate: Date = new Date()): string {
  try {
    const date = parseISO(isoString);
    if (isNaN(date.getTime())) return isoString;

    const timeStr = format(date, 'HH:mm');

    if (isToday(date)) {
      return `Hôm nay, ${timeStr}`;
    }
    if (isTomorrow(date)) {
      return `Ngày mai, ${timeStr}`;
    }
    if (isYesterday(date)) {
      return `Hôm qua, ${timeStr}`;
    }

    return `${format(date, 'dd/MM/yyyy')}, ${timeStr}`;
  } catch {
    return isoString;
  }
}

/**
 * Check if a date falls strictly within "Today" in local timezone
 */
export function checkIsDueToday(isoString: string, referenceDate: Date = new Date()): boolean {
  try {
    const date = parseISO(isoString);
    const start = startOfDay(referenceDate);
    const end = endOfDay(referenceDate);
    return date >= start && date <= end;
  } catch {
    return false;
  }
}

/**
 * Check if a date falls strictly within "Tomorrow" in local timezone
 */
export function checkIsDueTomorrow(isoString: string, referenceDate: Date = new Date()): boolean {
  try {
    const date = parseISO(isoString);
    const tomorrow = addDays(referenceDate, 1);
    const start = startOfDay(tomorrow);
    const end = endOfDay(tomorrow);
    return date >= start && date <= end;
  } catch {
    return false;
  }
}

/**
 * Check if a date is within the next 48 hours from referenceDate
 * Must not be in the past, and diff must be <= 48 hours
 */
export function checkIsDueWithin48Hours(isoString: string, referenceDate: Date = new Date()): boolean {
  try {
    const date = parseISO(isoString);
    if (isNaN(date.getTime())) return false;
    const diffMs = date.getTime() - referenceDate.getTime();
    const fortyEightHoursMs = 48 * 60 * 60 * 1000;
    return diffMs > 0 && diffMs <= fortyEightHoursMs;
  } catch {
    return false;
  }
}

/**
 * Check if assignment is overdue (dueAt is strictly before referenceDate)
 */
export function checkIsOverdue(isoString: string, referenceDate: Date = new Date()): boolean {
  try {
    const date = parseISO(isoString);
    if (isNaN(date.getTime())) return false;
    return isBefore(date, referenceDate);
  } catch {
    return false;
  }
}

/**
 * Check if two dates are on the same calendar day
 */
export function isSameCalendarDay(date1: Date | string, date2: Date | string): boolean {
  try {
    const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
    const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
    return dateFnsIsSameDay(d1, d2);
  } catch {
    return false;
  }
}

export interface DayInfo {
  date: Date;
  dateString: string; // "2026-10-28"
  dayOfWeek: string;  // "T2", "T3", "T4", "T5", "T6", "T7", "CN"
  dayOfMonth: number; // 28
  isToday: boolean;
  isPast: boolean;
}

const VN_DAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

/**
 * Returns array of 7 days for the week containing baseDate
 * Week starts on Monday (Vietnamese standard school week)
 */
export function getWeekDays(baseDate: Date = new Date()): DayInfo[] {
  const start = startOfWeek(baseDate, { weekStartsOn: 1 }); // Monday = 1
  const days = eachDayOfInterval({ start, end: addDays(start, 6) });
  const today = startOfDay(new Date());

  return days.map((d) => ({
    date: d,
    dateString: format(d, 'yyyy-MM-dd'),
    dayOfWeek: VN_DAY_NAMES[d.getDay()],
    dayOfMonth: d.getDate(),
    isToday: dateFnsIsSameDay(d, today),
    isPast: isBefore(d, today),
  }));
}
