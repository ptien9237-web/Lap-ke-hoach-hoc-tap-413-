import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCourses } from '../../hooks/useCourses';
import { useActiveTheme } from '../../stores/themeStore';
import { StateView } from '../../components/common/StateView';
import { AppInput } from '../../components/common/AppInput';
import { AppButton } from '../../components/common/AppButton';
import { OfflineBanner } from '../../components/common/OfflineBanner';
import { Course } from '../../types/course';
import { confirmAction } from '../../utils/confirmDialog';
import {
  AVAILABLE_COURSE_COLOURS,
  resolveCourseColour,
  Spacing,
  Typography,
  BorderRadius,
  Colors,
} from '../../constants/theme';

export default function CoursesScreen() {
  const { theme } = useActiveTheme();
  const { courses, isLoading, isError, error, refetch, createCourse, updateCourse, deleteCourse } = useCourses();

  // Modal State for Add / Edit
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [colour, setColour] = useState<string>('courseBlue');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ code?: string; name?: string }>({});

  const openAddModal = () => {
    setEditingCourse(null);
    setCode('');
    setName('');
    setColour('courseBlue');
    setValidationErrors({});
    setModalVisible(true);
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setCode(course.code);
    setName(course.name);
    setColour(course.colour || 'courseBlue');
    setValidationErrors({});
    setModalVisible(true);
  };

  const validate = () => {
    const errs: { code?: string; name?: string } = {};
    if (!code.trim()) errs.code = 'Mã học phần không được để trống (ví dụ: INT3102).';
    if (!name.trim()) errs.name = 'Tên học phần không được để trống.';
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      if (editingCourse) {
        await updateCourse({
          id: editingCourse.id,
          input: { code: code.trim(), name: name.trim(), colour },
        });
      } else {
        await createCourse({
          code: code.trim(),
          name: name.trim(),
          colour,
        });
      }
      setModalVisible(false);
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể lưu học phần. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCourse = (course: Course) => {
    confirmAction({
      title: 'Xóa học phần',
      message: `Bạn có chắc chắn muốn xóa học phần "${course.code} - ${course.name}"? Các bài tập thuộc học phần này cũng sẽ bị xóa.`,
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteCourse(course.id);
        } catch (err: any) {
          Alert.alert('Lỗi', err.message || 'Không thể xóa học phần.');
        }
      },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <OfflineBanner />

      <View style={styles.topBar}>
        <View>
          <Text style={[styles.screenTitle, { color: theme.textPrimary }]}>Quản lý học phần</Text>
          <Text style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
            Danh sách các học phần trong học kỳ ({courses.length})
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.primary }]}
          onPress={openAddModal}
          accessibilityRole="button"
          accessibilityLabel="Thêm học phần mới"
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color={theme.primaryText} style={styles.addIcon} />
          <Text style={[styles.addButtonText, { color: theme.primaryText }]}>Thêm</Text>
        </TouchableOpacity>
      </View>

      <StateView
        isLoading={isLoading && courses.length === 0}
        isError={isError && courses.length === 0}
        error={error as Error}
        isEmpty={!isLoading && courses.length === 0}
        emptyTitle="Chưa có học phần nào"
        emptyMessage="Hãy thêm các học phần đang theo học để phân loại bài tập và theo dõi tiến độ."
        emptyActionLabel="Thêm học phần mới"
        onEmptyAction={openAddModal}
        onRetry={() => refetch()}
      >
        <FlatList
          data={courses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => { void refetch(); }}
              tintColor={theme.primary}
            />
          }
          renderItem={({ item }) => {
            const palette = resolveCourseColour(item.colour, theme);

            return (
              <View
                style={[
                  styles.courseCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={styles.courseHeader}>
                  <View style={[styles.colorBadge, { backgroundColor: palette.bg }]}>
                    <Text style={[styles.codeText, { color: palette.text }]}>{item.code}</Text>
                  </View>

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={[styles.iconBtn, { backgroundColor: theme.surfaceSubtle }]}
                      onPress={() => openEditModal(item)}
                      accessibilityRole="button"
                      accessibilityLabel={`Sửa học phần ${item.code}`}
                    >
                      <Ionicons name="pencil" size={16} color={theme.textPrimary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.iconBtn, { backgroundColor: theme.errorBg }]}
                      onPress={() => handleDeleteCourse(item)}
                      accessibilityRole="button"
                      accessibilityLabel={`Xóa học phần ${item.code}`}
                    >
                      <Ionicons name="trash-outline" size={16} color={theme.error} />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={[styles.nameText, { color: theme.textPrimary }]}>{item.name}</Text>
              </View>
            );
          }}
        />
      </StateView>

      {/* Add / Edit Course Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
          <View style={[styles.modalCard, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                {editingCourse ? 'Chỉnh sửa học phần' : 'Thêm học phần mới'}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Đóng cửa sổ"
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <AppInput
                label="Mã học phần"
                placeholder="Ví dụ: INT3102, CS101..."
                value={code}
                onChangeText={(t) => {
                  setCode(t);
                  if (validationErrors.code) setValidationErrors((prev) => ({ ...prev, code: undefined }));
                }}
                autoCapitalize="characters"
                error={validationErrors.code}
              />

              <AppInput
                label="Tên học phần"
                placeholder="Ví dụ: Lập trình Mobile..."
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  if (validationErrors.name) setValidationErrors((prev) => ({ ...prev, name: undefined }));
                }}
                error={validationErrors.name}
              />

              {/* Color Picker using predefined accessible tokens */}
              <Text style={[styles.pickerLabel, { color: theme.textSecondary }]}>
                Màu sắc nhận diện học phần
              </Text>
              <View style={styles.colorsPaletteGrid}>
                {AVAILABLE_COURSE_COLOURS.map((c) => {
                  const palette = resolveCourseColour(c, theme);
                  const isSelected = colour === c;

                  return (
                    <TouchableOpacity
                      key={c}
                      style={[
                        styles.colorSwatch,
                        {
                          backgroundColor: palette.text,
                          borderColor: isSelected ? theme.textPrimary : 'transparent',
                          borderWidth: isSelected ? 3 : 0,
                        },
                      ]}
                      onPress={() => setColour(c)}
                      accessibilityRole="button"
                      accessibilityLabel={`Chọn màu ${c}`}
                      accessibilityState={{ selected: isSelected }}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color={theme.textInverse} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <AppButton
                title={editingCourse ? 'Cập nhật học phần' : 'Lưu học phần'}
                onPress={handleSubmit}
                isLoading={isSubmitting}
                style={styles.modalSubmitButton}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  screenTitle: {
    ...Typography.title1,
  },
  screenSubtitle: {
    ...Typography.footnote,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: Spacing.minTouchTarget,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  addIcon: {
    marginRight: 4,
  },
  addButtonText: {
    ...Typography.headline,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
  },
  courseCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1.2,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  colorBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  codeText: {
    ...Typography.headline,
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.xs,
  },
  nameText: {
    ...Typography.body,
    marginTop: Spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    ...Typography.title2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerLabel: {
    ...Typography.footnote,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  colorsPaletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.xl,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubmitButton: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
});
