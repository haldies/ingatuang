import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TextInput,
  ScrollView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import {
  storage,
  type Transaction,
  type Category,
  type Wallet,
} from '@/lib/storage/storage-adapter';
import { formatCurrency } from '@/lib/utils/format';
import { TransactionItemMemo } from '@/components/dashboard/transaction-item-memo';
import { AddTransactionModal } from '@/components/transactions/add-transaction-modal';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/theme';
import { useDebounce } from '@/hooks/use-debounce';

export default function SearchScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 200);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [selectedType, setSelectedType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [allTransactions, allCategories, allWallets] = await Promise.all([
        storage.getTransactions(), // All time transactions for search
        storage.getCategories(),
        storage.getWallets(),
      ]);

      setTransactions(allTransactions);
      setCategories(allCategories);
      setWallets(allWallets);
    } catch (err) {
      console.error('Error loading search data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Auto focus input
    setTimeout(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, 150);
  }, [loadData]);

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

    if (debouncedSearchQuery) {
      const q = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.category.name.toLowerCase().includes(q) ||
        t.notes?.toLowerCase().includes(q) ||
        t.amount.toString().includes(q)
      );
    }

    if (selectedWalletId !== 'all') {
      filtered = filtered.filter(t => t.walletId === selectedWalletId || (!t.walletId && selectedWalletId === 'default'));
    }

    if (selectedType !== 'ALL') {
      filtered = filtered.filter(t => t.type === selectedType);
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(t => selectedCategories.includes(t.categoryId));
    }

    // Sort by date desc (default)
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactionsWithCategory, debouncedSearchQuery, selectedType, selectedCategories, selectedWalletId]);

  const handleTransactionPress = useCallback((transaction: any) => {
    const original = transactions.find(t => t.id === transaction.id);
    if (original) {
      setSelectedTransaction(original);
      setIsAddModalOpen(true);
    }
  }, [transactions]);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <TransactionItemMemo transaction={item} onPress={handleTransactionPress} />
  ), [handleTransactionPress]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#94a3b8" />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder={t('dashboard.search_placeholder') || "Cari transaksi..."}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#cbd5e1" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Quick Filters */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {/* Type Filter */}
          {['ALL', 'INCOME', 'EXPENSE'].map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.filterChip, selectedType === type && styles.filterChipActive]}
              onPress={() => setSelectedType(type as any)}
            >
              <Text style={[styles.filterChipText, selectedType === type && styles.filterChipTextActive]}>
                {type === 'ALL' ? t('common.all') : type === 'INCOME' ? t('common.income') : t('common.expense')}
              </Text>
            </TouchableOpacity>
          ))}
          
          <View style={styles.divider} />

          {/* Wallets */}
          {wallets.map(w => (
            <TouchableOpacity
              key={w.id}
              style={[styles.filterChip, selectedWalletId === w.id && styles.filterChipActive]}
              onPress={() => setSelectedWalletId(selectedWalletId === w.id ? 'all' : w.id)}
            >
              {w.icon && <Text style={{ fontSize: 12 }}>{w.icon}</Text>}
              <Text style={[styles.filterChipText, selectedWalletId === w.id && styles.filterChipTextActive]}>
                {w.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color="#f1f5f9" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? t('dashboard.no_results') : t('dashboard.start_searching') || 'Cari transaksi'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? t('dashboard.no_results_desc') : t('dashboard.search_desc') || 'Cari berdasarkan kategori, catatan, atau nominal'}
            </Text>
          </View>
        }
        onScrollBeginDrag={Keyboard.dismiss}
      />

      <AddTransactionModal
        visible={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setSelectedTransaction(null); }}
        transaction={selectedTransaction}
        onSuccess={() => loadData()}
      />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 48,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '600',
  },
  filterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  filterChipActive: {
    backgroundColor: '#0f172a',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 4,
  },
  listContent: {
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
