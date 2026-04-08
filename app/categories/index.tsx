import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, useColorScheme as useNativeColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { storage, Category } from '@/lib/storage/storage-adapter';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/ui/header';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { Colors, getRadius } from '@/constants/theme';

export default function CategoriesScreen() {
  const { t } = useTranslation();
  const colorScheme = useNativeColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await storage.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [])
  );

  const filteredCategories = categories.filter(c => c.type === selectedType);

  return (
    <ScreenWrapper backgroundColor={theme.background}>
      <Header 
        title={t('categories.header')} 
        rightIcon="plus" 
        onRightPress={() => router.push('/categories/create')} 
      />

      <View style={[styles.tabContainer, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <View style={[styles.tabContent, { 
          backgroundColor: isDark ? '#1a1a1a' : '#f1f5f9',
          borderRadius: getRadius(48, 'small')
        }]}>
          <TouchableOpacity
            style={[
              styles.tab, 
              selectedType === 'EXPENSE' && { backgroundColor: theme.tint, borderRadius: getRadius(40, 'small') }
            ]}
            onPress={() => setSelectedType('EXPENSE')}
          >
            <Text style={[
              styles.tabText, 
              { color: isDark ? '#94a3b8' : '#64748b' },
              selectedType === 'EXPENSE' && { color: '#fff' }
            ]}>
              {t('dashboard.expense_label')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab, 
              selectedType === 'INCOME' && { backgroundColor: theme.tint, borderRadius: getRadius(40, 'small') }
            ]}
            onPress={() => setSelectedType('INCOME')}
          >
            <Text style={[
              styles.tabText, 
              { color: isDark ? '#94a3b8' : '#64748b' },
              selectedType === 'INCOME' && { color: '#fff' }
            ]}>
              {t('dashboard.income_label')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.tint} />
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          <View style={styles.categoriesGrid}>
            {filteredCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryCard, { 
                  backgroundColor: isDark ? '#1a1a1a' : '#fff',
                  borderRadius: getRadius(110, 'medium'),
                  borderColor: theme.border,
                  borderWidth: isDark ? 1 : 0
                }]}
                onPress={() => router.push(`/categories/edit?id=${category.id}`)}
              >
                <View style={[styles.categoryIcon, { backgroundColor: category.color + '20', borderRadius: getRadius(48, 'small') }]}>
                  <Text style={styles.categoryEmoji}>{category.icon}</Text>
                </View>
                <Text style={[styles.categoryName, { color: theme.text }]} numberOfLines={1}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {filteredCategories.length === 0 && (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? '#1a1a1a' : '#f8fafc', borderRadius: getRadius(100, 'medium') }]}>
                 <Ionicons name="pricetags-outline" size={48} color={isDark ? '#475569' : '#cbd5e1'} />
              </View>
              <Text style={[styles.emptyText, { color: theme.text }]}>{t('categories.no_categories')}</Text>
              <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                {t('categories.add_instruction')}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  tabContent: {
    flexDirection: 'row',
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 14,
    gap: 12,
  },
  categoryCard: {
    width: '30.8%',
    aspectRatio: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  categoryIcon: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  categoryEmoji: {
    fontSize: 26,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
});
