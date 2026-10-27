import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useActiveTheme } from '../../stores/themeStore';
import { Spacing, Typography, BorderRadius } from '../../constants/theme';

interface StateViewProps {
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  isEmpty?: boolean;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyIcon?: keyof typeof Ionicons.glyphMap;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  loadingMessage?: string;
  children: React.ReactNode;
}

/**
 * Robust 4-state container: Loading, Empty, Error (with retry), and Content
 * Guarantees every screen handles all 4 states consistently and accessibly.
 */
export function StateView({
  isLoading,
  isError,
  error,
  isEmpty = false,
  onRetry,
  emptyTitle = 'Chưa có dữ liệu',
  emptyMessage = 'Hiện tại danh sách đang trống.',
  emptyIcon = 'folder-open-outline',
  emptyActionLabel,
  onEmptyAction,
  loadingMessage = 'Đang tải dữ liệu...',
  children,
}: StateViewProps) {
  const { theme } = useActiveTheme();

  // 1. Loading State
  if (isLoading) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: theme.background }]}
        accessibilityRole="progressbar"
        accessibilityLabel={loadingMessage}
      >
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.stateText, { color: theme.textSecondary }]}>{loadingMessage}</Text>
      </View>
    );
  }

  // 2. Error State
  if (isError) {
    const errorMsg = error?.message || 'Đã có lỗi xảy ra khi tải dữ liệu.';
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: theme.background }]}
        accessibilityRole="alert"
        accessibilityLabel={`Lỗi: ${errorMsg}`}
      >
        <View style={[styles.iconCircle, { backgroundColor: theme.errorBg }]}>
          <Ionicons name="alert-circle-outline" size={40} color={theme.error} />
        </View>
        <Text style={[styles.errorTitle, { color: theme.textPrimary }]}>Không thể tải dữ liệu</Text>
        <Text style={[styles.errorMessage, { color: theme.textSecondary }]}>{errorMsg}</Text>
        {onRetry && (
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel="Thử lại thao tác"
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={18} color={theme.primaryText} style={styles.buttonIcon} />
            <Text style={[styles.buttonText, { color: theme.primaryText }]}>Thử lại</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // 3. Empty State
  if (isEmpty) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: theme.background }]}
        accessibilityRole="text"
        accessibilityLabel={`${emptyTitle}. ${emptyMessage}`}
      >
        <View style={[styles.iconCircle, { backgroundColor: theme.surfaceSubtle }]}>
          <Ionicons name={emptyIcon} size={42} color={theme.textTertiary} />
        </View>
        <Text style={[styles.emptyTitleText, { color: theme.textPrimary }]}>{emptyTitle}</Text>
        <Text style={[styles.emptyMessageText, { color: theme.textSecondary }]}>{emptyMessage}</Text>
        {emptyActionLabel && onEmptyAction && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={onEmptyAction}
            accessibilityRole="button"
            accessibilityLabel={emptyActionLabel}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color={theme.primaryText} style={styles.buttonIcon} />
            <Text style={[styles.buttonText, { color: theme.primaryText }]}>{emptyActionLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // 4. Content State
  return <>{children}</>;
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  stateText: {
    marginTop: Spacing.md,
    ...Typography.body,
  },
  errorTitle: {
    ...Typography.title2,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    ...Typography.body,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: Spacing.xl,
  },
  emptyTitleText: {
    ...Typography.title2,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyMessageText: {
    ...Typography.body,
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: Spacing.xl,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Spacing.minTouchTarget,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Spacing.minTouchTarget,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  buttonIcon: {
    marginRight: Spacing.xs,
  },
  buttonText: {
    ...Typography.headline,
  },
});
