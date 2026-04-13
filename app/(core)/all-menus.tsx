import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  useColorScheme as useNativeColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, getRadius } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { Header } from '@/components/ui/header';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 64) / 4; 
const RECENT_KEY = '@recent_features';

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  route: string;
  isPrimary?: boolean;
  isBeta?: boolean;
}

interface MenuGroup {
  title_key: string;
  items: MenuItem[];
}

const MENU_GROUPS: MenuGroup[] = [
  {
    title_key: 'main_features',
    items: [
      { id: 'tax', title: 'Pajak PPh', icon: 'calculator-outline', isPrimary: true, route: '/tax-calculator' },
      { id: 'subscriptions', title: 'Tagihan', icon: 'calendar-outline', isPrimary: true, route: '/subscriptions' },
    ],
  },
  {
    title_key: 'planning_calculators',
    items: [
      { id: 'split', title: 'Split Bill', icon: 'git-branch-outline', route: '/split-bill', isBeta: true },
      { id: 'investment', title: 'Investasi', icon: 'trending-up-outline', route: '/investment' },
      { id: 'retirement', title: 'Pensiun', icon: 'pie-chart-outline', route: '/retirement' },
      { id: 'kpr', title: 'KPR', icon: 'home-outline', route: '/kpr' },
      { id: 'emergency', title: 'Emergency', icon: 'shield-outline', route: '/emergency' },
      { id: 'education', title: 'Edukasi', icon: 'school-outline', route: '/education', isBeta: true },
      { id: 'vacation', title: 'Liburan', icon: 'airplane-outline', route: '/vacation', isBeta: true },
    ],
  },
];

export default function AllMenusScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useNativeColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  
  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => { loadRecent(); }, []);

  const loadRecent = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_KEY);
      if (stored) setRecentIds(JSON.parse(stored));
    } catch (e) { console.error(e); }
  };

  const handleMenuPress = async (item: MenuItem) => {
    try {
      let updated = [item.id, ...recentIds.filter(rid => rid !== item.id)].slice(0, 4);
      setRecentIds(updated);
      await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch (e) { console.error(e); }
    if (item.route) router.push(item.route as any);
  };

  const allFlatMenus = MENU_GROUPS.flatMap(g => g.items);
  const recentMenus = allFlatMenus.filter(m => recentIds.includes(m.id));

  const renderItem = (item: MenuItem) => (
    <TouchableOpacity key={item.id} style={styles.menuItem} onPress={() => handleMenuPress(item)} activeOpacity={0.7}>
      <View style={[
        styles.iconContainer, 
        { 
          backgroundColor: isDark ? '#1a1a1a' : '#f8fafc', 
          borderRadius: getRadius(56, 'small'),
          borderColor: theme.border,
        }
      ]}>
        <Ionicons 
          name={item.icon as any} 
          size={24} 
          color={item.isPrimary ? theme.tint : theme.textSecondary} 
        />
        {item.isBeta && (
          <View style={[
            styles.betaBadge, 
            { 
              backgroundColor: theme.tint, 
              borderRadius: getRadius(18, 'small') 
            }
          ]}>
            <Text style={styles.betaText}>BETA</Text>
          </View>
        )}
      </View>
      <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={1}>{t('features.' + item.id)}</Text>
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper backgroundColor={theme.background}>
      <Header title={t('common.all_menus')} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60, paddingTop: 16 }}>
        {recentMenus.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('common.recent')}</Text>
            <View style={styles.grid}>{recentMenus.map(renderItem)}</View>
          </View>
        )}

        {MENU_GROUPS.map((group, idx) => (
          <View key={idx} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('common.' + group.title_key)}</Text>
            <View style={styles.grid}>{group.items.map(renderItem)}</View>
          </View>
        ))}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 20 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 20, paddingLeft: 4, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -8 },
  menuItem: { width: COLUMN_WIDTH, alignItems: 'center', marginBottom: 24, marginHorizontal: 8 },
  iconContainer: { 
    width: 60, 
    height: 60, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 12, 
    borderWidth: 1,
  },
  itemTitle: { fontSize: 11, fontWeight: '800', textAlign: 'center', letterSpacing: -0.2 },
  betaBadge: { position: 'absolute', top: -4, right: -4, paddingHorizontal: 6, paddingVertical: 2 },
  betaText: { fontSize: 6, fontWeight: '900', color: '#fff' },
});
