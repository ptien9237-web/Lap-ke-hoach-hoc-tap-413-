import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Link, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useActiveTheme } from '../stores/themeStore';
import { Spacing, Typography, BorderRadius } from '../constants/theme';

export default function NotFoundScreen() {
  const { theme } = useActiveTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Không tìm thấy trang' }} />
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.iconCircle, { backgroundColor: theme.surfaceSubtle }]}>
          <Ionicons name="compass-outline" size={48} color={theme.textTertiary} />
        </View>

        <Text style={[styles.title, { color: theme.textPrimary }]}>404 - Trang không tồn tại</Text>
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          Đường dẫn bạn yêu cầu không tồn tại hoặc đã được di chuyển sang vị trí khác.
        </Text>

        <Link
          href="/(tabs)"
          style={[styles.linkButton, { backgroundColor: theme.primary }]}
          accessibilityRole="link"
          accessibilityLabel="Trở về màn hình chính"
        >
          <Text style={[styles.linkText, { color: theme.primaryText }]}>Trở về màn hình chính</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.title1,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  description: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    maxWidth: 300,
  },
  linkButton: {
    minHeight: Spacing.minTouchTarget,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkText: {
    ...Typography.headline,
    textAlign: 'center',
  },
});
