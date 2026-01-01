import { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  getDashboardStats,
  getTransactionsByMonth,
  getCategories,
  initializeCategories,
  type Transaction,
  type DashboardStats,
  type Category,
} from '@/lib/storage';
import { formatMonthYear } from '@/lib/format';
import { BalanceCard } from '@/components/dashboard/balance-card';
import { TransactionItem } from '@/components/dashboard/transaction-item';
import { AddTransactionModal } from '@/components/transactions/add-transaction-modal';
import { eventEmitter, EVENTS } from '@/lib/events';
import { updateWidget } from '@/lib/widget';

export default function DashboardScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Search & Filter states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Add transaction modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        console.log('🔄 [Dashboard] Refreshing data...');
      } else {
        setLoading(true);
        console.log('📊 [Dashboard] Loading initial data...');
      }

      await initializeCategories();

      console.log('📅 [Dashboard] Loading data for:', year, month);
      const [statsData, transactionsData, categoriesData] = await Promise.all([
        getDashboardStats(year, month),
        getTransactionsByMonth(year, month),
        getCategories(),
      ]);

      console.log('📊 [Dashboard] Stats loaded:', {
        totalIncome: statsData.totalIncome,
        totalExpense: statsData.totalExpense,
        balance: statsData.balance,
        transactionCount: statsData.transactionCount,
      });
      console.log('📊 [Dashboard] Transactions loaded:', transactionsData.length);
      console.log('📊 [Dashboard] Categories loaded:', categoriesData.length);

      setStats(statsData);
      setTransactions(transactionsData);
      setCategories(categoriesData);

      // Update widget with latest data
      updateWidget({
        balance: statsData.balance,
        income: statsData.totalIncome,
        expense: statsData.totalExpense,
        month: formatMonthYear(currentDate),
      });
    } catch (err) {
      console.error('❌ [Dashboard] Error loading dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [year, month, currentDate]);

  useEffect(() => {
    loadData();

    // Listen for transaction events
    const handleTransactionEvent = () => {
      loadData(true);
    };

    eventEmitter.on(EVENTS.TRANSACTION_ADDED, handleTransactionEvent);
    eventEmitter.on(EVENTS.TRANSACTION_UPDATED, handleTransactionEvent);

    // Listen for app state changes (when app comes to foreground)
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('📱 [Dashboard] App became active, refreshing data...');
        loadData(true);
      }
    });

    return () => {
      eventEmitter.off(EVENTS.TRANSACTION_ADDED, handleTransactionEvent);
      eventEmitter.off(EVENTS.TRANSACTION_UPDATED, handleTransactionEvent);
      subscription.remove();
    };
  }, [loadData]);

  const goToPreviousMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const handleTransactionPress = (transaction: TransactionWithCategory) => {
    // Find the original transaction
    const originalTransaction = transactions.find(t => t.id === transaction.id);
    if (originalTransaction) {
      setSelectedTransaction(originalTransaction);
      setIsAddModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setIsAddModalOpen(false);
    setSelectedTransaction(null);
  };

  const handleTransactionSuccess = () => {
    loadData(true);
  };

  type TransactionWithCategory = {
    id: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    date: string;
    notes?: string;
    category: {
      id: string;
      name: string;
      icon: string;
      color: string;
    };
  };

  const transactionsWithCategory: TransactionWithCategory[] = transactions.map(t => {
    const category = categories.find(c => c.id === t.categoryId) || {
      id: t.categoryId,
      name: 'Unknown',
      icon: '❓',
      color: '#9ca3af',
      type: t.type as 'INCOME' | 'EXPENSE',
    };
    
    return {
      id: t.id,
      amount: t.amount,
      type: t.type,
      date: t.date,
      notes: t.notes,
      category,
    };
  });

  // Filter transactions
  const filteredTransactions = transactionsWithCategory.filter(transaction => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = (
        transaction.category.name.toLowerCase().includes(query) ||
        transaction.notes?.toLowerCase().includes(query) ||
        transaction.amount.toString().includes(query)
      );
      if (!matchesSearch) return false;
    }

    // Type filter
    if (selectedType !== 'ALL' && transaction.type !== selectedType) {
      return false;
    }

    // Category filter
    if (selectedCategories.length > 0 && !selectedCategories.includes(transaction.category.id)) {
      return false;
    }

    return true;
  });

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedType('ALL');
  };

  const hasActiveFilters = selectedCategories.length > 0 || selectedType !== 'ALL';

  // Get unique categories from transactions
  const transactionCategories = Array.from(
    new Set(transactionsWithCategory.map(t => t.category.id))
  ).map(id => transactionsWithCategory.find(t => t.category.id === id)?.category).filter(Boolean) as Category[];

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Toolbar: Filter, Month, Search */}
      <View style={styles.toolbar}>
        {/* Filter Button */}
        <TouchableOpacity
          style={[styles.toolbarButton, hasActiveFilters && styles.toolbarButtonActive]}
          onPress={() => setIsFilterOpen(true)}
        >
          <Ionicons name="filter" size={20} color={hasActiveFilters ? '#3b82f6' : '#111827'} />
          {hasActiveFilters && <View style={styles.filterBadge} />}
        </TouchableOpacity>

        {/* Month Navigation */}
        <View style={styles.monthNavContainer}>
          <TouchableOpacity onPress={goToPreviousMonth} style={styles.monthNavButton}>
            <Ionicons name="chevron-back" size={20} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.monthText}>{formatMonthYear(currentDate)}</Text>
          <TouchableOpacity onPress={goToNextMonth} style={styles.monthNavButton}>
            <Ionicons name="chevron-forward" size={20} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Search Button */}
        <TouchableOpacity
          style={[styles.toolbarButton, isSearchOpen && styles.toolbarButtonActive]}
          onPress={() => setIsSearchOpen(!isSearchOpen)}
        >
          <Ionicons name="search" size={20} color={isSearchOpen ? '#3b82f6' : '#111827'} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      {isSearchOpen && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari transaksi..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
            placeholderTextColor="#9ca3af"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClear}>
              <Ionicons name="close-circle" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Balance Card */}
      {stats && <BalanceCard stats={stats} />}

      {/* Transactions Header */}
      {filteredTransactions.length > 0 && (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transaksi Terbaru</Text>
          {searchQuery || hasActiveFilters ? (
            <Text style={styles.sectionSubtitle}>
              {filteredTransactions.length} dari {transactionsWithCategory.length} transaksi
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Ionicons name="receipt-outline" size={48} color="#9ca3af" />
      </View>
      <Text style={styles.emptyTitle}>
        {searchQuery || hasActiveFilters ? 'Tidak Ada Hasil' : 'Belum Ada Transaksi'}
      </Text>
      <Text style={styles.emptyText}>
        {searchQuery || hasActiveFilters 
          ? 'Tidak ada transaksi yang cocok dengan pencarian'
          : 'Mulai catat transaksi Anda'}
      </Text>
      {(searchQuery || hasActiveFilters) && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => {
            setSearchQuery('');
            clearFilters();
          }}
        >
          <Text style={styles.clearButtonText}>Hapus Filter</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TransactionItem transaction={item} onPress={handleTransactionPress} />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />
        }
        contentContainerStyle={
          filteredTransactions.length === 0 ? styles.emptyContentContainer : undefined
        }
      />

      {/* Add/Edit Transaction Modal */}
      <AddTransactionModal
        visible={isAddModalOpen}
        onClose={handleModalClose}
        transaction={selectedTransaction}
        onSuccess={handleTransactionSuccess}
      />

      {/* Filter Modal */}
      <Modal
        visible={isFilterOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsFilterOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Transaksi</Text>
              <TouchableOpacity onPress={() => setIsFilterOpen(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Type Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Tipe Transaksi</Text>
                <View style={styles.filterOptions}>
                  {['ALL', 'INCOME', 'EXPENSE'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.filterChip,
                        selectedType === type && styles.filterChipActive,
                      ]}
                      onPress={() => setSelectedType(type as 'ALL' | 'INCOME' | 'EXPENSE')}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedType === type && styles.filterChipTextActive,
                        ]}
                      >
                        {type === 'ALL' ? 'Semua' : type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Category Filter */}
              {transactionCategories.length > 0 && (
                <View style={styles.filterSection}>
                  <Text style={styles.filterLabel}>Kategori</Text>
                  <View style={styles.filterOptions}>
                    {transactionCategories.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.filterChip,
                          selectedCategories.includes(category.id) && styles.filterChipActive,
                        ]}
                        onPress={() => toggleCategory(category.id)}
                      >
                        <Text style={styles.filterChipIcon}>{category.icon}</Text>
                        <Text
                          style={[
                            styles.filterChipText,
                            selectedCategories.includes(category.id) && styles.filterChipTextActive,
                          ]}
                        >
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={() => {
                  clearFilters();
                  setIsFilterOpen(false);
                }}
              >
                <Text style={styles.clearFiltersButtonText}>Hapus Filter</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setIsFilterOpen(false)}
              >
                <Text style={styles.applyButtonText}>Terapkan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    backgroundColor: '#f9fafb',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  toolbarButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    position: 'relative',
  },
  toolbarButtonActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
  monthNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthNavButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    minWidth: 140,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    padding: 0,
  },
  searchClear: {
    padding: 4,
  },
  summaryContainer: {
    padding: 16,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCardWrapper: {
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  emptyContentContainer: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  clearButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalBody: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  filterChipIcon: {
    fontSize: 16,
  },
  filterChipText: {
    fontSize: 14,
    color: '#6b7280',
  },
  filterChipTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  clearFiltersButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  clearFiltersButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
