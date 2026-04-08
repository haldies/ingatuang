import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, useColorScheme as useNativeColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { CustomAlert } from '@/components/ui/custom-alert';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/ui/header';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { Colors, getRadius } from '@/constants/theme';

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

const COLOR_OPTIONS = [
  '#ef4444', '#f59e0b', '#f97316', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#64748b', '#6b7280', '#78716c',
];

export default function CreateCategoryScreen() {
  const { t } = useTranslation();
  const colorScheme = useNativeColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

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
      const { storage } = await import('@/lib/storage/storage-adapter');
      const categories = await storage.getCategories();
      const maxId = Math.max(...categories.map(c => parseInt(c.id) || 0), 0);
      const newId = (maxId + 1).toString();

      const newCategory = {
        id: newId,
        name: name.trim(),
        icon: selectedIcon,
        color: selectedColor,
        type: selectedType,
      };

      await storage.addCategory(newCategory);

      showAlert({
        title: t('common.success'),
        message: t('categories.save_success'),
        type: 'success',
      });

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
    <ScreenWrapper backgroundColor={theme.background}>
      <Header title={t('categories.create_header')} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Preview */}
        <View style={[styles.previewSection, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
          <View style={[styles.previewIcon, { backgroundColor: selectedColor + '20', borderRadius: getRadius(100, 'medium') }]}>
            <Text style={styles.previewEmoji}>{selectedIcon}</Text>
          </View>
          <Text style={[styles.previewName, { color: theme.text }]}>{name || t('categories.default_name_preview')}</Text>
        </View>

        {/* Type Selection */}
        <View style={[styles.section, { backgroundColor: isDark ? '#1a1a1a' : '#fff', borderTopColor: theme.border, borderTopWidth: 1 }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('categories.type_label')}</Text>
          <View style={styles.typeContainer}>
            <TouchableOpacity
              style={[
                styles.typeButton, 
                { backgroundColor: isDark ? '#0a0a0a' : '#f8fafc', borderRadius: getRadius(56, 'small') },
                selectedType === 'EXPENSE' && { backgroundColor: theme.tint }
              ]}
              onPress={() => setSelectedType('EXPENSE')}
            >
              <Ionicons 
                name="arrow-down-circle" 
                size={20} 
                color={selectedType === 'EXPENSE' ? '#fff' : (isDark ? '#475569' : '#6b7280')} 
              />
              <Text style={[
                styles.typeText, 
                { color: isDark ? '#94a3b8' : '#64748b' },
                selectedType === 'EXPENSE' && { color: '#fff' }
              ]}>
                {t('dashboard.expense_label')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton, 
                { backgroundColor: isDark ? '#0a0a0a' : '#f8fafc', borderRadius: getRadius(56, 'small') },
                selectedType === 'INCOME' && { backgroundColor: theme.tint }
              ]}
              onPress={() => setSelectedType('INCOME')}
            >
              <Ionicons 
                name="arrow-up-circle" 
                size={20} 
                color={selectedType === 'INCOME' ? '#fff' : (isDark ? '#475569' : '#6b7280')} 
              />
              <Text style={[
                styles.typeText, 
                { color: isDark ? '#94a3b8' : '#64748b' },
                selectedType === 'INCOME' && { color: '#fff' }
              ]}>
                {t('dashboard.income_label')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Name Input */}
        <View style={[styles.section, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('categories.name_label')}</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: isDark ? '#0a0a0a' : '#f8fafc',
              borderColor: theme.border,
              color: theme.text,
              borderRadius: getRadius(56, 'small')
            }]}
            value={name}
            onChangeText={setName}
            placeholder={t('categories.name_placeholder')}
            placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
            maxLength={20}
          />
        </View>

        {/* Icon Selection */}
        <View style={[styles.section, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('categories.icon_label')}</Text>
          <View style={styles.emojiGrid}>
            {EMOJI_OPTIONS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={[
                  styles.emojiButton,
                  { 
                    backgroundColor: isDark ? '#0a0a0a' : '#f8fafc',
                    borderRadius: getRadius(48, 'small') 
                  },
                  selectedIcon === emoji && { backgroundColor: theme.tint + '20', borderColor: theme.tint, borderWidth: 2 },
                ]}
                onPress={() => setSelectedIcon(emoji)}
              >
                <Text style={styles.emoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Color Selection */}
        <View style={[styles.section, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('categories.color_label')}</Text>
          <View style={styles.colorGrid}>
            {COLOR_OPTIONS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorButton,
                  { backgroundColor: color, borderRadius: getRadius(48, 'small') },
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
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: theme.tint, borderRadius: getRadius(56, 'small'), shadowColor: theme.tint }]} 
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>{t('categories.save_button')}</Text>
        </TouchableOpacity>
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
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  previewSection: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 8,
  },
  previewIcon: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  previewEmoji: {
    fontSize: 40,
  },
  previewName: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  section: {
    padding: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
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
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    fontWeight: '700',
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
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorButtonActive: {
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButton: {
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
});
