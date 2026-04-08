import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TextInput,
  ScrollView,
  Keyboard,
  ActivityIndicator,
  useColorScheme as useNativeColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  storage,
  type Transaction,
  type Category,
  type Wallet,
} from '@/lib/storage/storage-adapter';
import { TransactionItemMemo } from '@/components/dashboard/transaction-item-memo';
import { AddTransactionModal } from '@/components/transactions/add-transaction-modal';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors, getRadius } from '@/constants/theme';
import { useDebounce } from '@/hooks/use-debounce';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';

export default function SearchScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useNativeColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const inputRef = useRef<TextInput>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 200);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedType, setSelectedType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [allTransactions, allCategories, allWallets] = await Promise.all([
        storage.getTransactions(),
        storage.getCategories(),
        storage.getWallets(),
      ]);
      setTransactions(allTransactions);
      setCategories(allCategories);
      setWallets(allWallets);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadData();
    const timer = setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 300);
    return () => clearTimeout(timer);
  }, [loadData]);

  const filteredTransactions = useMemo(() => {
    let filtered = transactions.map(t => ({
      ...t,
      category: categories.find(c => c.id === t.categoryId) || { id: t.categoryId, name: 'Unknown', icon: '❓', color: '#9ca3af', type: t.type as 'INCOME' | 'EXPENSE' }
    }));
    if (debouncedSearchQuery) {
      const q = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(t => t.category.name.toLowerCase().includes(q) || t.notes?.toLowerCase().includes(q) || t.amount.toString().includes(q));
    }
    if (selectedWalletId !== 'all') filtered = filtered.filter(t => t.walletId === selectedWalletId || (!t.walletId && selectedWalletId === 'default'));
    if (selectedType !== 'ALL') filtered = filtered.filter(t => t.type === selectedType);
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, categories, debouncedSearchQuery, selectedType, selectedWalletId]);

  return (
    <ScreenWrapper backgroundColor={theme.background}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity 
          style={[styles.backBtn, { borderRadius: getRadius(40) }]} 
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={[styles.searchBar, { 
          backgroundColor: isDark ? '#1a1a1a' : '#f8fafc',
          borderRadius: getRadius(56, 'small'),
          borderColor: theme.border,
          borderWidth: isDark ? 1 : 0
        }]}>
          <Ionicons name="search" size={20} color={isDark ? '#475569' : '#94a3b8'} />
          <TextInput 
            ref={inputRef} 
            style={[styles.searchInput, { color: theme.text }]} 
            placeholder={t('dashboard.search_placeholder') || "Cari transaksi..."} 
            placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
            value={searchQuery} 
            onChangeText={setSearchQuery} 
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={20} color={isDark ? '#475569' : '#cbd5e1'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={[styles.filterArea, { borderBottomColor: theme.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {['ALL', 'INCOME', 'EXPENSE'].map(type => (
            <TouchableOpacity 
              key={type} 
              style={[
                styles.chip, 
                { 
                  backgroundColor: isDark ? '#1a1a1a' : '#f1f5f9',
                  borderRadius: getRadius(44, 'small') 
                }, 
                selectedType === type && { backgroundColor: theme.tint }
              ]} 
              onPress={() => setSelectedType(type as any)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.chipText, 
                { color: isDark ? '#94a3b8' : '#64748b' },
                selectedType === type && { color: '#fff' }
              ]}>
                {type === 'ALL' ? 'Semua' : type === 'INCOME' ? 'Masuk' : 'Keluar'}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          {wallets.map(w => (
            <TouchableOpacity 
              key={w.id} 
              style={[
                styles.chip, 
                { 
                  backgroundColor: isDark ? '#1a1a1a' : '#f1f5f9',
                  borderRadius: getRadius(44, 'small') 
                }, 
                selectedWalletId === w.id && { backgroundColor: theme.tint }
              ]} 
              onPress={() => setSelectedWalletId(selectedWalletId === w.id ? 'all' : w.id)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.chipText, 
                { color: isDark ? '#94a3b8' : '#64748b' },
                selectedWalletId === w.id && { color: '#fff' }
              ]}>
                {w.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.tint} />
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TransactionItemMemo 
              transaction={item} 
              onPress={(t) => { 
                setSelectedTransaction(transactions.find(ot => ot.id === t.id) || null); 
                setIsAddModalOpen(true); 
              }} 
            />
          )}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}
          ListEmptyComponent={(
            <View style={styles.empty}>
              <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? '#1a1a1a' : '#f8fafc', borderRadius: getRadius(100, 'medium') }]}>
                <Ionicons name="search-outline" size={48} color={isDark ? '#475569' : '#cbd5e1'} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                {searchQuery ? 'Tidak ada hasil' : 'Mulai mencari'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Coba cari berdasarkan nama kategori atau catatan transaksi
              </Text>
            </View>
          )}
          onScrollBeginDrag={Keyboard.dismiss}
        />
      )}

      <AddTransactionModal 
        visible={isAddModalOpen} 
        onClose={() => { setIsAddModalOpen(false); setSelectedTransaction(null); }} 
        transaction={selectedTransaction} 
        onSuccess={loadData} 
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    gap: 12, 
    borderBottomWidth: 1, 
  },
  backBtn: { 
    width: 40, 
    height: 40, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginLeft: -4,
  },
  searchBar: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    height: 48, 
    gap: 12 
  },
  searchInput: { 
    flex: 1, 
    fontSize: 15, 
    fontWeight: '800', 
    letterSpacing: -0.2,
    padding: 0,
  },
  filterArea: { 
    borderBottomWidth: 1, 
  },
  filterScroll: { 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    gap: 8, 
    alignItems: 'center' 
  },
  chip: { 
    paddingHorizontal: 14, 
    paddingVertical: 10, 
  },
  chipText: { 
    fontSize: 12, 
    fontWeight: '900', 
    letterSpacing: 0.2,
  },
  divider: { 
    width: 1, 
    height: 20, 
    marginHorizontal: 4 
  },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  empty: { 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingTop: 80, 
    paddingHorizontal: 40 
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: { 
    fontSize: 18, 
    fontWeight: '900', 
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
});
