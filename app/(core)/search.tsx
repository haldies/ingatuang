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
  ActivityIndicator,
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
    setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 150);
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
    <ScreenWrapper backgroundColor="#fff">
      <View style={styles.header}>
        <TouchableOpacity style={[styles.backBtn, { borderRadius: getRadius(40) }]} onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#0f172a" /></TouchableOpacity>
        <View style={[styles.searchBar, { borderRadius: getRadius(48) }]}>
          <Ionicons name="search" size={20} color="#94a3b8" />
          <TextInput ref={inputRef} style={styles.searchInput} placeholder={t('dashboard.search_placeholder') || "Cari transaksi..."} value={searchQuery} onChangeText={setSearchQuery} />
          {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')}><Ionicons name="close-circle" size={20} color="#cbd5e1" /></TouchableOpacity>}
        </View>
      </View>

      <View style={styles.filterArea}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {['ALL', 'INCOME', 'EXPENSE'].map(type => (
            <TouchableOpacity key={type} style={[styles.chip, { borderRadius: getRadius(44) }, selectedType === type && styles.chipActive]} onPress={() => setSelectedType(type as any)}>
              <Text style={[styles.chipText, selectedType === type && styles.chipTextActive]}>{type === 'ALL' ? 'Semua' : type === 'INCOME' ? 'Masuk' : 'Keluar'}</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.divider} />
          {wallets.map(w => (
            <TouchableOpacity key={w.id} style={[styles.chip, { borderRadius: getRadius(44) }, selectedWalletId === w.id && styles.chipActive]} onPress={() => setSelectedWalletId(selectedWalletId === w.id ? 'all' : w.id)}>
              <Text style={[styles.chipText, selectedWalletId === w.id && styles.chipTextActive]}>{w.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? <View style={styles.centered}><ActivityIndicator color={Colors.light.tint} /></View> : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <TransactionItemMemo transaction={item} onPress={(t) => { setSelectedTransaction(transactions.find(ot => ot.id === t.id) || null); setIsAddModalOpen(true); }} />}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={<View style={styles.empty}><Ionicons name="search-outline" size={64} color="#f1f5f9" /><Text style={styles.emptyTitle}>{searchQuery ? 'Tidak ada hasil' : 'Mulai mencari'}</Text></View>}
          onScrollBeginDrag={Keyboard.dismiss}
        />
      )}

      <AddTransactionModal visible={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); setSelectedTransaction(null); }} transaction={selectedTransaction} onSuccess={loadData} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', paddingHorizontal: 14, height: 48, gap: 10 },
  searchInput: { flex: 1, fontSize: 16, color: '#0f172a', fontWeight: '700' },
  filterArea: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  filterScroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, alignItems: 'center' },
  chip: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#f1f5f9' },
  chipActive: { backgroundColor: '#0f172a' },
  chipText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  chipTextActive: { color: '#fff' },
  divider: { width: 1, height: 20, backgroundColor: '#e2e8f0', marginHorizontal: 4 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: 100, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginTop: 20 },
});
