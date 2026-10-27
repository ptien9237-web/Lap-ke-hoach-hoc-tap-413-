import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCurrentUser, useAuthStore } from '../../stores/authStore';
import { useActiveTheme, useThemeStore } from '../../stores/themeStore';
import { useAssignments } from '../../hooks/useAssignments';
import { useProgressStats } from '../../hooks/useProgressStats';
import { StateView } from '../../components/common/StateView';
import { AssignmentCard } from '../../components/assignments/AssignmentCard';
import { OfflineBanner } from '../../components/common/OfflineBanner';
import { checkIsDueToday, checkIsDueWithin48Hours } from '../../utils/dateUtils';
import { Spacing, Typography, BorderRadius, Colors } from '../../constants/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const user = useCurrentUser();
  const { theme, isDark } = useActiveTheme();
  const setThemeMode = useThemeStore((s) => s.setThemeMode);
  const logout = useAuthStore((s) => s.logout);

  const {
    allAssignments,
    isLoading: isAssignmentsLoading,
    isError: isAssignmentsError,
    error: assignmentsError,
    refetch: refetchAssignments,
    toggleAssignment,
  } = useAssignments();

  const {
    overview,
    isLoading: isStatsLoading,
    refetch: refetchStats,
  } = useProgressStats();

  const isLoading = isAssignmentsLoading || isStatsLoading;
  const isRefreshing = false;

  const handleRefresh = async () => {
    await Promise.all([refetchAssignments(), refetchStats()]);
  };

  // Filter urgent assignments
  const dueTodayAssignments = allAssignments.filter(
    (a) => a.status === 'pending' && checkIsDueToday(a.dueAt)
  );

  const due48hAssignments = allAssignments.filter(
    (a) => a.status === 'pending' && checkIsDueWithin48Hours(a.dueAt) && !checkIsDueToday(a.dueAt)
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <OfflineBanner />

      {/* Header Bar */}
      <View style={[styles.headerBar, { borderBottomColor: theme.border }]}>
        <View style={styles.userInfo}>
          <Text style={[styles.greetingText, { color: theme.textSecondary }]}>Xin chào,</Text>
          <Text style={[styles.userNameText, { color: theme.textPrimary }]} numberOfLines={1}>
            {user?.name || 'Sinh viên'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          {/* Theme Mode Toggle Button */}
          <TouchableOpacity
            style={[styles.headerIconButton, { backgroundColor: theme.surfaceSubtle }]}
            onPress={() => setThemeMode(isDark ? 'light' : 'dark')}
            accessibilityRole="button"
            accessibilityLabel={`Chuyển sang giao diện ${isDark ? 'sáng' : 'tối'}`}
          >
            <Ionicons
              name={isDark ? 'sunny-outline' : 'moon-outline'}
              size={20}
              color={isDark ? theme.warning : theme.textPrimary}
            />
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity
            style={[styles.headerIconButton, { backgroundColor: theme.surfaceSubtle }]}
            onPress={logout}
            accessibilityRole="button"
            accessibilityLabel="Đăng xuất khỏi ứng dụng"
          >
            <Ionicons name="log-out-outline" size={20} color={theme.error} />
          </TouchableOpacity>
        </View>
      </View>

      <StateView
        isLoading={isLoading && allAssignments.length === 0}
        isError={isAssignmentsError && allAssignments.length === 0}
        error={assignmentsError as Error}
        onRetry={handleRefresh}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.primary}
            />
          }
        >
          {/* Quick Metrics 2x2 Grid */}
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.metricIconWrap, { backgroundColor: theme.warningBg }]}>
                <Ionicons name="time" size={18} color={theme.warning} />
              </View>
              <Text style={[styles.metricValue, { color: theme.textPrimary }]}>{dueTodayAssignments.length}</Text>
              <Text style={[styles.metricTitle, { color: theme.textSecondary }]}>Hạn hôm nay</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.metricIconWrap, { backgroundColor: theme.infoBg }]}>
                <Ionicons name="alarm" size={18} color={theme.info} />
              </View>
              <Text style={[styles.metricValue, { color: theme.textPrimary }]}>{overview.dueSoonCount}</Text>
              <Text style={[styles.metricTitle, { color: theme.textSecondary }]}>Hạn 48 giờ tới</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.metricIconWrap, { backgroundColor: theme.successBg }]}>
                <Ionicons name="checkmark-done" size={18} color={theme.success} />
              </View>
              <Text style={[styles.metricValue, { color: theme.textPrimary }]}>{overview.completedAssignments}</Text>
              <Text style={[styles.metricTitle, { color: theme.textSecondary }]}>Đã hoàn thành</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.metricIconWrap, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name="pie-chart" size={18} color={theme.primary} />
              </View>
              <Text style={[styles.metricValue, { color: theme.textPrimary }]}>{overview.completionRate}%</Text>
              <Text style={[styles.metricTitle, { color: theme.textSecondary }]}>Tiến độ chung</Text>
            </View>
          </View>

          {/* Section: Due Today */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleGroup}>
              <Ionicons name="calendar-outline" size={20} color={theme.warning} style={styles.sectionIcon} />
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Hôm nay cần nộp</Text>
            </View>
            <Text style={[styles.badgeCount, { color: theme.warning, backgroundColor: theme.warningBg }]}>
              {dueTodayAssignments.length} bài
            </Text>
          </View>

          {dueTodayAssignments.length === 0 ? (
            <View style={[styles.emptySectionBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name="checkmark-circle-outline" size={28} color={theme.success} />
              <Text style={[styles.emptySectionText, { color: theme.textSecondary }]}>
                Tuyệt vời! Không có bài tập nào đến hạn hôm nay.
              </Text>
            </View>
          ) : (
            dueTodayAssignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                onPress={() => router.push(`/assignment/${assignment.id}`)}
                onToggleStatus={() => toggleAssignment(assignment.id)}
              />
            ))
          )}

          {/* Section: Due in Next 48 Hours */}
          <View style={[styles.sectionHeaderRow, { marginTop: Spacing.xl }]}>
            <View style={styles.sectionTitleGroup}>
              <Ionicons name="time-outline" size={20} color={theme.info} style={styles.sectionIcon} />
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Sắp đến hạn (48h tới)</Text>
            </View>
            <Text style={[styles.badgeCount, { color: theme.info, backgroundColor: theme.infoBg }]}>
              {due48hAssignments.length} bài
            </Text>
          </View>

          {due48hAssignments.length === 0 ? (
            <View style={[styles.emptySectionBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name="cafe-outline" size={28} color={theme.textTertiary} />
              <Text style={[styles.emptySectionText, { color: theme.textSecondary }]}>
                Không có bài tập nào cần gấp trong 48 giờ tới.
              </Text>
            </View>
          ) : (
            due48hAssignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                onPress={() => router.push(`/assignment/${assignment.id}`)}
                onToggleStatus={() => toggleAssignment(assignment.id)}
              />
            ))
          )}
        </ScrollView>
      </StateView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary, shadowColor: theme.shadow }]}
        onPress={() => router.push('/(modal)/assignment-form')}
        accessibilityRole="button"
        accessibilityLabel="Thêm bài tập mới"
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
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  userInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  greetingText: {
    ...Typography.caption,
  },
  userNameText: {
    ...Typography.title2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 80,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  metricCard: {
    width: '48%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1.2,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  metricIconWrap: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  metricValue: {
    ...Typography.title1,
  },
  metricTitle: {
    ...Typography.caption,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    marginRight: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.headline,
  },
  badgeCount: {
    ...Typography.caption,
    fontWeight: '700',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  emptySectionBox: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptySectionText: {
    ...Typography.body,
    marginTop: Spacing.xs,
    textAlign: 'center',
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
