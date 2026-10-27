import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CourseProgressStat } from '../../types/stats';
import { CourseBadge } from '../common/CourseBadge';
import { useActiveTheme } from '../../stores/themeStore';
import { resolveCourseColour, Spacing, Typography, BorderRadius, Colors } from '../../constants/theme';

interface CourseProgressCardProps {
  stat: CourseProgressStat;
}

export function CourseProgressCard({ stat }: CourseProgressCardProps) {
  const { theme } = useActiveTheme();
  const palette = resolveCourseColour(stat.courseColour, theme);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}
      accessibilityRole="summary"
      accessibilityLabel={`Học phần ${stat.courseCode}: ${stat.completed} hoàn thành, ${stat.pending} chưa xong. Tỉ lệ ${stat.completionRate}%.`}
    >
      <View style={styles.headerRow}>
        <CourseBadge
          code={stat.courseCode}
          name={stat.courseName}
          colour={stat.courseColour}
          size="medium"
        />
        <View style={[styles.rateBadge, { backgroundColor: palette.bg }]}>
          <Text style={[styles.rateText, { color: palette.text }]}>
            {stat.completionRate}%
          </Text>
        </View>
      </View>

      <Text style={[styles.courseNameText, { color: theme.textSecondary }]} numberOfLines={1}>
        {stat.courseName}
      </Text>

      {/* Progress Bar Track */}
      <View style={[styles.progressTrack, { backgroundColor: theme.surfaceSubtle }]}>
        <View
          style={[
            styles.progressBar,
            {
              backgroundColor: palette.text,
              width: `${Math.min(100, Math.max(0, stat.completionRate))}%`,
            },
          ]}
        />
      </View>

      {/* Detail Metrics */}
      <View style={[styles.metricsRow, { borderTopColor: theme.divider }]}>
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: theme.textTertiary }]}>Hoàn thành</Text>
          <Text style={[styles.metricValue, { color: theme.success }]}>{stat.completed}</Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: theme.textTertiary }]}>Chưa xong</Text>
          <Text style={[styles.metricValue, { color: stat.pending > 0 ? theme.warning : theme.textSecondary }]}>
            {stat.pending}
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: theme.textTertiary }]}>Tổng số bài</Text>
          <Text style={[styles.metricValue, { color: theme.textPrimary }]}>{stat.total}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1.2,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  courseNameText: {
    ...Typography.body,
    marginBottom: Spacing.md,
  },
  rateBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  rateText: {
    ...Typography.footnote,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  progressBar: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    ...Typography.caption,
    marginBottom: 2,
  },
  metricValue: {
    ...Typography.headline,
  },
});
