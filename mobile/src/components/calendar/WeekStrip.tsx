import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useActiveTheme } from '../../stores/themeStore';
import { DayInfo, isSameCalendarDay } from '../../utils/dateUtils';
import { Assignment } from '../../types/assignment';
import { Spacing, Typography, BorderRadius } from '../../constants/theme';

interface WeekStripProps {
  days: DayInfo[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onGoToToday: () => void;
  assignments: Assignment[];
}

export function WeekStrip({
  days,
  selectedDate,
  onSelectDate,
  onPrevWeek,
  onNextWeek,
  onGoToToday,
  assignments,
}: WeekStripProps) {
  const { theme } = useActiveTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
      {/* Header with week navigation */}
      <View style={styles.headerRow}>
        <View style={styles.weekTitleRow}>
          <Ionicons name="calendar" size={18} color={theme.primary} style={styles.calendarIcon} />
          <Text style={[styles.weekTitle, { color: theme.textPrimary }]}>
            {days.length > 0
              ? `${days[0].dayOfMonth}/${days[0].date.getMonth() + 1} - ${
                  days[6].dayOfMonth
                }/${days[6].date.getMonth() + 1}/${days[6].date.getFullYear()}`
              : ''}
          </Text>
        </View>

        <View style={styles.navigationButtons}>
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: theme.surfaceSubtle }]}
            onPress={onPrevWeek}
            accessibilityRole="button"
            accessibilityLabel="Tuần trước"
          >
            <Ionicons name="chevron-back" size={18} color={theme.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.todayButton, { backgroundColor: theme.primaryLight }]}
            onPress={onGoToToday}
            accessibilityRole="button"
            accessibilityLabel="Trở về hôm nay"
          >
            <Text style={[styles.todayButtonText, { color: theme.primary }]}>Hôm nay</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: theme.surfaceSubtle }]}
            onPress={onNextWeek}
            accessibilityRole="button"
            accessibilityLabel="Tuần sau"
          >
            <Ionicons name="chevron-forward" size={18} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 7 Days Strip */}
      <View style={styles.daysRow}>
        {days.map((day) => {
          const isSelected = isSameCalendarDay(day.date, selectedDate);
          // Check how many assignments due on this day
          const dayAssignments = assignments.filter((a) =>
            isSameCalendarDay(a.dueAt, day.date)
          );
          const pendingCount = dayAssignments.filter((a) => a.status === 'pending').length;

          return (
            <TouchableOpacity
              key={day.dateString}
              style={[
                styles.dayCell,
                {
                  backgroundColor: isSelected
                    ? theme.primary
                    : day.isToday
                    ? theme.primaryLight
                    : 'transparent',
                },
              ]}
              onPress={() => onSelectDate(day.date)}
              accessibilityRole="button"
              accessibilityLabel={`${day.dayOfWeek}, ngày ${day.dayOfMonth}. Có ${dayAssignments.length} bài tập.`}
              accessibilityState={{ selected: isSelected }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dayOfWeekText,
                  {
                    color: isSelected
                      ? theme.primaryText
                      : day.isToday
                      ? theme.primary
                      : theme.textTertiary,
                  },
                ]}
              >
                {day.dayOfWeek}
              </Text>

              <Text
                style={[
                  styles.dayOfMonthText,
                  {
                    color: isSelected
                      ? theme.primaryText
                      : day.isToday
                      ? theme.primary
                      : theme.textPrimary,
                    fontWeight: isSelected || day.isToday ? '700' : '500',
                  },
                ]}
              >
                {day.dayOfMonth}
              </Text>

              {/* Due assignment indicator dot */}
              <View style={styles.indicatorContainer}>
                {pendingCount > 0 ? (
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: isSelected ? theme.primaryText : theme.error,
                      },
                    ]}
                  />
                ) : dayAssignments.length > 0 ? (
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: isSelected ? theme.primaryText : theme.success,
                      },
                    ]}
                  />
                ) : (
                  <View style={styles.dotPlaceholder} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  weekTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarIcon: {
    marginRight: Spacing.xs,
  },
  weekTitle: {
    ...Typography.headline,
  },
  navigationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayButton: {
    paddingHorizontal: Spacing.sm,
    height: 34,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
  },
  todayButtonText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCell: {
    flex: 1,
    minHeight: 58,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    marginHorizontal: 2,
  },
  dayOfWeekText: {
    ...Typography.caption,
    fontWeight: '600',
    marginBottom: 2,
  },
  dayOfMonthText: {
    ...Typography.title2,
    lineHeight: 22,
  },
  indicatorContainer: {
    height: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: BorderRadius.full,
  },
  dotPlaceholder: {
    width: 5,
    height: 5,
  },
});
