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

export default function LoginScreen() {
  const router = useRouter();
  const { theme } = useActiveTheme();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthLoading();
  const authError = useAuthError();
  const clearError = useAuthStore((s) => s.clearError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errors.email = 'Vui lòng nhập địa chỉ email.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Địa chỉ email không đúng định dạng.';
    }

    if (!password) {
      errors.password = 'Vui lòng nhập mật khẩu.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    clearError();
    if (!validate()) return;

    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch {
      // Error handled in store
    }
  };

  // Quick fill demo credentials for examiner/grader
  const handleQuickFillDemo = () => {
    setEmail('student@study.edu.vn');
    setPassword('Password123!');
    setValidationErrors({});
    clearError();
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
        {/* App Logo & Header */}
        <View style={styles.header}>
          <View style={[styles.iconCircle, { backgroundColor: theme.primaryLight }]}>
            <Ionicons name="school" size={40} color={theme.primary} />
          </View>
          <Text style={[styles.appTitle, { color: theme.textPrimary }]}>Student Study Planner</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Quản lý học phần, tiến độ và bài tập hiệu quả
          </Text>
        </View>

        {/* Form Container */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Đăng nhập</Text>

          {authError && (
            <View style={[styles.errorBanner, { backgroundColor: theme.errorBg }]}>
              <Ionicons name="alert-circle" size={18} color={theme.error} style={styles.errorIcon} />
              <Text style={[styles.errorBannerText, { color: theme.error }]}>{authError}</Text>
            </View>
          )}

          <AppInput
            label="Email sinh viên"
            placeholder="student@study.edu.vn"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (validationErrors.email) setValidationErrors((prev) => ({ ...prev, email: undefined }));
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon="mail-outline"
            error={validationErrors.email}
          />

          <AppInput
            label="Mật khẩu"
            placeholder="••••••••"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (validationErrors.password) setValidationErrors((prev) => ({ ...prev, password: undefined }));
            }}
            isPassword
            leftIcon="lock-closed-outline"
            error={validationErrors.password}
          />

          <AppButton
            title="Đăng nhập"
            onPress={handleLogin}
            isLoading={isLoading}
            style={styles.loginButton}
          />

          {/* Quick Demo Login Option */}
          <TouchableOpacity
            style={[styles.demoButton, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}
            onPress={handleQuickFillDemo}
            accessibilityRole="button"
            accessibilityLabel="Điền nhanh tài khoản demo sinh viên"
          >
            <Ionicons name="flash-outline" size={16} color={theme.primary} style={styles.demoIcon} />
            <Text style={[styles.demoButtonText, { color: theme.primary }]}>
              Điền tài khoản demo (student@study.edu.vn)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer Navigation */}
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>Chưa có tài khoản?</Text>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/register')}
            accessibilityRole="link"
            accessibilityLabel="Đăng ký tài khoản mới"
            style={styles.registerLink}
          >
            <Text style={[styles.registerText, { color: theme.primary }]}>Đăng ký ngay</Text>
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
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  appTitle: {
    ...Typography.title1,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    maxWidth: 280,
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
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },
  cardTitle: {
    ...Typography.title2,
    marginBottom: Spacing.lg,
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
  loginButton: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  demoIcon: {
    marginRight: Spacing.xs,
  },
  demoButtonText: {
    ...Typography.footnote,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },
  footerText: {
    ...Typography.body,
  },
  registerLink: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
  },
  registerText: {
    ...Typography.headline,
    marginLeft: Spacing.xs,
  },
});
