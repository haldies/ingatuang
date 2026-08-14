import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TextInput,
  Modal,
  ScrollView,
  AppState,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import {
  storage,
  type Transaction,
  type DashboardStats,
  type Category,
  type Wallet,
} from '@/lib/storage/storage-adapter';
import { formatMonthYear, formatCurrency } from '@/lib/utils/format';
import { BalanceCard } from '@/components/dashboard/balance-card';
import { TransactionItemMemo } from '@/components/dashboard/transaction-item-memo';
import { CustomAlert } from '@/components/ui/custom-alert';
import { AddTransactionModal } from '@/components/transactions/add-transaction-modal';
import { eventEmitter, EVENTS } from '@/lib/utils/events';
import { updateWidget } from '@/lib/utils/widget';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Linking from 'expo-linking';
import { Colors, getRadius } from '@/constants/theme';
import { pullFromServer } from '@/lib/sync/sync-service';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('all');
  const [isCategoryExpanded, setIsCategoryExpanded] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>;
  }>({
    title: '',
    message: '',
    type: 'info',
    buttons: [{ text: 'OK', style: 'default' }],
  });

  const showAlert = (config: typeof alertConfig) => {
    setAlertConfig(config);
    setAlertVisible(true);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      else setRefreshing(true);

      await storage.initializeCategories();

      const [statsData, transactionsData, categoriesData, walletsData] = await Promise.all([
        storage.getDashboardStats(year, month, selectedWalletId),
        storage.getTransactionsByMonth(year, month),
        storage.getCategories(),
        storage.getWallets(),
      ]);

      setWallets(walletsData);
      setStats(statsData as DashboardStats);
      setTransactions(transactionsData);
      setCategories(categoriesData);

      updateWidget({
        balance: statsData.balance,
        income: statsData.totalIncome,
        expense: statsData.totalExpense,
        month: formatMonthYear(currentDate),
      });
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [year, month, selectedWalletId, currentDate]);

  useEffect(() => {
    loadData();
    const handleTransactionEvent = () => loadData(true);
    eventEmitter.on(EVENTS.TRANSACTION_ADDED, handleTransactionEvent);
    eventEmitter.on(EVENTS.TRANSACTION_UPDATED, handleTransactionEvent);
    eventEmitter.on(EVENTS.WALLET_UPDATED, handleTransactionEvent);

    // Auto-pull dari server saat app aktif kembali (misalnya balik dari Shortcut iPhone)
    const handleAppStateChange = async (nextAppState: string) => {
      if (nextAppState === 'active') {
        // Reload lokal dulu
        loadData(true);
        // Coba pull dari server jika sudah login
        try {
          const [user, token] = await Promise.all([
            storage.getUserInfo(),
            storage.getApiKey(),
          ]);
          if (user && token) {
            const newCount = await pullFromServer(token);
            if (newCount > 0) {
              // Ada data baru dari server → reload
              loadData(true);
            }
          }
        } catch {
          // Silent fail — jangan ganggu UX kalau server tidak bisa dicapai
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      eventEmitter.off(EVENTS.TRANSACTION_ADDED, handleTransactionEvent);
      eventEmitter.off(EVENTS.TRANSACTION_UPDATED, handleTransactionEvent);
      eventEmitter.off(EVENTS.WALLET_UPDATED, handleTransactionEvent);
      subscription.remove();
    };
  }, [loadData]);

  // Handle Deep Links (Assistant / Gemini)
  useEffect(() => {
    const handleDeepLink = (url: string) => {
      const { hostname, queryParams } = Linking.parse(url);
      
      if (hostname === 'expo-development-client') return;

      console.log('🔗 [DeepLink] Received URL:', url);
      
      if (queryParams?.assistant_action === 'add_transaction') {
        const notes = queryParams?.notes as string;
        const amountStr = queryParams?.amount as string;
        const amount = parseFloat(amountStr) || 0;
        
        setSelectedTransaction({
          id: 'temp-' + Date.now(),
          type: 'EXPENSE',
          amount: amount,
          date: new Date().toISOString(),
          notes: notes,
          categoryId: '',
          walletId: 'default',
          createdAt: new Date().toISOString(),
        });
        setIsAddModalOpen(true);
      }
    };

    Linking.getInitialURL().then(url => {
      if (url) handleDeepLink(url);
    });
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => subscription.remove();
  }, []);

  const goToPreviousMonth = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const handleTransactionPress = useCallback((transaction: any) => {
    const original = transactions.find(t => t.id === transaction.id);
    if (original) {
      setSelectedTransaction(original);
      setIsAddModalOpen(true);
    }
  }, [transactions]);

  const transactionsWithCategory = useMemo(() => {
    return transactions.map(t => ({
      ...t,
      category: categories.find(c => c.id === t.categoryId) || {
        id: t.categoryId,
        name: 'Unknown',
        icon: '❓',
        color: '#9ca3af',
        type: t.type as 'INCOME' | 'EXPENSE',
      }
    }));
  }, [transactions, categories]);

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactionsWithCategory];
    if (selectedWalletId !== 'all') {
      filtered = filtered.filter(t => t.walletId === selectedWalletId || (!t.walletId && selectedWalletId === 'default'));
    }
    if (selectedType !== 'ALL') filtered = filtered.filter(t => t.type === selectedType);
    if (selectedCategories.length > 0) filtered = filtered.filter(t => selectedCategories.includes(t.categoryId));
    return filtered;
  }, [transactionsWithCategory, selectedType, selectedCategories, selectedWalletId]);

  const hasActiveFilters = useMemo(() => 
    selectedCategories.length > 0 || selectedType !== 'ALL' || selectedWalletId !== 'all',
    [selectedCategories.length, selectedType, selectedWalletId]
  );

  const displayStats = useMemo(() => {
    if (!stats) return null;
    if (!hasActiveFilters) return stats;
    const totalIncome = filteredTransactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = filteredTransactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
    return { ...stats, totalIncome, totalExpense, balance: totalIncome - totalExpense };
  }, [stats, filteredTransactions, hasActiveFilters]);

  const toggleCategory = useCallback((categoryId: string) => {
    setSelectedCategories(prev => prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]);
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedCategories([]);
    setSelectedType('ALL');
    setSelectedWalletId('all');
  }, []);

  const availableCategories = useMemo(() => {
    if (selectedType === 'ALL') return categories;
    return categories.filter(c => c.type === selectedType);
  }, [categories, selectedType]);

  const renderHeader = useCallback(() => (
    <View style={[styles.headerContainer, { backgroundColor: theme.background }]}>
      <View style={[styles.toolbar, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={[
            styles.toolbarButton, 
            { backgroundColor: isDark ? theme.card : '#f8fafc' },
            hasActiveFilters && { backgroundColor: theme.tint + '15' }
          ]}
          onPress={() => setIsFilterOpen(true)}
        >
          <Ionicons name="filter" size={20} color={hasActiveFilters ? theme.tint : theme.text} />
          {hasActiveFilters && <View style={[styles.filterBadge, { backgroundColor: theme.tint }]} />}
        </TouchableOpacity>

        <View style={styles.monthNavContainer}>
          <TouchableOpacity onPress={goToPreviousMonth} style={styles.monthNavButton}>
            <Ionicons name="chevron-back" size={20} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.monthText, { color: theme.text }]}>{formatMonthYear(currentDate)}</Text>
          <TouchableOpacity onPress={goToNextMonth} style={styles.monthNavButton}>
            <Ionicons name="chevron-forward" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.toolbarButton, { backgroundColor: isDark ? theme.card : '#f8fafc' }]} 
          onPress={() => router.push('/search')}
        >
          <Ionicons name="search" size={20} color={theme.text} />
        </TouchableOpacity>
      </View>

      {displayStats && <BalanceCard stats={displayStats} />}

      <View style={[styles.quickMenuContainer, { borderBottomColor: isDark ? theme.background : '#f8fafc' }]}>
        <View style={styles.quickMenuGrid}>
          {[
            { id: 'subscriptions', name: t('features.subscriptions'), icon: 'calendar', path: '/subscriptions' },
            { id: 'retirement', name: t('features.retirement'), icon: 'umbrella', path: '/retirement' },
            { id: 'investment', name: t('features.investment'), icon: 'trending-up', path: '/investment' },
            { id: 'all-menus', name: t('common.all_menus'), icon: 'grid', path: '/all-menus' },
          ].map((item) => (
            <TouchableOpacity key={item.id} style={styles.quickMenuItem} onPress={() => router.push(item.path as any)}>
              <View style={[styles.quickMenuIcon, { backgroundColor: theme.card }]}>
                <Feather name={item.icon as any} size={22} color={isDark ? theme.textSecondary : '#334155'} />
              </View>
              <Text style={[styles.quickMenuText, { color: theme.textSecondary }]} numberOfLines={1}>
                {item.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {filteredTransactions.length > 0 && (
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('dashboard.recent_transactions')}</Text>
          {hasActiveFilters && (
            <Text style={styles.sectionSubtitle}>{filteredTransactions.length} {t('common.results')}</Text>
          )}
        </View>
      )}
    </View>
  ), [hasActiveFilters, currentDate, displayStats, filteredTransactions.length, t, router, theme, isDark]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={{ height: insets.top, backgroundColor: theme.background }} />

      <FlatList
        data={filteredTransactions}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <TransactionItemMemo transaction={item} onPress={handleTransactionPress} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={isDark ? theme.card : '#e2e8f0'} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>{t('dashboard.no_transactions')}</Text>
            <Text style={styles.emptySubtitle}>{t('dashboard.no_results_desc')}</Text>
          </View>
        }
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => loadData(true)} 
            tintColor={theme.tint}
          />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <AddTransactionModal
        visible={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setSelectedTransaction(null); }}
        transaction={selectedTransaction}
        onSuccess={() => loadData(true)}
      />

      <Modal visible={isFilterOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.dismissOverlay} onPress={() => setIsFilterOpen(false)} />
          <View style={[
            styles.filterSheet, 
            { 
              backgroundColor: theme.background,
              borderTopLeftRadius: getRadius(400, 'large'), 
              borderTopRightRadius: getRadius(400, 'large') 
            }
          ]}>
            <View style={[styles.sheetHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.sheetTitle, { color: theme.text }]}>{t('common.filter')}</Text>
              <TouchableOpacity onPress={() => setIsFilterOpen(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.sheetBody}>
              <View style={styles.filterSection}>
                <Text style={[styles.sectionLabel, { color: theme.text }]}>{t('common.wallet')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  <TouchableOpacity 
                    style={[
                      styles.filterChip, 
                      { backgroundColor: theme.card },
                      selectedWalletId === 'all' && { backgroundColor: theme.tint }
                    ]} 
                    onPress={() => setSelectedWalletId('all')}
                  >
                    <Text style={[
                      styles.filterChipText, 
                      { color: theme.text },
                      selectedWalletId === 'all' && { color: '#fff' }
                    ]}>
                      {t('common.all')}
                    </Text>
                  </TouchableOpacity>
                  {wallets.map(w => (
                    <TouchableOpacity 
                      key={w.id} 
                      style={[
                        styles.filterChip, 
                        { backgroundColor: theme.card },
                        selectedWalletId === w.id && { backgroundColor: theme.tint }
                      ]} 
                      onPress={() => setSelectedWalletId(w.id)}
                    >
                      <Ionicons name={w.icon as any} size={14} color={selectedWalletId === w.id ? '#fff' : w.color} />
                      <Text style={[
                        styles.filterChipText, 
                        { color: theme.text },
                        selectedWalletId === w.id && { color: '#fff' }
                      ]}>
                        {w.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.filterSection}>
                <Text style={[styles.sectionLabel, { color: theme.text }]}>{t('common.type')}</Text>
                <View style={[styles.typeSwitcher, { backgroundColor: theme.card }]}>
                  {['ALL', 'INCOME', 'EXPENSE'].map(type => (
                    <TouchableOpacity 
                      key={type} 
                      style={[
                        styles.typeButton, 
                        selectedType === type && { backgroundColor: isDark ? theme.border : '#fff', elevation: 2, shadowOpacity: 0.05 }
                      ]} 
                      onPress={() => setSelectedType(type as any)}
                    >
                      <Text style={[
                        styles.typeButtonText, 
                        { color: theme.textSecondary },
                        selectedType === type && { color: theme.tint }
                      ]}>
                        {type === 'ALL' ? t('common.all') : type === 'INCOME' ? t('common.income') : t('common.expense')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={[styles.sectionLabel, { color: theme.text, marginBottom: 0 }]}>{t('common.category')}</Text>
                  {availableCategories.length > 6 && (
                    <TouchableOpacity onPress={() => setIsCategoryExpanded(!isCategoryExpanded)}>
                      <Text style={{ fontSize: 13, color: theme.tint, fontWeight: '700' }}>
                        {isCategoryExpanded ? t('common.show_less') : t('common.show_all')}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {(isCategoryExpanded ? availableCategories : availableCategories.slice(0, 6)).map(cat => (
                    <TouchableOpacity 
                      key={cat.id} 
                      style={[
                        styles.filterChip, 
                        { backgroundColor: theme.card },
                        selectedCategories.includes(cat.id) && { backgroundColor: theme.tint }
                      ]} 
                      onPress={() => toggleCategory(cat.id)}
                    >
                      <Text style={{ fontSize: 14 }}>{cat.icon}</Text>
                      <Text style={[
                        styles.filterChipText, 
                        { color: theme.text },
                        selectedCategories.includes(cat.id) && { color: '#fff' }
                      ]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            <View style={[styles.sheetFooter, { borderTopColor: theme.border }]}>
               <TouchableOpacity 
                  style={[styles.resetBtn, { borderColor: theme.border }]} 
                  onPress={clearFilters}
                >
                  <Text style={styles.resetBtnText}>{t('common.reset')}</Text>
                </TouchableOpacity>
               <TouchableOpacity 
                  style={[styles.applyBtn, { backgroundColor: theme.tint }]} 
                  onPress={() => setIsFilterOpen(false)}
                >
                  <Text style={styles.applyBtnText}>{t('common.apply')}</Text>
                </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <CustomAlert 
        visible={alertVisible} 
        title={alertConfig.title} 
        message={alertConfig.message} 
        type={alertConfig.type} 
        buttons={alertConfig.buttons} 
        onClose={() => setAlertVisible(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: { },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  toolbarButton: { width: 40, height: 40, borderRadius: getRadius(40), alignItems: 'center', justifyContent: 'center' },
  filterBadge: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4 },
  monthNavContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  monthNavButton: { padding: 8 },
  monthText: { fontSize: 15, fontWeight: '700', minWidth: 120, textAlign: 'center' },
  quickMenuContainer: { paddingVertical: 16, borderBottomWidth: 8 },
  quickMenuGrid: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 10 },
  quickMenuItem: { alignItems: 'center', flex: 1 },
  quickMenuIcon: { width: 50, height: 50, borderRadius: getRadius(50), justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  quickMenuText: { fontSize: 10, fontWeight: '700', textAlign: 'center', paddingHorizontal: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  sectionSubtitle: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  emptyContainer: { alignItems: 'center', padding: 100 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginTop: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
  dismissOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  filterSheet: { height: SCREEN_HEIGHT * 0.75 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 24, borderBottomWidth: 1 },
  sheetTitle: { fontSize: 20, fontWeight: '800' },
  sheetBody: { padding: 24 },
  filterSection: { marginBottom: 24 },
  sectionLabel: { fontSize: 14, fontWeight: '800', marginBottom: 16 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: getRadius(44) },
  filterChipText: { fontSize: 13, fontWeight: '700' },
  typeSwitcher: { flexDirection: 'row', borderRadius: getRadius(60), padding: 4 },
  typeButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: getRadius(52) },
  typeButtonText: { fontSize: 13, fontWeight: '700' },
  sheetFooter: { flexDirection: 'row', gap: 12, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, borderTopWidth: 1 },
  resetBtn: { flex: 1, paddingVertical: 16, alignItems: 'center', borderRadius: getRadius(56), borderWidth: 1 },
  resetBtnText: { fontSize: 15, fontWeight: '800', color: '#64748b' },
  applyBtn: { flex: 2, paddingVertical: 16, alignItems: 'center', borderRadius: getRadius(56) },
  applyBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
