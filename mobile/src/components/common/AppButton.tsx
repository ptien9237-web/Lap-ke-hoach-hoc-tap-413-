import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useActiveTheme } from '../../stores/themeStore';
import { Spacing, Typography, BorderRadius } from '../../constants/theme';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  accessibilityLabel?: string;
}

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  accessibilityLabel,
}: AppButtonProps) {
  const { theme } = useActiveTheme();

  let backgroundColor: string = theme.primary;
  let textColor: string = theme.primaryText;
  let borderColor: string = 'transparent';
  let borderWidth = 0;

  if (variant === 'secondary') {
    backgroundColor = theme.surfaceSubtle;
    textColor = theme.textPrimary;
  } else if (variant === 'outline') {
    backgroundColor = 'transparent';
    textColor = theme.primary;
    borderColor = theme.primary;
    borderWidth = 1;
  } else if (variant === 'danger') {
    backgroundColor = theme.error;
    textColor = theme.textInverse;
  }

  if (disabled) {
    backgroundColor = theme.surfaceSubtle;
    textColor = theme.textTertiary;
    borderColor = theme.border;
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor,
          borderColor,
          borderWidth,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: disabled || isLoading, busy: isLoading }}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text style={[styles.text, { color: textColor }, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48, // Exceeds minimum 44x44 touch target strictly
    minWidth: 48,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...Typography.headline,
    textAlign: 'center',
  },
});
