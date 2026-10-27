import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { addDays } from 'date-fns';
import { useCourses } from '../../hooks/useCourses';
import { useAssignments } from '../../hooks/useAssignments';
import { useActiveTheme } from '../../stores/themeStore';
import { AppInput } from '../../components/common/AppInput';
import { AppButton } from '../../components/common/AppButton';
import { resolveCourseColour, Spacing, Typography, BorderRadius, Colors } from '../../constants/theme';
import { formatDateTime } from '../../utils/dateUtils';

export default function AssignmentFormModal() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { theme } = useActiveTheme();

  const { courses } = useCourses();
  const { allAssignments, createAssignment, updateAssignment } = useAssignments();

  const isEditing = Boolean(id);
  const existingAssignment = isEditing ? allAssignments.find((a) => a.id === id) : null;

  // Form states initialized directly from existing assignment or defaults
  const [courseId, setCourseId] = useState(() => existingAssignment?.courseId || courses[0]?.id || '');
  const [title, setTitle] = useState(() => existingAssignment?.title || '');
  const [dueAt, setDueAt] = useState(() => {
    if (existingAssignment?.dueAt) return existingAssignment.dueAt;
    const defaultDate = new Date();
    defaultDate.setHours(23, 59, 0, 0);
    return defaultDate.toISOString();
  });
  const [status, setStatus] = useState<'pending' | 'completed'>(() => existingAssignment?.status || 'pending');
  const [notes, setNotes] = useState(() => existingAssignment?.notes || '');
  const [photoUri, setPhotoUri] = useState<string | null>(() => existingAssignment?.photoUri || null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Image Picker (Camera or Gallery for handwritten note / whiteboard)
  const handlePickImage = async () => {
    Alert.alert('Đính kèm ảnh', 'Chọn phương thức thêm ảnh ghi chú hoặc bảng trắng:', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Chụp ảnh mới (Camera)',
        onPress: async () => {
          const { status: permStatus } = await ImagePicker.requestCameraPermissionsAsync();
          if (permStatus !== 'granted') {
            Alert.alert('Cần cấp quyền', 'Ứng dụng cần quyền truy cập máy ảnh để chụp ảnh ghi chú.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.8,
          });
          if (!result.canceled && result.assets && result.assets.length > 0) {
            setPhotoUri(result.assets[0].uri);
          }
        },
      },
      {
        text: 'Chọn từ thư viện ảnh',
        onPress: async () => {
          const { status: permStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (permStatus !== 'granted') {
            Alert.alert('Cần cấp quyền', 'Ứng dụng cần quyền truy cập thư viện ảnh để chọn ảnh.');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.8,
          });
          if (!result.canceled && result.assets && result.assets.length > 0) {
            setPhotoUri(result.assets[0].uri);
          }
        },
      },
    ]);
  };

  const handleApplyPreset = (presetType: 'today2359' | 'tomorrow17' | 'in3days' | 'nextweek') => {
    const now = new Date();
    let target = new Date();

    if (presetType === 'today2359') {
      target.setHours(23, 59, 0, 0);
    } else if (presetType === 'tomorrow17') {
      target = addDays(now, 1);
      target.setHours(17, 0, 0, 0);
    } else if (presetType === 'in3days') {
      target = addDays(now, 3);
      target.setHours(23, 59, 0, 0);
    } else if (presetType === 'nextweek') {
      target = addDays(now, 7);
      target.setHours(23, 59, 0, 0);
    }

    setDueAt(target.toISOString());
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    const effectiveCourseId = courseId || courses[0]?.id || '';
    if (!title.trim()) {
      errs.title = 'Tiêu đề bài tập không được để trống.';
    }
    if (!effectiveCourseId) {
      errs.courseId = 'Vui lòng chọn học phần.';
    }
    if (isNaN(Date.parse(dueAt))) {
      errs.dueAt = 'Thời hạn nộp không hợp lệ.';
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const finalCourseId = courseId || courses[0]?.id || '';
    setIsSubmitting(true);

    try {
      if (isEditing && id) {
        await updateAssignment({
          id,
          input: {
            courseId: finalCourseId,
            title: title.trim(),
            dueAt,
            status,
            notes: notes.trim() || null,
            photoUri,
          },
        });
      } else {
        await createAssignment({
          courseId: finalCourseId,
          title: title.trim(),
          dueAt,
          status,
          notes: notes.trim() || null,
          photoUri,
        });
      }
      router.back();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể lưu bài tập. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Modal Navigation Bar */}
      <View style={[styles.headerBar, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {isEditing ? 'Chỉnh sửa bài tập' : 'Tạo bài tập mới'}
        </Text>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Đóng cửa sổ"
        >
          <Ionicons name="close" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Course Picker */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          Chọn học phần <Text style={{ color: theme.error }}>*</Text>
        </Text>

        {courses.length === 0 ? (
          <View style={[styles.noCourseWarning, { backgroundColor: theme.warningBg, borderColor: theme.warning }]}>
            <Ionicons name="alert-circle" size={18} color={theme.warning} style={{ marginRight: 6 }} />
            <Text style={[styles.noCourseText, { color: theme.warning }]}>
              Bạn chưa có học phần nào. Hãy tạo học phần trước!
            </Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.courseChipsScroll}>
            {courses.map((c) => {
              const isSelected = (courseId || courses[0]?.id) === c.id;
              const palette = resolveCourseColour(c.colour, theme);

              return (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.courseChip,
                    {
                      backgroundColor: isSelected ? palette.text : palette.bg,
                      borderColor: isSelected ? palette.text : theme.border,
                    },
                  ]}
                  onPress={() => setCourseId(c.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Chọn học phần ${c.code}`}
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text style={[styles.courseChipText, { color: isSelected ? theme.textInverse : palette.text }]}>
                    {c.code}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Title Input */}
        <AppInput
          label="Tiêu đề bài tập *"
          placeholder="Ví dụ: Báo cáo cuối kỳ, Bài tập lớn 2..."
          value={title}
          onChangeText={(t) => {
            setTitle(t);
            if (validationErrors.title) setValidationErrors((prev) => ({ ...prev, title: '' }));
          }}
          error={validationErrors.title}
        />

        {/* Due Date & Time */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          Hạn nộp (Thời gian hoàn thành)
        </Text>

        <View style={[styles.duePreviewBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="calendar-outline" size={20} color={theme.primary} style={{ marginRight: Spacing.sm }} />
          <Text style={[styles.duePreviewText, { color: theme.textPrimary }]}>
            {formatDateTime(dueAt)}
          </Text>
        </View>

        {/* Quick Deadline Presets */}
        <Text style={[styles.presetLabel, { color: theme.textTertiary }]}>Chọn nhanh thời hạn:</Text>
        <View style={styles.presetsRow}>
          <TouchableOpacity
            style={[styles.presetChip, { backgroundColor: theme.surfaceSubtle }]}
            onPress={() => handleApplyPreset('today2359')}
            accessibilityRole="button"
            accessibilityLabel="Đặt hạn hôm nay 23:59"
          >
            <Text style={[styles.presetChipText, { color: theme.textPrimary }]}>Hôm nay 23:59</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.presetChip, { backgroundColor: theme.surfaceSubtle }]}
            onPress={() => handleApplyPreset('tomorrow17')}
            accessibilityRole="button"
            accessibilityLabel="Đặt hạn ngày mai 17:00"
          >
            <Text style={[styles.presetChipText, { color: theme.textPrimary }]}>Ngày mai 17:00</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.presetChip, { backgroundColor: theme.surfaceSubtle }]}
            onPress={() => handleApplyPreset('in3days')}
            accessibilityRole="button"
            accessibilityLabel="Đặt hạn sau 3 ngày"
          >
            <Text style={[styles.presetChipText, { color: theme.textPrimary }]}>Sau 3 ngày</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.presetChip, { backgroundColor: theme.surfaceSubtle }]}
            onPress={() => handleApplyPreset('nextweek')}
            accessibilityRole="button"
            accessibilityLabel="Đặt hạn tuần sau"
          >
            <Text style={[styles.presetChipText, { color: theme.textPrimary }]}>Tuần sau</Text>
          </TouchableOpacity>
        </View>

        {/* Status Option */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary, marginTop: Spacing.md }]}>
          Trạng thái ban đầu
        </Text>
        <View style={[styles.statusToggleRow, { backgroundColor: theme.surfaceSubtle }]}>
          <TouchableOpacity
            style={[
              styles.statusToggleBtn,
              status === 'pending' && [styles.statusToggleBtnActive, { backgroundColor: theme.surface }],
            ]}
            onPress={() => setStatus('pending')}
            accessibilityRole="button"
            accessibilityLabel="Trạng thái Đang làm"
          >
            <Text style={[styles.statusToggleText, { color: status === 'pending' ? theme.warning : theme.textSecondary }]}>
              Chưa hoàn thành
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statusToggleBtn,
              status === 'completed' && [styles.statusToggleBtnActive, { backgroundColor: theme.surface }],
            ]}
            onPress={() => setStatus('completed')}
            accessibilityRole="button"
            accessibilityLabel="Trạng thái Đã hoàn thành"
          >
            <Text style={[styles.statusToggleText, { color: status === 'completed' ? theme.success : theme.textSecondary }]}>
              Đã hoàn thành
            </Text>
          </TouchableOpacity>
        </View>

        {/* Notes Input */}
        <AppInput
          label="Ghi chú thêm (tùy chọn)"
          placeholder="Nhập ghi chú, yêu cầu đề bài hoặc tài liệu tham khảo..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          style={{ minHeight: 90, textAlignVertical: 'top' }}
        />

        {/* Photo Attachment (Handwritten Notes / Whiteboard) */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          Ảnh ghi chú viết tay / Bảng trắng (tùy chọn)
        </Text>

        {photoUri ? (
          <View style={styles.photoPreviewWrapper}>
            <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            <TouchableOpacity
              style={[styles.removePhotoBtn, { backgroundColor: theme.error }]}
              onPress={() => setPhotoUri(null)}
              accessibilityRole="button"
              accessibilityLabel="Xóa ảnh đính kèm"
            >
              <Ionicons name="trash" size={16} color={theme.textInverse} />
              <Text style={[styles.removePhotoText, { color: theme.textInverse }]}>Xóa ảnh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.attachPhotoButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={handlePickImage}
            accessibilityRole="button"
            accessibilityLabel="Chụp hoặc chọn ảnh ghi chú bảng trắng"
          >
            <Ionicons name="camera-outline" size={24} color={theme.primary} style={{ marginRight: Spacing.sm }} />
            <Text style={[styles.attachPhotoText, { color: theme.primary }]}>
              Chụp ảnh ghi chú hoặc chọn từ thư viện
            </Text>
          </TouchableOpacity>
        )}

        {/* Submit Button */}
        <AppButton
          title={isEditing ? 'Cập nhật bài tập' : 'Tạo bài tập'}
          onPress={handleSubmit}
          isLoading={isSubmitting}
          style={styles.submitBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...Typography.title2,
  },
  closeBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: 40,
  },
  sectionLabel: {
    ...Typography.footnote,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  noCourseWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  noCourseText: {
    ...Typography.footnote,
    fontWeight: '600',
  },
  courseChipsScroll: {
    marginBottom: Spacing.md,
  },
  courseChip: {
    minHeight: 38,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  courseChipText: {
    ...Typography.footnote,
    fontWeight: '700',
  },
  duePreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
  },
  duePreviewText: {
    ...Typography.headline,
  },
  presetLabel: {
    ...Typography.caption,
    marginTop: 2,
    marginBottom: Spacing.xs,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
  },
  presetChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  presetChipText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  statusToggleRow: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    padding: 3,
    marginBottom: Spacing.md,
  },
  statusToggleBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusToggleBtnActive: {
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusToggleText: {
    ...Typography.footnote,
    fontWeight: '700',
  },
  attachPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginBottom: Spacing.xl,
  },
  attachPhotoText: {
    ...Typography.footnote,
    fontWeight: '600',
  },
  photoPreviewWrapper: {
    marginBottom: Spacing.xl,
  },
  photoPreview: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  removePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    borderRadius: BorderRadius.sm,
  },
  removePhotoText: {
    ...Typography.caption,
    fontWeight: '700',
    marginLeft: 4,
  },
  submitBtn: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
});
