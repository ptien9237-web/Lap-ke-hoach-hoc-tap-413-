import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, useAuthLoading, useAuthError } from '../../stores/authStore';
import { useActiveTheme } from '../../stores/themeStore';
import { AppInput } from '../../components/common/AppInput';
import { AppButton } from '../../components/common/AppButton';
import { Spacing, Typography, BorderRadius, Colors } from '../../constants/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const { theme } = useActiveTheme();
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthLoading();
  const authError = useAuthError();
  const clearError = useAuthStore((s) => s.clearError);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!name.trim()) {
      errors.name = 'Vui lòng nhập họ và tên.';
    } else if (name.trim().length < 2) {
      errors.name = 'Họ và tên phải có ít nhất 2 ký tự.';
    }

    if (!email.trim()) {
      errors.email = 'Vui lòng nhập địa chỉ email.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Địa chỉ email không đúng định dạng.';
    }

    if (!password) {
      errors.password = 'Vui lòng nhập mật khẩu.';
    } else if (password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự.';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    clearError();
    if (!validate()) return;

    try {
      await register(name, email, password);
      router.replace('/(tabs)');
    } catch {
      // Error in store
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Quay lại đăng nhập"
        >
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Tạo tài khoản</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Bắt đầu quản lý kế hoạch học tập cá nhân của bạn
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {authError && (
            <View style={[styles.errorBanner, { backgroundColor: theme.errorBg }]}>
              <Ionicons name="alert-circle" size={18} color={theme.error} style={styles.errorIcon} />
              <Text style={[styles.errorBannerText, { color: theme.error }]}>{authError}</Text>
            </View>
          )}

          <AppInput
            label="Họ và tên sinh viên"
            placeholder="Nguyễn Văn A"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (validationErrors.name) setValidationErrors((prev) => ({ ...prev, name: '' }));
            }}
            leftIcon="person-outline"
            error={validationErrors.name}
          />

          <AppInput
            label="Email"
            placeholder="student@study.edu.vn"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (validationErrors.email) setValidationErrors((prev) => ({ ...prev, email: '' }));
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
            error={validationErrors.email}
          />

          <AppInput
            label="Mật khẩu"
            placeholder="Tối thiểu 6 ký tự"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (validationErrors.password) setValidationErrors((prev) => ({ ...prev, password: '' }));
            }}
            isPassword
            leftIcon="lock-closed-outline"
            error={validationErrors.password}
          />

          <AppInput
            label="Xác nhận mật khẩu"
            placeholder="Nhập lại mật khẩu"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (validationErrors.confirmPassword) setValidationErrors((prev) => ({ ...prev, confirmPassword: '' }));
            }}
            isPassword
            leftIcon="shield-checkmark-outline"
            error={validationErrors.confirmPassword}
          />

          <AppButton
            title="Đăng ký tài khoản"
            onPress={handleRegister}
            isLoading={isLoading}
            style={styles.submitButton}
          />
        </View>

        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>Đã có tài khoản?</Text>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')}
            accessibilityRole="link"
            accessibilityLabel="Đăng nhập với tài khoản có sẵn"
            style={styles.loginLink}
          >
            <Text style={[styles.loginText, { color: theme.primary }]}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxxl,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.title1,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
  },
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1.2,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: Spacing.xl,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  errorIcon: {
    marginRight: Spacing.sm,
  },
  errorBannerText: {
    flex: 1,
    ...Typography.footnote,
    fontWeight: '600',
  },
  submitButton: {
    marginTop: Spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    ...Typography.body,
  },
  loginLink: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
  },
  loginText: {
    ...Typography.headline,
    marginLeft: Spacing.xs,
  },
});
