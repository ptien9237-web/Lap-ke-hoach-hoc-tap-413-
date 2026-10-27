import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useActiveTheme } from '../../stores/themeStore';
import { Spacing, Typography } from '../../constants/theme';

export default function TabLayout() {
  const { theme } = useActiveTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: Spacing.xs,
          paddingTop: Spacing.xs,
        },
        tabBarLabelStyle: {
          ...Typography.caption,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tổng quan',
          tabBarLabel: 'Tổng quan',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'today' : 'today-outline'} size={22} color={color as string} />
          ),
          tabBarAccessibilityLabel: 'Chuyển đến màn hình Tổng quan',
        }}
      />

      <Tabs.Screen
        name="assignments"
        options={{
          title: 'Bài tập',
          tabBarLabel: 'Bài tập',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'list' : 'list-outline'} size={24} color={color as string} />
          ),
          tabBarAccessibilityLabel: 'Chuyển đến màn hình Danh sách bài tập',
        }}
      />

      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Lịch tuần',
          tabBarLabel: 'Lịch tuần',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={22} color={color as string} />
          ),
          tabBarAccessibilityLabel: 'Chuyển đến màn hình Lịch tuần',
        }}
      />

      <Tabs.Screen
        name="stats"
        options={{
          title: 'Tiến độ',
          tabBarLabel: 'Tiến độ',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'pie-chart' : 'pie-chart-outline'} size={22} color={color as string} />
          ),
          tabBarAccessibilityLabel: 'Chuyển đến màn hình Thống kê tiến độ',
        }}
      />

      <Tabs.Screen
        name="courses"
        options={{
          title: 'Học phần',
          tabBarLabel: 'Học phần',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'school' : 'school-outline'} size={22} color={color as string} />
          ),
          tabBarAccessibilityLabel: 'Chuyển đến màn hình Quản lý học phần',
        }}
      />
    </Tabs>
  );
}
