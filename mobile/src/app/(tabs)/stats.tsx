import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useProgressStats } from '../../hooks/useProgressStats';
import { useActiveTheme } from '../../stores/themeStore';
import { CourseProgressCard } from '../../components/stats/CourseProgressCard';
import { StateView } from '../../components/common/StateView';
import { OfflineBanner } from '../../components/common/OfflineBanner';
import { Spacing, Typography, BorderRadius, Colors } from '../../constants/theme';

export default function StatsScreen() {
  const { theme } = useActiveTheme();
  const { overview, courses, isLoading, isError, error, refetch } = useProgressStats();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <OfflineBanner />

      <View style={styles.topBar}>
        <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Thống kê tiến độ</Text>
        <Text style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
          Theo dõi tiến độ hoàn thành bài tập theo từng học phần
        </Text>
      </View>

      <StateView
        isLoading={isLoading && courses.length === 0}
        isError={isError && courses.length === 0}
        error={error as Error}
        isEmpty={!isLoading && courses.length === 0}
        emptyTitle="Chưa có dữ liệu thống kê"
        emptyMessage="Hãy thêm học phần và bài tập để theo dõi tiến độ học tập của bạn."
        onRetry={() => refetch()}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => { void refetch(); }}
              tintColor={theme.primary}
            />
          }
        >
          {/* Overall Hero Banner */}
          <View
            style={[
              styles.heroBanner,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.heroTextContainer}>
              <Text style={[styles.heroHeading, { color: theme.textSecondary }]}>Tổng quan hoàn thành</Text>
              <Text style={[styles.heroRateText, { color: theme.primary }]}>
                {overview.completionRate}%
              </Text>
              <Text style={[styles.heroDetailText, { color: theme.textSecondary }]}>
                {overview.completedAssignments} / {overview.totalAssignments} bài tập đã hoàn thành
              </Text>
            </View>

            <View style={[styles.heroIconCircle, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="trophy" size={36} color={theme.primary} />
            </View>
          </View>

          {/* Quick Stats Summary Grid */}
          <View style={styles.summaryGrid}>
            <View style={[styles.summaryBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.summaryNumber, { color: theme.success }]}>
                {overview.completedAssignments}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Đã hoàn thành</Text>
            </View>

            <View style={[styles.summaryBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.summaryNumber, { color: overview.pendingAssignments > 0 ? theme.warning : theme.textSecondary }]}>
                {overview.pendingAssignments}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Chưa xong</Text>
            </View>

            <View style={[styles.summaryBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.summaryNumber, { color: theme.info }]}>
                {overview.dueSoonCount}
              </Text>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Hạn trong 48h</Text>
            </View>
          </View>

          {/* Per-Course Breakdown Header */}
          <View style={styles.breakdownHeader}>
            <Ionicons name="bar-chart-outline" size={20} color={theme.primary} style={styles.chartIcon} />
            <Text style={[styles.breakdownTitle, { color: theme.textPrimary }]}>
              Chi tiết theo từng học phần ({courses.length})
            </Text>
          </View>

          {/* Course Progress Cards */}
          {courses.map((courseStat) => (
            <CourseProgressCard key={courseStat.courseId} stat={courseStat} />
          ))}
        </ScrollView>
      </StateView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  screenTitle: {
    ...Typography.title1,
  },
  screenSubtitle: {
    ...Typography.footnote,
    marginTop: 2,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  heroBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.2,
    marginBottom: Spacing.md,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  heroTextContainer: {
    flex: 1,
  },
  heroHeading: {
    ...Typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heroRateText: {
    ...Typography.display,
    fontSize: 40,
    lineHeight: 46,
    marginVertical: 4,
  },
  heroDetailText: {
    ...Typography.footnote,
  },
  heroIconCircle: {
    width: 68,
    height: 68,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  summaryBox: {
    flex: 1,
    borderRadius: BorderRadius.md,
    borderWidth: 1.2,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  summaryNumber: {
    ...Typography.title1,
  },
  summaryLabel: {
    ...Typography.caption,
    marginTop: 2,
    textAlign: 'center',
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  chartIcon: {
    marginRight: Spacing.xs,
  },
  breakdownTitle: {
    ...Typography.headline,
  },
});
