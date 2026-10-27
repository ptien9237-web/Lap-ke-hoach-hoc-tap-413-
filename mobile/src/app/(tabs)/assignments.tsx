import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAssignments } from '../../hooks/useAssignments';
import { useCourses } from '../../hooks/useCourses';
import { useActiveTheme } from '../../stores/themeStore';
import {
  useCourseIdFilter,
  useStatusFilter,
  useSortByFilter,
} from '../../stores/filterStore';
import { AssignmentCard } from '../../components/assignments/AssignmentCard';
import { AssignmentFilter } from '../../components/assignments/AssignmentFilter';
import { StateView } from '../../components/common/StateView';
import { OfflineBanner } from '../../components/common/OfflineBanner';
import { Spacing, Typography, BorderRadius } from '../../constants/theme';

export default function AssignmentsScreen() {
  const router = useRouter();
  const { theme } = useActiveTheme();

  const selectedCourseId = useCourseIdFilter();
  const selectedStatus = useStatusFilter();
  const selectedSortBy = useSortByFilter();

  const [search, setSearch] = useState('');

  const { courses } = useCourses();
  const {
    assignments,
    isLoading,
    isError,
    error,
    refetch,
    toggleAssignment,
  } = useAssignments({
    courseId: selectedCourseId,
    status: selectedStatus,
    sort: selectedSortBy,
    search,
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <OfflineBanner />

      {/* Screen Title & Search */}
      <View style={styles.topBar}>
        <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Danh sách bài tập</Text>

        <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="search" size={18} color={theme.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Tìm theo tên bài tập, ghi chú..."
            placeholderTextColor={theme.textTertiary}
            value={search}
            onChangeText={setSearch}
            accessibilityLabel="Ô tìm kiếm bài tập"
            clearButtonMode="while-editing"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')} accessibilityRole="button" accessibilityLabel="Xóa tìm kiếm">
              <Ionicons name="close-circle" size={18} color={theme.textTertiary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter Bar */}
      <AssignmentFilter courses={courses} />

      {/* Assignment List */}
      <StateView
        isLoading={isLoading && assignments.length === 0}
        isError={isError && assignments.length === 0}
        error={error as Error}
        isEmpty={!isLoading && assignments.length === 0}
        emptyTitle="Không có bài tập nào"
        emptyMessage={
          search
            ? 'Không tìm thấy bài tập nào khớp với từ khóa tìm kiếm.'
            : selectedCourseId !== 'all' || selectedStatus !== 'all'
            ? 'Không có bài tập nào thỏa mãn bộ lọc hiện tại.'
            : 'Bạn chưa có bài tập nào. Hãy bắt đầu bằng cách thêm bài tập mới!'
        }
        emptyActionLabel="Thêm bài tập mới"
        onEmptyAction={() => router.push('/(modal)/assignment-form')}
        onRetry={() => refetch()}
      >
        <FlatList
          data={assignments}
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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  screenTitle: {
    ...Typography.title1,
    marginBottom: Spacing.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1.2,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
  },
  searchIcon: {
    marginRight: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    paddingVertical: Spacing.xs,
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
