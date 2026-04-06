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
  Alert,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { useDebounce } from '@/hooks/use-debounce';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function DashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Filter persistent values
  const [selectedType, setSelectedType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('all');
  
  // Collapsible category filter
  const [isCategoryExpanded, setIsCategoryExpanded] = useState(false);

  // Add transaction modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Alert state
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

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') loadData(true);
    });

    return () => {
      eventEmitter.off(EVENTS.TRANSACTION_ADDED, handleTransactionEvent);
      eventEmitter.off(EVENTS.TRANSACTION_UPDATED, handleTransactionEvent);
      subscription.remove();
    };
  }, [loadData]);

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

    if (selectedType !== 'ALL') {
      filtered = filtered.filter(t => t.type === selectedType);
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(t => selectedCategories.includes(t.categoryId));
    }

    return filtered;
  }, [transactionsWithCategory, selectedType, selectedCategories, selectedWalletId]);

  const hasActiveFilters = useMemo(() => 
    selectedCategories.length > 0 || selectedType !== 'ALL' || selectedWalletId !== 'all',
    [selectedCategories.length, selectedType, selectedWalletId]
  );

  const displayStats = useMemo(() => {
    if (!stats) return null;
    if (!hasActiveFilters) return stats;

    const totalIncome = filteredTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = filteredTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      ...stats,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    };
  }, [stats, filteredTransactions, hasActiveFilters]);

  const toggleCategory = useCallback((categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
    );
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

  const renderItem = useCallback(({ item }: { item: any }) => (
    <TransactionItemMemo transaction={item} onPress={handleTransactionPress} />
  ), [handleTransactionPress]);

  const renderHeader = useCallback(() => (
    <View style={styles.headerContainer}>
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[styles.toolbarButton, hasActiveFilters && styles.toolbarButtonActive]}
          onPress={() => setIsFilterOpen(true)}
        >
          <Ionicons name="filter" size={20} color={hasActiveFilters ? Colors.light.tint : '#1e293b'} />
          {hasActiveFilters && <View style={styles.filterBadge} />}
        </TouchableOpacity>

        <View style={styles.monthNavContainer}>
          <TouchableOpacity onPress={goToPreviousMonth} style={styles.monthNavButton}>
            <Ionicons name="chevron-back" size={20} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.monthText}>{formatMonthYear(currentDate)}</Text>
          <TouchableOpacity onPress={goToNextMonth} style={styles.monthNavButton}>
            <Ionicons name="chevron-forward" size={20} color="#1e293b" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={() => router.push('/search')}
        >
          <Ionicons name="search" size={20} color="#1e293b" />
        </TouchableOpacity>
      </View>

      {displayStats && <BalanceCard stats={displayStats} />}

      <View style={styles.quickMenuContainer}>
        <View style={styles.quickMenuGrid}>
          <TouchableOpacity style={styles.quickMenuItem} onPress={() => router.push('/subscriptions')}>
            <View style={[styles.quickMenuIcon, { backgroundColor: '#f1f5f9' }]}>
              <Feather name="calendar" size={22} color="#334155" />
            </View>
            <Text style={styles.quickMenuText} numberOfLines={1}>{t('features.subscriptions')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickMenuItem} onPress={() => router.push('/retirement')}>
            <View style={[styles.quickMenuIcon, { backgroundColor: '#f1f5f9' }]}>
              <Feather name="umbrella" size={22} color="#334155" />
            </View>
            <Text style={styles.quickMenuText} numberOfLines={1}>{t('features.retirement')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickMenuItem} onPress={() => router.push('/investment')}>
            <View style={[styles.quickMenuIcon, { backgroundColor: '#f1f5f9' }]}>
              <Feather name="trending-up" size={22} color="#334155" />
            </View>
            <Text style={styles.quickMenuText} numberOfLines={1}>{t('features.investment')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickMenuItem} onPress={() => router.push('/all-menus')}>
            <View style={[styles.quickMenuIcon, { backgroundColor: '#f1f5f9' }]}>
              <Feather name="grid" size={22} color="#334155" />
            </View>
            <Text style={styles.quickMenuText} numberOfLines={1}>{t('common.all_menus')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {filteredTransactions.length > 0 && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('dashboard.recent_transactions')}</Text>
          {hasActiveFilters && (
            <Text style={styles.sectionSubtitle}>
              {filteredTransactions.length} {t('common.results') || 'hasil'}
            </Text>
          )}
        </View>
      )}
    </View>
  ), [hasActiveFilters, currentDate, displayStats, filteredTransactions.length, t, router]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={filteredTransactions}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#e2e8f0" />
            <Text style={styles.emptyTitle}>{t('dashboard.no_transactions')}</Text>
            <Text style={styles.emptySubtitle}>{t('dashboard.no_results_desc')}</Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <AddTransactionModal
        visible={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setSelectedTransaction(null); }}
        transaction={selectedTransaction}
        onSuccess={() => loadData(true)}
      />

      {/* Modern Filter Modal */}
      <Modal visible={isFilterOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.dismissOverlay} onPress={() => setIsFilterOpen(false)} />
          <View style={styles.filterSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{t('common.filter') || 'Filter'}</Text>
              <TouchableOpacity onPress={() => setIsFilterOpen(false)} style={styles.closeSheet}>
                <Ionicons name="close" size={24} color="#1e293b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.sheetBody} showsVerticalScrollIndicator={false}>
              {/* Wallet Section */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionLabel}>{t('common.wallet') || 'Dompet'}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  <TouchableOpacity
                    style={[styles.filterChip, selectedWalletId === 'all' && styles.filterChipActive]}
                    onPress={() => setSelectedWalletId('all')}
                  >
                    <Text style={[styles.filterChipText, selectedWalletId === 'all' && styles.filterChipTextActive]}>
                      {t('common.all') || 'Semua'}
                    </Text>
                  </TouchableOpacity>
                  {wallets.map(w => (
                    <TouchableOpacity
                      key={w.id}
                      style={[styles.filterChip, selectedWalletId === w.id && styles.filterChipActive]}
                      onPress={() => setSelectedWalletId(w.id)}
                    >
                      <Ionicons name={w.icon as any} size={14} color={selectedWalletId === w.id ? '#fff' : w.color} />
                      <Text style={[styles.filterChipText, selectedWalletId === w.id && styles.filterChipTextActive]}>
                        {w.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Type Section */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionLabel}>{t('common.type') || 'Tipe'}</Text>
                <View style={styles.typeSwitcher}>
                  {['ALL', 'INCOME', 'EXPENSE'].map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.typeButton, selectedType === type && styles.typeButtonActive]}
                      onPress={() => setSelectedType(type as any)}
                    >
                      <Text style={[styles.typeButtonText, selectedType === type && styles.typeButtonTextActive]}>
                        {type === 'ALL' ? t('common.all') : type === 'INCOME' ? t('common.income') : t('common.expense')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Category Dropdown/Collapsible */}
              <View style={styles.filterSection}>
                <TouchableOpacity 
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setIsCategoryExpanded(!isCategoryExpanded);
                  }}
                  style={styles.dropdownTrigger}
                >
                  <Text style={styles.sectionLabel}>{t('common.category') || 'Kategori'}</Text>
                  <View style={styles.dropdownHeaderRight}>
                     {selectedCategories.length > 0 && <View style={styles.countBadge}><Text style={styles.countText}>{selectedCategories.length}</Text></View>}
                     <Ionicons name={isCategoryExpanded ? "chevron-up" : "chevron-down"} size={20} color="#64748b" />
                  </View>
                </TouchableOpacity>

                {isCategoryExpanded && (
                  <View style={styles.categoryGrid}>
                    {availableCategories.map(cat => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.categoryChip, selectedCategories.includes(cat.id) && styles.categoryChipActive]}
                        onPress={() => toggleCategory(cat.id)}
                      >
                        <Text style={styles.catIcon}>{cat.icon}</Text>
                        <Text style={[styles.catName, selectedCategories.includes(cat.id) && styles.catNameActive]}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.sheetFooter}>
              <TouchableOpacity style={styles.resetBtn} onPress={clearFilters}>
                <Text style={styles.resetBtnText}>{t('common.reset') || 'Reset'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={() => setIsFilterOpen(false)}>
                <Text style={styles.applyBtnText}>{t('common.apply') || 'Terapkan'}</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  headerContainer: { backgroundColor: '#fff' },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  toolbarButton: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  toolbarButtonActive: { backgroundColor: Colors.light.tint + '10' },
  filterBadge: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.light.tint },
  monthNavContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  monthNavButton: { padding: 8 },
  monthText: { fontSize: 15, fontWeight: '700', color: '#1e293b', minWidth: 120, textAlign: 'center' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#f8fafc', margin: 16, borderRadius: 16 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#1e293b', padding: 0 },
  quickMenuContainer: { paddingVertical: 16, borderBottomWidth: 8, borderBottomColor: '#f8fafc' },
  quickMenuGrid: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 10 },
  quickMenuItem: { alignItems: 'center', flex: 1 },
  quickMenuIcon: { width: 50, height: 50, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  quickMenuText: { fontSize: 10, fontWeight: '700', color: '#475569', textAlign: 'center', paddingHorizontal: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  sectionSubtitle: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  emptyContainer: { alignItems: 'center', padding: 100 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginTop: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
  dismissOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  filterSheet: { backgroundColor: '#fff', borderTopLeftRadius: 36, borderTopRightRadius: 36, height: SCREEN_HEIGHT * 0.75 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 24, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  closeSheet: { padding: 4 },
  sheetBody: { padding: 24 },
  filterSection: { marginBottom: 24 },
  sectionLabel: { fontSize: 14, fontWeight: '800', color: '#1e293b', marginBottom: 16 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: '#f1f5f9' },
  filterChipActive: { backgroundColor: Colors.light.tint },
  filterChipText: { fontSize: 13, fontWeight: '700', color: '#475569' },
  filterChipTextActive: { color: '#fff' },
  typeSwitcher: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 16, padding: 4 },
  typeButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  typeButtonActive: { backgroundColor: '#fff', elevation: 2, shadowOpacity: 0.05 },
  typeButtonText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  typeButtonTextActive: { color: Colors.light.tint },
  dropdownTrigger: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  countBadge: { backgroundColor: Colors.light.tint, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  countText: { fontSize: 10, fontWeight: '900', color: '#fff' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#f1f5f9' },
  categoryChipActive: { backgroundColor: Colors.light.tint + '10', borderColor: Colors.light.tint },
  catIcon: { fontSize: 16 },
  catName: { fontSize: 13, fontWeight: '600', color: '#475569' },
  catNameActive: { color: Colors.light.tint, fontWeight: '700' },
  sheetFooter: { flexDirection: 'row', gap: 12, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  resetBtn: { flex: 1, paddingVertical: 16, alignItems: 'center', borderRadius: 18, borderWidth: 1, borderColor: '#e2e8f0' },
  resetBtnText: { fontSize: 15, fontWeight: '800', color: '#64748b' },
  applyBtn: { flex: 2, backgroundColor: Colors.light.tint, paddingVertical: 16, alignItems: 'center', borderRadius: 18 },
  applyBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
