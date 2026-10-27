import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useActiveTheme } from '../../stores/themeStore';
import { resolveCourseColour, Spacing, Typography, BorderRadius } from '../../constants/theme';

interface CourseBadgeProps {
  code: string;
  name?: string;
  colour: string;
  style?: ViewStyle;
  size?: 'small' | 'medium';
}

export function CourseBadge({ code, name, colour, style, size = 'small' }: CourseBadgeProps) {
  const { theme } = useActiveTheme();
  const palette = resolveCourseColour(colour, theme);

  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: palette.bg,
          paddingVertical: isSmall ? 2 : 4,
          paddingHorizontal: isSmall ? Spacing.sm : Spacing.md,
        },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Học phần ${code}${name ? `: ${name}` : ''}`}
    >
      <Text
        style={[
          isSmall ? styles.codeSmall : styles.codeMedium,
          { color: palette.text },
        ]}
        numberOfLines={1}
      >
        {code}
        {name && !isSmall ? ` • ${name}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeSmall: {
    ...Typography.caption,
    fontWeight: '700',
  },
  codeMedium: {
    ...Typography.footnote,
    fontWeight: '700',
  },
});
