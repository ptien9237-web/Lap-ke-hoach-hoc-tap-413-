import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAssignments, useAssignment } from '../../hooks/useAssignments';
import { useActiveTheme } from '../../stores/themeStore';
import { CourseBadge } from '../../components/common/CourseBadge';
import { StateView } from '../../components/common/StateView';
import { AppButton } from '../../components/common/AppButton';
import { OfflineBanner } from '../../components/common/OfflineBanner';
import {
  formatDateTime,
  getRelativeDueLabel,
  checkIsOverdue,
} from '../../utils/dateUtils';
import { confirmAction } from '../../utils/confirmDialog';
import { Spacing, Typography, BorderRadius, Colors } from '../../constants/theme';

export default function AssignmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useActiveTheme();

  const {
    data: assignment,
    isLoading,
    isError,
    error,
    refetch,
  } = useAssignment(id);

  const { toggleAssignment, deleteAssignment } = useAssignments();

  const handleToggle = async () => {
    if (!assignment) return;
    try {
      await toggleAssignment(assignment.id);
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể đổi trạng thái bài tập.');
    }
  };

  const handleDelete = () => {
    if (!assignment) return;
    confirmAction({
      title: 'Xóa bài tập',
      message: `Bạn có chắc chắn muốn xóa bài tập "${assignment.title}"? Thao tác này không thể hoàn tác.`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteAssignment(assignment.id);
          router.back();
        } catch (err: any) {
          Alert.alert('Lỗi', err.message || 'Không thể xóa bài tập.');
        }
      },
    });
  };

  const isCompleted = assignment?.status === 'completed';
  const isOverdue = !isCompleted && assignment ? checkIsOverdue(assignment.dueAt) : false;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <OfflineBanner />

      {/* Header Bar */}
      <View style={[styles.headerBar, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
        >
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.textPrimary }]} numberOfLines={1}>
          Chi tiết bài tập
        </Text>

        <View style={styles.headerRightActions}>
          {assignment && (
            <>
              <TouchableOpacity
                style={[styles.headerActionBtn, { backgroundColor: theme.surfaceSubtle }]}
                onPress={() => router.push(`/(modal)/assignment-form?id=${assignment.id}`)}
                accessibilityRole="button"
                accessibilityLabel="Chỉnh sửa bài tập"
              >
                <Ionicons name="pencil" size={18} color={theme.textPrimary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.headerActionBtn, { backgroundColor: theme.errorBg }]}
                onPress={handleDelete}
                accessibilityRole="button"
                accessibilityLabel="Xóa bài tập"
              >
                <Ionicons name="trash-outline" size={18} color={theme.error} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <StateView
        isLoading={isLoading && !assignment}
        isError={isError && !assignment}
        error={error as Error}
        isEmpty={!isLoading && !isError && !assignment}
        emptyTitle="Không tìm thấy bài tập"
        emptyMessage="Bài tập này có thể đã bị xóa hoặc không thuộc quyền truy cập của bạn."
        emptyActionLabel="Trở về danh sách"
        onEmptyAction={() => router.replace('/(tabs)/assignments')}
        onRetry={() => refetch()}
      >
        {assignment ? (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Course Badge */}
            {assignment.courseCode ? (
              <View style={styles.courseBadgeRow}>
                <CourseBadge
                  code={assignment.courseCode}
                  name={assignment.courseName}
                  colour={assignment.courseColour || 'courseBlue'}
                  size="medium"
                />
              </View>
            ) : null}

            {/* Assignment Title */}
            <Text style={[styles.title, { color: theme.textPrimary }]}>{assignment.title}</Text>

            {/* Status & Deadline Banner Card */}
            <View
              style={[
                styles.statusCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: isCompleted ? theme.success : isOverdue ? theme.error : theme.border,
                },
              ]}
            >
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusIndicatorCircle,
                    { backgroundColor: isCompleted ? theme.successBg : isOverdue ? theme.errorBg : theme.infoBg },
                  ]}
                >
                  <Ionicons
                    name={isCompleted ? 'checkmark-circle' : isOverdue ? 'alert-circle' : 'time'}
                    size={24}
                    color={isCompleted ? theme.success : isOverdue ? theme.error : theme.info}
                  />
                </View>

                <View style={styles.statusDetails}>
                  <Text style={[styles.statusTitle, { color: isCompleted ? theme.success : isOverdue ? theme.error : theme.textPrimary }]}>
                    {isCompleted ? 'Đã hoàn thành' : isOverdue ? 'Đã quá hạn nộp' : 'Đang thực hiện'}
                  </Text>
                  <Text style={[styles.dueTimeText, { color: theme.textSecondary }]}>
                    Hạn: {formatDateTime(assignment.dueAt)} ({getRelativeDueLabel(assignment.dueAt)})
                  </Text>
                </View>
              </View>

              <AppButton
                title={isCompleted ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành'}
                onPress={handleToggle}
                variant={isCompleted ? 'outline' : 'primary'}
                style={styles.toggleButton}
                icon={
                  <Ionicons
                    name={isCompleted ? 'arrow-undo' : 'checkmark'}
                    size={18}
                    color={isCompleted ? theme.primary : theme.primaryText}
                    style={{ marginRight: 6 }}
                  />
                }
              />
            </View>

            {/* Notes Section */}
            {assignment.notes ? (
              <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="document-text-outline" size={18} color={theme.primary} style={styles.sectionIcon} />
                  <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>Ghi chú chi tiết</Text>
                </View>
                <Text style={[styles.notesText, { color: theme.textSecondary }]}>{assignment.notes}</Text>
              </View>
            ) : null}

            {/* Attached Photo Section (Whiteboard / Handwritten Note) */}
            {assignment.photoUri ? (
              <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="image-outline" size={18} color={theme.primary} style={styles.sectionIcon} />
                  <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>Ảnh ghi chú / Bảng trắng</Text>
                </View>
                <Image
                  source={{ uri: assignment.photoUri }}
                  style={styles.attachedImage}
                  resizeMode="cover"
                  accessibilityLabel="Ảnh đính kèm cho bài tập"
                />
              </View>
            ) : null}
          </ScrollView>
        ) : null}
      </StateView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    ...Typography.title2,
    marginLeft: Spacing.xs,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.xs,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  courseBadgeRow: {
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.title1,
    marginBottom: Spacing.xl,
  },
  statusCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1.5,
    marginBottom: Spacing.xl,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  statusIndicatorCircle: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  statusDetails: {
    flex: 1,
  },
  statusTitle: {
    ...Typography.headline,
  },
  dueTimeText: {
    ...Typography.footnote,
    marginTop: 2,
  },
  toggleButton: {
    marginTop: Spacing.xs,
  },
  sectionCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1.2,
    marginBottom: Spacing.xl,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionIcon: {
    marginRight: Spacing.xs,
  },
  sectionHeading: {
    ...Typography.headline,
  },
  notesText: {
    ...Typography.body,
    lineHeight: 24,
  },
  attachedImage: {
    width: '100%',
    height: 220,
    borderRadius: BorderRadius.md,
  },
});
