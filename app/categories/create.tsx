import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { CustomAlert } from '@/components/ui/custom-alert';
import { useTranslation } from 'react-i18next';

const EMOJI_OPTIONS = [
  '💰', '💵', '💴', '💶', '💷', '💸', '💳', '🏦',
  '🍔', '🍕', '🍜', '🍱', '🍛', '☕', '🍰', '🍺',
  '🚗', '🚕', '🚌', '🚇', '✈️', '🚲', '⛽', '🚦',
  '🛒', '🛍️', '👕', '👗', '👠', '💄', '🎁', '📦',
  '🎮', '🎬', '🎵', '🎸', '🎨', '🎭', '🎪', '🎯',
  '📱', '💻', '⌚', '📷', '🖥️', '⚡', '💡', '🔌',
  '🏥', '💊', '🩺', '🏃', '⚽', '🏋️', '🧘', '💆',
  '📚', '✏️', '📝', '🎓', '🏫', '📖', '🖊️', '📐',
  '🏠', '🏡', '🔑', '🛏️', '🚪', '🪟', '🛁', '🚽',
  '❤️', '🎉', '⭐', '🌟', '✨', '🔥', '💎', '🎈',
];

// Color options
const COLOR_OPTIONS = [
  '#ef4444', '#f59e0b', '#f97316', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#64748b', '#6b7280', '#78716c',
];

export default function CreateCategoryScreen() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('💰');
  const [selectedColor, setSelectedColor] = useState('#8b5cf6');
  const [selectedType, setSelectedType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
  }>({
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = (config: typeof alertConfig) => {
    setAlertConfig(config);
    setAlertVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showAlert({
        title: t('common.failed'),
        message: t('categories.empty_name_error'),
        type: 'error',
      });
      return;
    }

    try {
      // Import storage dynamically to avoid circular dependency
      const { storage } = await import('@/lib/storage/storage-adapter');
      const categories = await storage.getCategories();
      
      // Generate new ID
      const maxId = Math.max(...categories.map(c => parseInt(c.id) || 0), 0);
      const newId = (maxId + 1).toString();

      const newCategory = {
        id: newId,
        name: name.trim(),
        icon: selectedIcon,
        color: selectedColor,
        type: selectedType,
      };

      // Save through storage adapter (will use Room on Android)
      await storage.addCategory(newCategory);

      showAlert({
        title: t('common.success'),
        message: t('categories.save_success'),
        type: 'success',
      });

      // Navigate back after short delay
      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (error) {
      console.error('Error saving category:', error);
      showAlert({
        title: t('common.failed'),
        message: t('categories.save_error'),
        type: 'error',
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('categories.create_header')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Preview */}
        <View style={styles.previewSection}>
          <View style={[styles.previewIcon, { backgroundColor: selectedColor + '20' }]}>
            <Text style={styles.previewEmoji}>{selectedIcon}</Text>
          </View>
          <Text style={styles.previewName}>{name || t('categories.default_name_preview')}</Text>
        </View>

        {/* Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('categories.type_label')}</Text>
          <View style={styles.typeContainer}>
            <TouchableOpacity
              style={[styles.typeButton, selectedType === 'EXPENSE' && styles.typeButtonActive]}
              onPress={() => setSelectedType('EXPENSE')}
            >
              <Ionicons 
                name="arrow-down-circle" 
                size={20} 
                color={selectedType === 'EXPENSE' ? '#fff' : '#6b7280'} 
              />
              <Text style={[styles.typeText, selectedType === 'EXPENSE' && styles.typeTextActive]}>
                {t('dashboard.expense_label')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, selectedType === 'INCOME' && styles.typeButtonActive]}
              onPress={() => setSelectedType('INCOME')}
            >
              <Ionicons 
                name="arrow-up-circle" 
                size={20} 
                color={selectedType === 'INCOME' ? '#fff' : '#6b7280'} 
              />
              <Text style={[styles.typeText, selectedType === 'INCOME' && styles.typeTextActive]}>
                {t('dashboard.income_label')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Name Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('categories.name_label')}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t('categories.name_placeholder')}
            placeholderTextColor="#9ca3af"
            maxLength={20}
          />
        </View>

        {/* Icon Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('categories.icon_label')}</Text>
          <View style={styles.emojiGrid}>
            {EMOJI_OPTIONS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={[
                  styles.emojiButton,
                  selectedIcon === emoji && styles.emojiButtonActive,
                ]}
                onPress={() => setSelectedIcon(emoji)}
              >
                <Text style={styles.emoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Color Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('categories.color_label')}</Text>
          <View style={styles.colorGrid}>
            {COLOR_OPTIONS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorButton,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorButtonActive,
                ]}
                onPress={() => setSelectedColor(color)}
              >
                {selectedColor === color && (
                  <Ionicons name="checkmark" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{t('categories.save_button')}</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={[{ text: 'OK', onPress: () => setAlertVisible(false) }]}
        onClose={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  previewSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  previewIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  previewEmoji: {
    fontSize: 40,
  },
  previewName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  typeButtonActive: {
    backgroundColor: '#8b5cf6',
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  typeTextActive: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emojiButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  emojiButtonActive: {
    backgroundColor: '#ddd6fe',
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  emoji: {
    fontSize: 24,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorButtonActive: {
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  saveButton: {
    backgroundColor: '#8b5cf6',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
