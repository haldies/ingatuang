import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { initI18n } from '@/lib/utils/i18n'; // Force load check

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 32) / 4; 

const PRIMARY_COLOR = Colors.light.tint;
const PLAIN_COLOR = '#94a3b8'; 

const RECENT_KEY = '@recent_features';

const MENU_GROUPS = [
  {
    title_key: 'main_features',
    items: [
      { id: 'tax', title: 'Pajak PPh', icon: 'calculator-outline', color: PRIMARY_COLOR, route: '/tax-calculator', isBeta: false },
      { id: 'manual', title: 'Manual', icon: 'receipt-outline', color: PRIMARY_COLOR, action: 'transaction', isBeta: false },
      { id: 'quick', title: 'Cepat', icon: 'sparkles-outline', color: PRIMARY_COLOR, action: 'quick-add', isBeta: false },
      { id: 'wallets', title: 'Dompet', icon: 'wallet-outline', color: PRIMARY_COLOR, route: '/wallets', isBeta: false },
      { id: 'subscriptions', title: 'Tagihan', icon: 'calendar-outline', color: PRIMARY_COLOR, route: '/subscriptions', isBeta: false },
    ],
  },
  {
    title_key: 'planning_calculators',
    items: [
      { id: 'split', title: 'Split Bill', icon: 'git-branch-outline', color: PLAIN_COLOR, route: '/split-bill', isBeta: true },
      { id: 'investment', title: 'Investasi', icon: 'trending-up-outline', color: PLAIN_COLOR, route: '/investment', isBeta: false },
      { id: 'retirement', title: 'Pensiun', icon: 'pie-chart-outline', color: PLAIN_COLOR, route: '/retirement', isBeta: false },
      { id: 'kpr', title: 'Simulasi KPR', icon: 'home-outline', color: PLAIN_COLOR, route: '/kpr', isBeta: false },
      { id: 'emergency', title: 'Dana Darurat', icon: 'shield-outline', color: PLAIN_COLOR, route: '/emergency', isBeta: false },
      { id: 'education', title: 'Pendidikan', icon: 'school-outline', color: PLAIN_COLOR, route: '/education', isBeta: true },
      { id: 'vacation', title: 'Plan Liburan', icon: 'airplane-outline', color: PLAIN_COLOR, route: '/vacation', isBeta: true },
    ],
  },
];

export default function AllMenusScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => {
    loadRecent();
  }, []);

  const loadRecent = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_KEY);
      if (stored) setRecentIds(JSON.parse(stored));
    } catch (e) {
      console.error(e);
    }
  };

  const trackFeature = async (id: string) => {
    try {
      let updated = [id, ...recentIds.filter(rid => rid !== id)].slice(0, 4);
      setRecentIds(updated);
      await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMenuPress = (item: any) => {
    trackFeature(item.id);
    if (item.route) {
      router.push(item.route);
    } else {
      router.back();
    }
  };

  const allFlatMenus = MENU_GROUPS.flatMap(g => g.items);
  const recentMenus = allFlatMenus.filter(m => recentIds.includes(m.id));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('common.all_menus')}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {recentMenus.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('common.recent')}</Text>
            <View style={styles.grid}>
              {recentMenus.map((item) => (
                <TouchableOpacity
                  key={`recent-${item.id}`}
                  style={styles.menuItem}
                  onPress={() => handleMenuPress(item)}
                >
                  <View style={styles.iconBox}>
                    <Ionicons name={item.icon as any} size={34} color={item.color} />
                    {item.isBeta && (
                      <View style={styles.betaBadge}>
                        <Text style={styles.betaText}>BETA</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.itemTitle} numberOfLines={1}>{t('features.' + item.id)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {MENU_GROUPS.map((group, groupIdx) => (
          <View key={groupIdx} style={styles.section}>
            <Text style={styles.sectionTitle}>{t('common.' + group.title_key)}</Text>
            <View style={styles.grid}>
              {group.items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={() => handleMenuPress(item)}
                >
                  <View style={styles.iconBox}>
                    <Ionicons name={item.icon as any} size={34} color={item.color} />
                    {item.isBeta && (
                      <View style={styles.betaBadge}>
                        <Text style={styles.betaText}>BETA</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.itemTitle} numberOfLines={1}>{t('features.' + item.id)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    paddingLeft: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  menuItem: {
    width: COLUMN_WIDTH,
    alignItems: 'center',
    marginBottom: 28,
  },
  iconBox: {
    width: COLUMN_WIDTH,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  betaBadge: {
    position: 'absolute',
    top: 0,
    right: 14,
    backgroundColor: PRIMARY_COLOR + '20', // Very light primary background
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: PRIMARY_COLOR + '40',
  },
  betaText: {
    fontSize: 7,
    fontWeight: '800',
    color: PRIMARY_COLOR,
  },
  itemTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
});
