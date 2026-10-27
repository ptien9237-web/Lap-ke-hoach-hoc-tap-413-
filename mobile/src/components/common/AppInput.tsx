import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useActiveTheme } from '../../stores/themeStore';
import { Spacing, Typography, BorderRadius } from '../../constants/theme';

interface AppInputProps extends TextInputProps {
  label: string;
  error?: string | null;
  containerStyle?: ViewStyle;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
}

export function AppInput({
  label,
  error,
  containerStyle,
  leftIcon,
  isPassword = false,
  ...props
}: AppInputProps) {
  const { theme } = useActiveTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!isPassword);

  const borderColor = error ? theme.error : isFocused ? theme.borderFocus : theme.border;

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.surface,
            borderColor,
          },
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={isFocused ? theme.primary : theme.textTertiary}
            style={styles.leftIcon}
          />
        )}

        <TextInput
          style={[styles.input, { color: theme.textPrimary }]}
          placeholderTextColor={theme.textTertiary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword && !showPassword}
          accessibilityLabel={label}
          {...props}
        />

        {isPassword && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword((prev) => !prev)}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={theme.textTertiary}
            />
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={14} color={theme.error} style={styles.errorIcon} />
          <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.footnote,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
  },
  leftIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 48,
    ...Typography.body,
    paddingVertical: Spacing.sm,
  },
  eyeButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  errorIcon: {
    marginRight: 4,
  },
  errorText: {
    ...Typography.caption,
  },
});
