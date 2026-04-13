import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { storage, Category } from '@/lib/storage/storage-adapter';
import { CustomAlert } from '@/components/ui/custom-alert';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/ui/header';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { Colors, getRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

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

export default function EditCategoryScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const categoryId = params.id as string;
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('💰');
  const [selectedColor, setSelectedColor] = useState('#8b5cf6');
  const [selectedType, setSelectedType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    buttons?: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>;
  }>({
    title: '',
    message: '',
    type: 'info',
  });

  useEffect(() => {
    loadCategory();
  }, [categoryId]);

  const loadCategory = async () => {
    try {
      setLoading(true);
      const cat = await storage.getCategoryById(categoryId);
      if (cat) {
        setCategory(cat);
        setName(cat.name);
        setSelectedIcon(cat.icon);
        setSelectedColor(cat.color);
        setSelectedType(cat.type);
      }
    } catch (error) {
      console.error('Error loading category:', error);
    } finally {
      setLoading(false);
    }
  };

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
      const updatedCategory = {
        name: name.trim(),
        icon: selectedIcon,
        color: selectedColor,
        type: selectedType,
      };

      await storage.updateCategory(categoryId, updatedCategory);

      showAlert({
        title: t('common.success'),
        message: t('categories.update_success'),
        type: 'success',
      });

      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (error) {
      console.error('Error updating category:', error);
      showAlert({
        title: t('common.failed'),
        message: t('categories.update_error'),
        type: 'error',
      });
    }
  };

  const handleDelete = () => {
    showAlert({
      title: t('categories.delete_confirm_title'),
      message: t('categories.delete_confirm_msg'),
      type: 'warning',
      buttons: [
        { text: t('common.cancel'), style: 'cancel', onPress: () => setAlertVisible(false) },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await storage.deleteCategory(categoryId);

              showAlert({
                title: t('common.success'),
                message: t('categories.delete_success'),
                type: 'success',
              });

              setTimeout(() => {
                router.back();
              }, 1000);
            } catch (error) {
              console.error('Error deleting category:', error);
              showAlert({
                title: t('common.failed'),
                message: t('categories.delete_error'),
                type: 'error',
              });
            }
          },
        },
      ],
    });
  };

  if (loading) {
    return (
      <ScreenWrapper backgroundColor={theme.background}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.tint} />
        </View>
      </ScreenWrapper>
    );
  }

  if (!category) {
    return (
      <ScreenWrapper backgroundColor={theme.background}>
         <Header title={t('categories.edit_header')} />
        <View style={styles.loadingContainer}>
          <Text style={[styles.errorText, { color: theme.textSecondary }]}>{t('categories.not_found')}</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper backgroundColor={theme.background}>
      <Header 
        title={t('categories.edit_header')} 
        rightIcon="trash-2"
        onRightPress={handleDelete}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Preview */}
        <View style={[styles.previewSection, { backgroundColor: theme.card }]}>
          <View style={[styles.previewIcon, { backgroundColor: selectedColor + '20', borderRadius: getRadius(100, 'medium') }]}>
            <Text style={styles.previewEmoji}>{selectedIcon}</Text>
          </View>
          <Text style={[styles.previewName, { color: theme.text }]}>{name || t('categories.default_name_preview')}</Text>
        </View>

        {/* Type Selection */}
        <View style={[styles.section, { backgroundColor: theme.card, borderTopColor: theme.border, borderTopWidth: 1 }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('categories.type_label')}</Text>
          <View style={styles.typeContainer}>
            <TouchableOpacity
              style={[
                styles.typeButton, 
                { backgroundColor: theme.background, borderRadius: getRadius(56, 'small') },
                selectedType === 'EXPENSE' && { backgroundColor: theme.tint }
              ]}
              onPress={() => setSelectedType('EXPENSE')}
            >
              <Ionicons 
                name="arrow-down-circle" 
                size={20} 
                color={selectedType === 'EXPENSE' ? '#fff' : theme.textSecondary} 
              />
              <Text style={[
                styles.typeText, 
                { color: theme.textSecondary },
                selectedType === 'EXPENSE' && { color: '#fff' }
              ]}>
                {t('dashboard.expense_label')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton, 
                { backgroundColor: theme.background, borderRadius: getRadius(56, 'small') },
                selectedType === 'INCOME' && { backgroundColor: theme.tint }
              ]}
              onPress={() => setSelectedType('INCOME')}
            >
              <Ionicons 
                name="arrow-up-circle" 
                size={20} 
                color={selectedType === 'INCOME' ? '#fff' : theme.textSecondary} 
              />
              <Text style={[
                styles.typeText, 
                { color: theme.textSecondary },
                selectedType === 'INCOME' && { color: '#fff' }
              ]}>
                {t('dashboard.income_label')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Name Input */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('categories.name_label')}</Text>
          <TextInput
            style={[styles.input, { 
              backgroundColor: theme.background,
              borderColor: theme.border,
              color: theme.text,
              borderRadius: getRadius(56, 'small')
            }]}
            value={name}
            onChangeText={setName}
            placeholder={t('categories.name_placeholder')}
            placeholderTextColor={theme.textSecondary}
            maxLength={20}
          />
        </View>

        {/* Icon Selection */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('categories.icon_label')}</Text>
          <View style={styles.emojiGrid}>
            {EMOJI_OPTIONS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={[
                  styles.emojiButton,
                  { 
                    backgroundColor: theme.background,
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
        <View style={[styles.section, { backgroundColor: theme.card }]}>
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

        {/* Update Button */}
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: theme.tint, borderRadius: getRadius(56, 'small'), shadowColor: theme.tint }]} 
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>{t('categories.update_button')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons || [{ text: 'OK', onPress: () => setAlertVisible(false) }]}
        onClose={() => setAlertVisible(false)}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '700',
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
