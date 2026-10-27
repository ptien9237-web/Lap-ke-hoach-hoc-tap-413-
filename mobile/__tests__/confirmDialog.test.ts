import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockAlert, mockPlatform } = vi.hoisted(() => ({
  mockAlert: { alert: vi.fn() },
  mockPlatform: { OS: 'web' as 'web' | 'ios' | 'android' },
}));

vi.mock('react-native', () => ({
  Alert: mockAlert,
  Platform: mockPlatform,
}));

import { confirmAction } from '../src/utils/confirmDialog';

describe('confirmAction Utility (FIX 02 - Web & Native Delete Confirm)', () => {
  const originalConfirm = (globalThis as any).confirm;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockAlert.alert.mockReset();
    mockPlatform.OS = 'web';
  });

  afterEach(() => {
    (globalThis as any).confirm = originalConfirm;
  });

  describe('Web Platform', () => {
    beforeEach(() => {
      mockPlatform.OS = 'web';
    });

    it('should call onConfirm when user clicks OK in window.confirm', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      const confirmMock = vi.fn(() => true);
      (globalThis as any).confirm = confirmMock;
      (globalThis as any).window = { confirm: confirmMock };

      confirmAction({
        title: 'Xóa học phần',
        message: 'Bạn có chắc chắn muốn xóa?',
        confirmText: 'Xóa',
        cancelText: 'Hủy',
        destructive: true,
        onConfirm,
        onCancel,
      });

      expect(confirmMock).toHaveBeenCalledWith('Xóa học phần\n\nBạn có chắc chắn muốn xóa?');
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onCancel).not.toHaveBeenCalled();
    });

    it('should NOT call onConfirm and call onCancel when user clicks Cancel in window.confirm', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      const confirmMock = vi.fn(() => false);
      (globalThis as any).confirm = confirmMock;
      (globalThis as any).window = { confirm: confirmMock };

      confirmAction({
        title: 'Xóa bài tập',
        message: 'Hành động không thể hoàn tác.',
        onConfirm,
        onCancel,
      });

      expect(confirmMock).toHaveBeenCalledWith('Xóa bài tập\n\nHành động không thể hoàn tác.');
      expect(onConfirm).not.toHaveBeenCalled();
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Native Platform (iOS / Android)', () => {
    beforeEach(() => {
      mockPlatform.OS = 'ios';
    });

    it('should delegate to Alert.alert with cancel and destructive action buttons', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      confirmAction({
        title: 'Xóa bài tập',
        message: 'Bạn có chắc không?',
        confirmText: 'Xóa',
        cancelText: 'Hủy',
        destructive: true,
        onConfirm,
        onCancel,
      });

      expect(mockAlert.alert).toHaveBeenCalledTimes(1);
      const [title, message, buttons] = mockAlert.alert.mock.calls[0];
      expect(title).toBe('Xóa bài tập');
      expect(message).toBe('Bạn có chắc không?');
      expect(buttons).toHaveLength(2);

      // Cancel button
      expect(buttons![0].text).toBe('Hủy');
      expect(buttons![0].style).toBe('cancel');
      buttons![0].onPress?.();
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onConfirm).not.toHaveBeenCalled();

      // Destructive button
      expect(buttons![1].text).toBe('Xóa');
      expect(buttons![1].style).toBe('destructive');
      buttons![1].onPress?.();
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
  });
});
