import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useActiveTheme } from '../../stores/themeStore';
import {
  useIsOffline,
  useOfflineQueueCount,
  useIsSyncing,
  useOfflineStore,
  useSyncError,
} from '../../stores/offlineStore';
import { Spacing, Typography, BorderRadius } from '../../constants/theme';

export function OfflineBanner() {
  const { theme } = useActiveTheme();
  const isOffline = useIsOffline();
  const queueCount = useOfflineQueueCount();
  const isSyncing = useIsSyncing();
  const syncError = useSyncError();
  const performSync = useOfflineStore((s) => s.performSync);

  // If online, not syncing, and no pending changes, don't show banner
  if (!isOffline && queueCount === 0 && !isSyncing && !syncError) {
    return null;
  }

  const bgColor = isOffline ? theme.warningBg : syncError ? theme.errorBg : theme.infoBg;
  const textColor = isOffline ? theme.warning : syncError ? theme.error : theme.info;
  const borderColor = isOffline ? theme.warning : syncError ? theme.error : theme.info;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: bgColor, borderBottomColor: borderColor },
      ]}
      accessibilityRole="alert"
      accessibilityLabel={
        isOffline
          ? 'Đang hoạt động ngoại tuyến'
          : isSyncing
          ? 'Đang đồng bộ dữ liệu lên máy chủ'
          : `Có ${queueCount} thay đổi chưa đồng bộ`
      }
    >
      <View style={styles.contentRow}>
        <View style={styles.iconContainer}>
          {isSyncing ? (
            <ActivityIndicator size="small" color={textColor} />
          ) : (
            <Ionicons
              name={isOffline ? 'cloud-offline' : syncError ? 'alert-circle' : 'cloud-upload'}
              size={18}
              color={textColor}
            />
          )}
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: textColor }]}>
            {isOffline
              ? 'Chế độ ngoại tuyến'
              : isSyncing
              ? 'Đang đồng bộ dữ liệu...'
              : syncError
              ? 'Lỗi đồng bộ'
              : 'Dữ liệu chưa đồng bộ'}
          </Text>
          <Text style={[styles.description, { color: theme.textSecondary }]} numberOfLines={2}>
            {isOffline
              ? 'Các thay đổi sẽ được lưu trên máy và đồng bộ khi có mạng.'
              : isSyncing
              ? 'Đang gửi các thao tác lên máy chủ.'
              : syncError
              ? syncError
              : `Có ${queueCount} thao tác đang chờ đồng bộ lên máy chủ.`}
          </Text>
        </View>

        {!isOffline && !isSyncing && queueCount > 0 && (
          <TouchableOpacity
            style={[styles.syncButton, { backgroundColor: theme.primary }]}
            onPress={() => performSync()}
            accessibilityRole="button"
            accessibilityLabel="Đồng bộ ngay lên máy chủ"
            activeOpacity={0.8}
          >
            <Text style={[styles.syncButtonText, { color: theme.primaryText }]}>Đồng bộ</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: Spacing.sm,
    width: 24,
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...Typography.caption,
    fontWeight: '700',
  },
  description: {
    ...Typography.footnote,
  },
  syncButton: {
    minHeight: Spacing.minTouchTarget,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  syncButtonText: {
    ...Typography.footnote,
    fontWeight: '600',
  },
});
