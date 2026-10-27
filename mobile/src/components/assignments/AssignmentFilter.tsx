import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Course } from '../../types/course';
import { useActiveTheme } from '../../stores/themeStore';
import {
  useFilterStore,
  useCourseIdFilter,
  useStatusFilter,
  useSortByFilter,
  useIsAnyFilterActive,
} from '../../stores/filterStore';
import { resolveCourseColour, Spacing, Typography, BorderRadius } from '../../constants/theme';

interface AssignmentFilterProps {
  courses: Course[];
}

export function AssignmentFilter({ courses }: AssignmentFilterProps) {
  const { theme } = useActiveTheme();
  const selectedCourseId = useCourseIdFilter();
  const selectedStatus = useStatusFilter();
  const selectedSortBy = useSortByFilter();
  const isAnyFilterActive = useIsAnyFilterActive();

  const setCourseId = useFilterStore((s) => s.setCourseId);
  const setStatus = useFilterStore((s) => s.setStatus);
  const setSortBy = useFilterStore((s) => s.setSortBy);
  const resetFilters = useFilterStore((s) => s.resetFilters);

  return (
    <View style={styles.container}>
      {/* Course filter horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.coursesScroll}
      >
        {/* All courses chip */}
        <TouchableOpacity
          style={[
            styles.courseChip,
            {
              backgroundColor: selectedCourseId === 'all' ? theme.primary : theme.surfaceSubtle,
              borderColor: selectedCourseId === 'all' ? theme.primary : theme.border,
            },
          ]}
          onPress={() => setCourseId('all')}
          accessibilityRole="button"
          accessibilityLabel="Tất cả học phần"
          accessibilityState={{ selected: selectedCourseId === 'all' }}
        >
          <Text
            style={[
              styles.chipText,
              { color: selectedCourseId === 'all' ? theme.primaryText : theme.textPrimary },
            ]}
          >
            Tất cả HP
          </Text>
        </TouchableOpacity>

        {courses.map((course) => {
          const isSelected = selectedCourseId === course.id;
          const palette = resolveCourseColour(course.colour, theme);

          return (
            <TouchableOpacity
              key={course.id}
              style={[
                styles.courseChip,
                {
                  backgroundColor: isSelected ? palette.text : palette.bg,
                  borderColor: isSelected ? palette.text : theme.border,
                },
              ]}
              onPress={() => setCourseId(isSelected ? 'all' : course.id)}
              accessibilityRole="button"
              accessibilityLabel={`Lọc theo học phần ${course.code}`}
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: isSelected ? theme.textInverse : palette.text },
                ]}
              >
                {course.code}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Status Segmented Bar + Sort Toggle */}
      <View style={styles.secondaryControlsRow}>
        <View style={[styles.statusSegment, { backgroundColor: theme.surfaceSubtle }]}>
          {(['all', 'pending', 'completed'] as const).map((st) => {
            const isSelected = selectedStatus === st;
            const label = st === 'all' ? 'Tất cả' : st === 'pending' ? 'Chưa xong' : 'Đã xong';

            return (
              <TouchableOpacity
                key={st}
                style={[
                  styles.segmentOption,
                  isSelected && [
                    styles.segmentOptionActive,
                    { backgroundColor: theme.surface, shadowColor: theme.shadow },
                  ],
                ]}
                onPress={() => setStatus(st)}
                accessibilityRole="button"
                accessibilityLabel={`Lọc trạng thái ${label}`}
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={[
                    styles.segmentText,
                    {
                      color: isSelected ? theme.primary : theme.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Sort & Reset Buttons */}
        <View style={styles.actionButtonsGroup}>
          <TouchableOpacity
            style={[
              styles.iconActionButton,
              {
                backgroundColor: theme.surfaceSubtle,
                borderColor: selectedSortBy !== 'dueAsc' ? theme.primary : theme.border,
              },
            ]}
            onPress={() => {
              if (selectedSortBy === 'dueAsc') setSortBy('dueDesc');
              else if (selectedSortBy === 'dueDesc') setSortBy('createdDesc');
              else setSortBy('dueAsc');
            }}
            accessibilityRole="button"
            accessibilityLabel={`Sắp xếp: ${
              selectedSortBy === 'dueAsc'
                ? 'Hạn nộp gần nhất'
                : selectedSortBy === 'dueDesc'
                ? 'Hạn nộp xa nhất'
                : 'Mới tạo nhất'
            }`}
          >
            <Ionicons
              name={selectedSortBy === 'createdDesc' ? 'time-outline' : 'swap-vertical'}
              size={18}
              color={selectedSortBy !== 'dueAsc' ? theme.primary : theme.textSecondary}
            />
          </TouchableOpacity>

          {isAnyFilterActive && (
            <TouchableOpacity
              style={[styles.iconActionButton, { backgroundColor: theme.errorBg, borderColor: theme.error }]}
              onPress={resetFilters}
              accessibilityRole="button"
              accessibilityLabel="Xóa toàn bộ bộ lọc"
            >
              <Ionicons name="close" size={18} color={theme.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  coursesScroll: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  courseChip: {
    minHeight: 38,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  chipText: {
    ...Typography.footnote,
    fontWeight: '600',
  },
  secondaryControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
  statusSegment: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    padding: 3,
    marginRight: Spacing.md,
  },
  segmentOption: {
    flex: 1,
    minHeight: 36,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentOptionActive: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    ...Typography.caption,
  },
  actionButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconActionButton: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.xs,
  },
});
