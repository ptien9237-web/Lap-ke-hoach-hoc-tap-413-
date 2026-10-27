import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { addWeeks, subWeeks } from 'date-fns';
import { useAssignments } from '../../hooks/useAssignments';
import { useCourses } from '../../hooks/useCourses';
import { useActiveTheme } from '../../stores/themeStore';
import {
  useCourseIdFilter,
  useStatusFilter,
} from '../../stores/filterStore';
import { WeekStrip } from '../../components/calendar/WeekStrip';
import { AssignmentFilter } from '../../components/assignments/AssignmentFilter';
import { AssignmentCard } from '../../components/assignments/AssignmentCard';
import { StateView } from '../../components/common/StateView';
import { OfflineBanner } from '../../components/common/OfflineBanner';
import {
  getWeekDays,
  isSameCalendarDay,
  formatDate,
} from '../../utils/dateUtils';
import { Spacing, Typography, BorderRadius, Colors } from '../../constants/theme';

export default function CalendarScreen() {
  const router = useRouter();
  const { theme } = useActiveTheme();

  const [currentWeekDate, setCurrentWeekDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  const selectedCourseId = useCourseIdFilter();
  const selectedStatus = useStatusFilter();

  const { courses } = useCourses();
  const {
    allAssignments,
    isLoading,
    isError,
    error,
    refetch,
    toggleAssignment,
  } = useAssignments({
    courseId: selectedCourseId,
    status: selectedStatus,
  });

  const weekDays = getWeekDays(currentWeekDate);

  // Filter assignments based on viewMode (single day vs full week)
  const displayedAssignments = allAssignments.filter((a) => {
    // Check course & status filters
    if (selectedCourseId !== 'all' && a.courseId !== selectedCourseId) return false;
    if (selectedStatus !== 'all' && a.status !== selectedStatus) return false;

    if (viewMode === 'day') {
      return isSameCalendarDay(a.dueAt, selectedDate);
    } else {
      // Must be within current 7 weekDays
      return weekDays.some((d) => isSameCalendarDay(a.dueAt, d.date));
    }
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <OfflineBanner />

      {/* Top Header */}
      <View style={styles.topBar}>
        <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Lịch tuần học tập</Text>

        {/* View mode toggle: 'Theo ngày' vs 'Cả tuần' */}
        <View style={[styles.viewModeToggle, { backgroundColor: theme.surfaceSubtle }]}>
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              viewMode === 'day' && [styles.viewModeButtonActive, { backgroundColor: theme.surface }],
            ]}
            onPress={() => setViewMode('day')}
            accessibilityRole="button"
            accessibilityLabel="Xem theo ngày đã chọn"
          >
            <Text
              style={[
                styles.viewModeText,
                { color: viewMode === 'day' ? theme.primary : theme.textSecondary },
              ]}
            >
              Theo ngày
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.viewModeButton,
              viewMode === 'week' && [styles.viewModeButtonActive, { backgroundColor: theme.surface }],
            ]}
            onPress={() => setViewMode('week')}
            accessibilityRole="button"
            accessibilityLabel="Xem toàn bộ tuần"
          >
            <Text
              style={[
                styles.viewModeText,
                { color: viewMode === 'week' ? theme.primary : theme.textSecondary },
              ]}
            >
              Cả tuần
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Interactive Monday-Sunday Week Strip */}
      <WeekStrip
        days={weekDays}
        selectedDate={selectedDate}
        onSelectDate={(date) => {
          setSelectedDate(date);
          setViewMode('day');
        }}
        onPrevWeek={() => setCurrentWeekDate((prev) => subWeeks(prev, 1))}
        onNextWeek={() => setCurrentWeekDate((prev) => addWeeks(prev, 1))}
        onGoToToday={() => {
          const now = new Date();
          setCurrentWeekDate(now);
          setSelectedDate(now);
        }}
        assignments={allAssignments}
      />

      {/* Consistent Course & Status Filter Bar */}
      <AssignmentFilter courses={courses} />

      {/* Subheader: Selected Day or Week summary */}
      <View style={styles.summaryBar}>
        <Text style={[styles.summaryText, { color: theme.textSecondary }]}>
          {viewMode === 'day'
            ? `Bài tập ngày ${formatDate(selectedDate.toISOString())} (${displayedAssignments.length})`
            : `Toàn bộ bài tập trong tuần (${displayedAssignments.length})`}
        </Text>
      </View>

      {/* List of assignments for selected day/week */}
      <StateView
        isLoading={isLoading && allAssignments.length === 0}
        isError={isError && allAssignments.length === 0}
        error={error as Error}
        isEmpty={!isLoading && displayedAssignments.length === 0}
        emptyTitle={viewMode === 'day' ? 'Không có bài tập trong ngày' : 'Không có bài tập trong tuần'}
        emptyMessage={
          viewMode === 'day'
            ? `Ngày ${formatDate(selectedDate.toISOString())} chưa có bài tập nào đến hạn.`
            : 'Tuần này không có bài tập nào thỏa mãn bộ lọc hiện tại.'
        }
        emptyActionLabel="Thêm bài tập mới"
        onEmptyAction={() => router.push('/(modal)/assignment-form')}
        onRetry={() => refetch()}
      >
        <FlatList
          data={displayedAssignments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => { void refetch(); }}
              tintColor={theme.primary}
            />
          }
          renderItem={({ item }) => (
            <AssignmentCard
              assignment={item}
              onPress={() => router.push(`/assignment/${item.id}`)}
              onToggleStatus={() => toggleAssignment(item.id)}
            />
          )}
        />
      </StateView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary, shadowColor: theme.shadow }]}
        onPress={() => router.push('/(modal)/assignment-form')}
        accessibilityRole="button"
        accessibilityLabel="Tạo bài tập mới"
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={theme.primaryText} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  screenTitle: {
    ...Typography.title1,
  },
  viewModeToggle: {
    flexDirection: 'row',
    borderRadius: BorderRadius.sm,
    padding: 2,
  },
  viewModeButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  viewModeButtonActive: {
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  viewModeText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  summaryBar: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xs,
  },
  summaryText: {
    ...Typography.footnote,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});
