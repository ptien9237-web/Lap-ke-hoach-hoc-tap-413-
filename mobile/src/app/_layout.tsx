import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore, useAuthInitialized, useIsAuthenticated } from '../stores/authStore';
import { useThemeStore, useActiveTheme } from '../stores/themeStore';
import { useOfflineStore } from '../stores/offlineStore';
import { notificationService } from '../services/notifications';

// Create TanStack QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RootNavigationLayout() {
  const router = useRouter();
  const segments = useSegments();
  const isInitialized = useAuthInitialized();
  const isAuthenticated = useIsAuthenticated();
  const checkSession = useAuthStore((s) => s.checkSession);
  const initTheme = useThemeStore((s) => s.initTheme);
  const initOfflineState = useOfflineStore((s) => s.initOfflineState);
  const { theme, isDark } = useActiveTheme();

  // App startup initialization
  useEffect(() => {
    initTheme();
    initOfflineState();
    checkSession();

    // Listen for notification deep link taps
    const subscription = notificationService.registerResponseListener((assignmentId) => {
      router.push(`/assignment/${assignmentId}`);
    });

    return () => {
      subscription?.remove();
    };
  }, [checkSession, initOfflineState, initTheme, router]);

  // Protected route session guard
  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // User is not authenticated, redirect to login
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // User is already logged in, redirect to dashboard
      router.replace('/(tabs)');
    }
  }, [isInitialized, isAuthenticated, segments, router]);

  // Show splash loading indicator before session is verified
  if (!isInitialized) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="assignment/[id]" options={{ headerShown: false }} />
        <Stack.Screen
          name="(modal)/assignment-form"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen name="+not-found" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootNavigationLayout />
    </QueryClientProvider>
  );
}
