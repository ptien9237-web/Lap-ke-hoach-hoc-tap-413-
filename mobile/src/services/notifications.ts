import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Assignment } from '../types/assignment';
import { formatDateTime } from '../utils/dateUtils';
import { Colors } from '../constants/theme';

const KEY_NOTIFICATION_MAP = 'study_planner_notification_map';

// Configure foreground notification presentation behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function getNotificationMap(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(KEY_NOTIFICATION_MAP);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveNotificationMap(map: Record<string, string>): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_NOTIFICATION_MAP, JSON.stringify(map));
  } catch {
    // Ignore
  }
}

export const notificationService = {
  /**
   * Request notification permission from the user
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return false;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('study-planner-reminders', {
          name: 'Nhắc nhở hạn nộp bài tập',
          importance: AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: Colors.light.primary,
        });
      }

      return true;
    } catch (e) {
      console.warn('Error requesting notification permissions:', e);
      return false;
    }
  },

  /**
   * Schedule deadline reminder for an assignment
   */
  async scheduleAssignmentReminder(assignment: Assignment): Promise<string | null> {
    if (Platform.OS === 'web') return null;

    // Do not notify for completed assignments
    if (assignment.status === 'completed') {
      await this.cancelAssignmentReminder(assignment.id);
      return null;
    }

    const dueTime = new Date(assignment.dueAt).getTime();
    const now = Date.now();

    // If already in the past, skip
    if (dueTime <= now) {
      return null;
    }

    // Schedule 1 hour before due date, or 15 mins before if less than 1 hour remains
    let triggerTime = dueTime - 60 * 60 * 1000;
    if (triggerTime <= now) {
      triggerTime = dueTime - 15 * 60 * 1000;
      if (triggerTime <= now) {
        // Just notify at deadline
        triggerTime = dueTime;
      }
    }

    // Cancel existing reminder if any before re-scheduling
    await this.cancelAssignmentReminder(assignment.id);

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const secondsFromNow = Math.max(1, Math.floor((triggerTime - now) / 1000));

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `⏰ Nhắc hạn nộp: ${assignment.title}`,
          body: `Học phần ${assignment.courseCode || 'đã đăng ký'} sắp đến hạn (${formatDateTime(assignment.dueAt)}). Chạm để xem chi tiết.`,
          data: {
            assignmentId: assignment.id,
            url: `/assignment/${assignment.id}`,
          },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsFromNow,
        },
      });

      const map = await getNotificationMap();
      map[assignment.id] = notificationId;
      await saveNotificationMap(map);

      return notificationId;
    } catch (err) {
      console.warn('Failed to schedule notification:', err);
      return null;
    }
  },

  /**
   * Cancel reminder when assignment is completed, edited, or deleted
   */
  async cancelAssignmentReminder(assignmentId: string): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      const map = await getNotificationMap();
      const notificationId = map[assignmentId];
      if (notificationId) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        delete map[assignmentId];
        await saveNotificationMap(map);
      }
    } catch (e) {
      console.warn('Failed to cancel notification:', e);
    }
  },

  /**
   * Register response listener to handle tap on notification and deep link
   */
  registerResponseListener(onNotificationTap: (assignmentId: string) => void) {
    if (Platform.OS === 'web') return { remove: () => {} };

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      const assignmentId = data && typeof data.assignmentId === 'string' ? data.assignmentId : undefined;
      if (assignmentId) {
        onNotificationTap(assignmentId);
      }
    });

    return subscription;
  },
};
