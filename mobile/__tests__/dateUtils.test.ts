import { describe, it, expect } from 'vitest';
import {
  checkIsDueToday,
  checkIsDueTomorrow,
  checkIsDueWithin48Hours,
  checkIsOverdue,
  isSameCalendarDay,
  formatDateTime,
  formatDate,
  formatTime,
  getRelativeDueLabel,
  getWeekDays,
} from '../src/utils/dateUtils';

describe('Date & Timezone Utilities (Requirement 7 & 10)', () => {
  // Reference fixed point in time: 2026-10-28 14:00:00 local time
  const baseTime = new Date('2026-10-28T14:00:00');

  describe('Midnight Boundary Edge Cases (23:30 vs 00:01)', () => {
    it('should correctly identify 23:30 today as due today and NOT overdue', () => {
      const lateToday = '2026-10-28T23:30:00';
      expect(checkIsDueToday(lateToday, baseTime)).toBe(true);
      expect(checkIsDueTomorrow(lateToday, baseTime)).toBe(false);
      expect(checkIsOverdue(lateToday, baseTime)).toBe(false);
      expect(checkIsDueWithin48Hours(lateToday, baseTime)).toBe(true);
    });

    it('should correctly identify 00:05 tomorrow as due tomorrow across midnight boundary', () => {
      const justAfterMidnight = '2026-10-29T00:05:00';
      expect(checkIsDueToday(justAfterMidnight, baseTime)).toBe(false);
      expect(checkIsDueTomorrow(justAfterMidnight, baseTime)).toBe(true);
      expect(checkIsOverdue(justAfterMidnight, baseTime)).toBe(false);
      expect(checkIsDueWithin48Hours(justAfterMidnight, baseTime)).toBe(true);
    });

    it('should correctly identify yesterday 23:59 as overdue and not due today', () => {
      const yesterdayLate = '2026-10-27T23:59:00';
      expect(checkIsDueToday(yesterdayLate, baseTime)).toBe(false);
      expect(checkIsOverdue(yesterdayLate, baseTime)).toBe(true);
      expect(checkIsDueWithin48Hours(yesterdayLate, baseTime)).toBe(false);
    });

    it('should accurately handle reference time at 23:45 looking at tomorrow 00:15', () => {
      const lateNightRef = new Date('2026-10-28T23:45:00');
      const earlyMorningNextDay = '2026-10-29T00:15:00'; // 30 minutes later

      expect(checkIsDueToday(earlyMorningNextDay, lateNightRef)).toBe(false);
      expect(checkIsDueTomorrow(earlyMorningNextDay, lateNightRef)).toBe(true);
      expect(checkIsDueWithin48Hours(earlyMorningNextDay, lateNightRef)).toBe(true);
      expect(checkIsOverdue(earlyMorningNextDay, lateNightRef)).toBe(false);
    });
  });

  describe('Next 48 Hours Calculation', () => {
    it('should return true for deadline exactly 40 hours ahead', () => {
      const in40h = new Date(baseTime.getTime() + 40 * 60 * 60 * 1000).toISOString();
      expect(checkIsDueWithin48Hours(in40h, baseTime)).toBe(true);
    });

    it('should return false for deadline 50 hours ahead', () => {
      const in50h = new Date(baseTime.getTime() + 50 * 60 * 60 * 1000).toISOString();
      expect(checkIsDueWithin48Hours(in50h, baseTime)).toBe(false);
    });

    it('should return false for deadline in the past', () => {
      const past = new Date(baseTime.getTime() - 2 * 60 * 60 * 1000).toISOString();
      expect(checkIsDueWithin48Hours(past, baseTime)).toBe(false);
    });
  });

  describe('Calendar Day Matching', () => {
    it('should return true for same day different times', () => {
      expect(isSameCalendarDay('2026-10-28T08:00:00', '2026-10-28T23:59:00')).toBe(true);
    });

    it('should return false for consecutive days', () => {
      expect(isSameCalendarDay('2026-10-28T23:59:00', '2026-10-29T00:01:00')).toBe(false);
    });
  });

  describe('Vietnamese Relative Date Labels', () => {
    it('should format today label correctly with time', () => {
      const todayIso = new Date();
      todayIso.setHours(20, 30, 0, 0);
      const label = getRelativeDueLabel(todayIso.toISOString());
      expect(label).toContain('Hôm nay');
      expect(label).toContain('20:30');
    });

    it('should format tomorrow label correctly', () => {
      const tomorrowIso = new Date(Date.now() + 24 * 60 * 60 * 1000);
      tomorrowIso.setHours(15, 0, 0, 0);
      const label = getRelativeDueLabel(tomorrowIso.toISOString());
      expect(label).toContain('Ngày mai');
      expect(label).toContain('15:00');
    });
  });

  describe('Monday-start School Week Generator', () => {
    it('should generate 7 days starting from Monday', () => {
      const week = getWeekDays(new Date('2026-10-28')); // Wednesday
      expect(week.length).toBe(7);
      expect(week[0].dayOfWeek).toBe('T2'); // Monday
      expect(week[6].dayOfWeek).toBe('CN'); // Sunday
    });
  });
});
