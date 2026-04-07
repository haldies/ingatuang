import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, getRadius } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { Header } from '@/components/ui/header';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 4; 
const RECENT_KEY = '@recent_features';

const MENU_GROUPS = [
  {
    title_key: 'main_features',
    items: [
      { id: 'tax', title: 'Pajak PPh', icon: 'calculator-outline', color: Colors.light.tint, route: '/tax-calculator' },
      { id: 'wallets', title: 'Dompet', icon: 'wallet-outline', color: Colors.light.tint, route: '/wallets' },
      { id: 'subscriptions', title: 'Tagihan', icon: 'calendar-outline', color: Colors.light.tint, route: '/subscriptions' },
    ],
  },
  {
    title_key: 'planning_calculators',
    items: [
      { id: 'split', title: 'Split Bill', icon: 'git-branch-outline', color: '#64748b', route: '/split-bill', isBeta: true },
      { id: 'investment', title: 'Investasi', icon: 'trending-up-outline', color: '#64748b', route: '/investment' },
      { id: 'retirement', title: 'Pensiun', icon: 'pie-chart-outline', color: '#64748b', route: '/retirement' },
      { id: 'kpr', title: 'KPR', icon: 'home-outline', color: '#64748b', route: '/kpr' },
      { id: 'emergency', title: 'Emergency', icon: 'shield-outline', color: '#64748b', route: '/emergency' },
      { id: 'education', title: 'Edukasi', icon: 'school-outline', color: '#64748b', route: '/education', isBeta: true },
      { id: 'vacation', title: 'Liburan', icon: 'airplane-outline', color: '#64748b', route: '/vacation', isBeta: true },
    ],
  },
];

export default function AllMenusScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [recentIds, setRecentIds] = useState<string[]>([]);

  useEffect(() => { loadRecent(); }, []);

  const loadRecent = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_KEY);
      if (stored) setRecentIds(JSON.parse(stored));
    } catch (e) { console.error(e); }
  };

  const handleMenuPress = async (item: any) => {
    try {
      let updated = [item.id, ...recentIds.filter(rid => rid !== item.id)].slice(0, 4);
      setRecentIds(updated);
      await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch (e) { console.error(e); }
    if (item.route) router.push(item.route);
  };

  const allFlatMenus = MENU_GROUPS.flatMap(g => g.items);
  const recentMenus = allFlatMenus.filter(m => recentIds.includes(m.id));

  const renderItem = (item: any) => (
    <TouchableOpacity key={item.id} style={styles.menuItem} onPress={() => handleMenuPress(item)}>
      <View style={[styles.iconContainer, { borderRadius: getRadius(64) }]}>
        <Ionicons name={item.icon as any} size={28} color={item.id === 'tax' || item.id === 'wallets' || item.id === 'subscriptions' ? Colors.light.tint : '#475569'} />
        {item.isBeta && <View style={[styles.betaBadge, { borderRadius: getRadius(18) }]}><Text style={styles.betaText}>BETA</Text></View>}
      </View>
      <Text style={styles.itemTitle} numberOfLines={1}>{t('features.' + item.id)}</Text>
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper backgroundColor="#fff">
      <Header title={t('common.all_menus')} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {recentMenus.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('common.recent')}</Text>
            <View style={styles.grid}>{recentMenus.map(renderItem)}</View>
          </View>
        )}

        {MENU_GROUPS.map((group, idx) => (
          <View key={idx} style={styles.section}>
            <Text style={styles.sectionTitle}>{t('common.' + group.title_key)}</Text>
            <View style={styles.grid}>{group.items.map(renderItem)}</View>
          </View>
        ))}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 24 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 11, fontWeight: '900', color: '#94a3b8', letterSpacing: 1, marginBottom: 20, paddingLeft: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  menuItem: { width: COLUMN_WIDTH, alignItems: 'center', marginBottom: 24, marginHorizontal: 4 },
  iconContainer: { width: 64, height: 64, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  itemTitle: { fontSize: 11, fontWeight: '700', color: '#334155', textAlign: 'center' },
  betaBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: Colors.light.tint + '15', paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: Colors.light.tint + '30' },
  betaText: { fontSize: 7, fontWeight: '900', color: Colors.light.tint },
});
