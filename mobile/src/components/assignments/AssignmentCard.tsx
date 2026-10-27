import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Assignment } from '../../types/assignment';
import { CourseBadge } from '../common/CourseBadge';
import { useActiveTheme } from '../../stores/themeStore';
import {
  getRelativeDueLabel,
  checkIsOverdue,
  checkIsDueToday,
  checkIsDueWithin48Hours,
} from '../../utils/dateUtils';
import { Spacing, Typography, BorderRadius, Colors } from '../../constants/theme';

interface AssignmentCardProps {
  assignment: Assignment;
  onPress: () => void;
  onToggleStatus: () => void;
}

export function AssignmentCard({ assignment, onPress, onToggleStatus }: AssignmentCardProps) {
  const { theme } = useActiveTheme();
  const isCompleted = assignment.status === 'completed';
  const isOverdue = !isCompleted && checkIsOverdue(assignment.dueAt);
  const isDueToday = !isCompleted && checkIsDueToday(assignment.dueAt);
  const isDueSoon = !isCompleted && checkIsDueWithin48Hours(assignment.dueAt);

  // Status visual cues (color + icon + text)
  let statusBadgeBg: string = theme.surfaceSubtle;
  let statusBadgeText: string = theme.textSecondary;
  let statusIcon: keyof typeof Ionicons.glyphMap = 'calendar-outline';
  let statusLabel = getRelativeDueLabel(assignment.dueAt);

  if (isCompleted) {
    statusBadgeBg = theme.successBg;
    statusBadgeText = theme.success;
    statusIcon = 'checkmark-circle';
    statusLabel = 'Đã hoàn thành';
  } else if (isOverdue) {
    statusBadgeBg = theme.errorBg;
    statusBadgeText = theme.error;
    statusIcon = 'alert-circle';
    statusLabel = `Quá hạn (${statusLabel})`;
  } else if (isDueToday) {
    statusBadgeBg = theme.warningBg;
    statusBadgeText = theme.warning;
    statusIcon = 'time';
    statusLabel = `Hạn hôm nay (${statusLabel})`;
  } else if (isDueSoon) {
    statusBadgeBg = theme.infoBg;
    statusBadgeText = theme.info;
    statusIcon = 'alarm-outline';
  }

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: isCompleted ? theme.border : isOverdue ? theme.error : theme.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Bài tập: ${assignment.title}. Hạn nộp: ${statusLabel}. Trạng thái: ${
        isCompleted ? 'Đã hoàn thành' : 'Chưa hoàn thành'
      }`}
    >
      <View style={styles.cardHeader}>
        {assignment.courseCode ? (
          <CourseBadge
            code={assignment.courseCode}
            name={assignment.courseName}
            colour={assignment.courseColour || 'courseBlue'}
            size="small"
          />
        ) : (
          <View />
        )}

        {/* Due date / Status pill */}
        <View style={[styles.statusPill, { backgroundColor: statusBadgeBg }]}>
          <Ionicons name={statusIcon} size={13} color={statusBadgeText} style={styles.statusPillIcon} />
          <Text style={[styles.statusPillText, { color: statusBadgeText }]} numberOfLines={1}>
            {statusLabel}
          </Text>
        </View>
      </View>

      <View style={styles.contentRow}>
        {/* Toggle Checkbox Button with 44x44 touch area */}
        <TouchableOpacity
          style={styles.checkboxTouchTarget}
          onPress={onToggleStatus}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isCompleted }}
          accessibilityLabel={`Đánh dấu "${assignment.title}" ${
            isCompleted ? 'chưa hoàn thành' : 'đã hoàn thành'
          }`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View
            style={[
              styles.checkboxBox,
              {
                borderColor: isCompleted ? theme.success : theme.border,
                backgroundColor: isCompleted ? theme.success : 'transparent',
              },
            ]}
          >
            {isCompleted && (
              <Ionicons name="checkmark" size={16} color={theme.textInverse} />
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.mainInfo}>
          <Text
            style={[
              styles.title,
              {
                color: isCompleted ? theme.textTertiary : theme.textPrimary,
                textDecorationLine: isCompleted ? 'line-through' : 'none',
              },
            ]}
            numberOfLines={2}
          >
            {assignment.title}
          </Text>

          {assignment.notes ? (
            <Text
              style={[styles.notesPreview, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {assignment.notes}
            </Text>
          ) : null}
        </View>

        <View style={styles.trailingIcons}>
          {assignment.photoUri ? (
            <View
              style={[styles.photoIconBadge, { backgroundColor: theme.surfaceSubtle }]}
              accessibilityLabel="Có ảnh đính kèm"
            >
              <Ionicons name="image-outline" size={16} color={theme.primary} />
            </View>
          ) : null}

          {assignment.isLocalOnly ? (
            <Ionicons name="cloud-offline" size={16} color={theme.warning} style={styles.offlineIcon} />
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
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
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    maxWidth: '55%',
  },
  statusPillIcon: {
    marginRight: 4,
  },
  statusPillText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxTouchTarget: {
    width: Spacing.minTouchTarget,
    height: Spacing.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -Spacing.xs,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainInfo: {
    flex: 1,
    paddingVertical: 2,
    marginLeft: Spacing.xs,
  },
  title: {
    ...Typography.headline,
    marginBottom: 2,
  },
  notesPreview: {
    ...Typography.footnote,
  },
  trailingIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.sm,
    paddingTop: 4,
  },
  photoIconBadge: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.xs,
  },
  offlineIcon: {
    marginLeft: Spacing.xs,
  },
});
