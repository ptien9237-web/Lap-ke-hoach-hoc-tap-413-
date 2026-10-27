import { Alert, Platform } from 'react-native';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

/**
 * Platform-aware confirmation dialog.
 * - On Web: uses window.confirm(`${title}\n\n${message}`) so browser displays OK and Cancel buttons
 *   and properly triggers onConfirm() when confirmed, or onCancel() when cancelled.
 * - On Native (iOS/Android): uses Alert.alert with custom buttons and destructive style.
 */
export function confirmAction({
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogOptions): void {
  if (Platform.OS === 'web') {
    const fullMessage = title ? `${title}\n\n${message}` : message;
    const confirmFn =
      typeof window !== 'undefined' && typeof window.confirm === 'function'
        ? window.confirm.bind(window)
        : typeof globalThis !== 'undefined' && typeof (globalThis as any).confirm === 'function'
        ? (globalThis as any).confirm.bind(globalThis)
        : null;

    const confirmed = confirmFn ? confirmFn(fullMessage) : true;

    if (confirmed) {
      onConfirm();
    } else if (onCancel) {
      onCancel();
    }
    return;
  }

  // Native iOS / Android
  Alert.alert(title, message, [
    {
      text: cancelText,
      style: 'cancel',
      onPress: onCancel,
    },
    {
      text: confirmText,
      style: destructive ? 'destructive' : 'default',
      onPress: onConfirm,
    },
  ]);
}
