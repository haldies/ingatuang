import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CustomAlert } from '@/components/ui/custom-alert';
import {
  storage,
  type Category,
  type BudgetSummary,
  type Wallet,
} from '@/lib/storage/storage-adapter';
import { formatCurrency } from '@/lib/utils/format';
import { eventEmitter, EVENTS } from '@/lib/utils/events';
import { Colors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2;

const WALLET_ICONS = ['wallet', 'card', 'cash', 'business', 'home', 'car', 'gift', 'heart', 'airplane', 'briefcase', 'book', 'cart', 'cafe', 'game-controller'];
const WALLET_COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#6366f1', '#4b5563'];

export default function BudgetingWalletScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  
  // Segmented Tab: 'BUDGET' | 'WALLET'
  const [activeTab, setActiveTab] = useState<'BUDGET' | 'WALLET'>('BUDGET');
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // BUDGET DATA
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  // WALLET DATA
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [walletBalances, setWalletBalances] = useState<Record<string, number>>({});
  const [selectedWalletId, setSelectedWalletId] = useState<string>('default');
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [walletFormData, setWalletFormData] = useState({ name: '', icon: 'wallet', color: '#3b82f6' });

  // ALERT
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive'; }>;
  }>({ title: '', message: '', type: 'info' });

  const showAlert = (config: typeof alertConfig) => {
    setAlertConfig(config);
    setAlertVisible(true);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const now = new Date();
      const [budgetData, cats, walletList, balances, activeId] = await Promise.all([
        storage.getBudgetSummary(now.getFullYear(), now.getMonth() + 1),
        storage.getCategories(),
        storage.getWallets(),
        storage.getWalletBalances(),
        storage.getSelectedWalletId()
      ]);
      
      setBudgetSummary(budgetData);
      setCategories(cats.filter(c => c.type === 'EXPENSE'));
      setWallets(walletList);
      setWalletBalances(balances);
      setSelectedWalletId(activeId);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    eventEmitter.on(EVENTS.TRANSACTION_ADDED, handleUpdate);
    eventEmitter.on(EVENTS.TRANSACTION_UPDATED, handleUpdate);
    eventEmitter.on(EVENTS.WALLET_UPDATED, handleUpdate);
    return () => {
      eventEmitter.off(EVENTS.TRANSACTION_ADDED, handleUpdate);
      eventEmitter.off(EVENTS.TRANSACTION_UPDATED, handleUpdate);
      eventEmitter.off(EVENTS.WALLET_UPDATED, handleUpdate);
    };
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // BUDGET ACTIONS
  const handleSetBudget = async () => {
    if (!selectedCategory || !budgetAmount) {
      showAlert({ title: 'Error', message: 'Pilih kategori dan masukkan jumlah budget', type: 'error' });
      return;
    }
    try {
      const now = new Date();
      await storage.setBudget(selectedCategory, parseFloat(budgetAmount), now.getFullYear(), now.getMonth() + 1);
      await loadData();
      setShowBudgetModal(false);
      setSelectedCategory('');
      setBudgetAmount('');
      showAlert({ title: 'Berhasil', message: 'Budget diperbarui', type: 'success' });
    } catch (error) {
      showAlert({ title: 'Error', message: 'Gagal simpan budget', type: 'error' });
    }
  };

  const handleDeleteBudget = async (categoryId: string) => {
    showAlert({
      title: 'Hapus Budget',
      message: 'Yakin ingin menghapus budget untuk kategori ini?',
      type: 'warning',
      buttons: [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            const now = new Date();
            await storage.deleteBudget(categoryId, now.getFullYear(), now.getMonth() + 1);
            loadData();
          }
        }
      ]
    });
  };

  // WALLET ACTIONS
  const handleSelectWallet = async (id: string) => {
    if (selectedWalletId === id) return;
    try {
      await storage.setSelectedWalletId(id);
      setSelectedWalletId(id);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    } catch (error) { console.error(error); }
  };

  const handleWalletSave = async () => {
    if (!walletFormData.name.trim()) return;
    try {
      if (editingWallet) {
        await storage.updateWallet(editingWallet.id, { name: walletFormData.name.trim(), icon: walletFormData.icon, color: walletFormData.color });
      } else {
        await storage.addWallet({ id: Date.now().toString(), name: walletFormData.name.trim(), icon: walletFormData.icon, color: walletFormData.color, createdAt: new Date().toISOString() });
      }
      setIsWalletModalOpen(false);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      loadData();
    } catch (error) { console.error(error); }
  };

  const changeTab = (tab: 'BUDGET' | 'WALLET') => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setActiveTab(tab);
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}><ActivityIndicator size="large" color="#3b82f6" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Custom Tabs */}
      <View style={styles.header}>
        <View style={styles.tabSwitcher}>
            <TouchableOpacity 
                style={[styles.tabBtn, activeTab === 'BUDGET' && styles.tabBtnActive]} 
                onPress={() => changeTab('BUDGET')}
            >
                <Text style={[styles.tabText, activeTab === 'BUDGET' && styles.tabTextActive]}>Anggaran</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.tabBtn, activeTab === 'WALLET' && styles.tabBtnActive]} 
                onPress={() => changeTab('WALLET')}
            >
                <Text style={[styles.tabText, activeTab === 'WALLET' && styles.tabTextActive]}>Dompet</Text>
            </TouchableOpacity>
        </View>
        <TouchableOpacity 
            style={styles.addIconBtn} 
            onPress={() => activeTab === 'BUDGET' ? setShowBudgetModal(true) : (setEditingWallet(null), setWalletFormData({ name: '', icon: 'wallet', color: '#3b82f6' }), setIsWalletModalOpen(true))}
        >
            <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
      >
        {activeTab === 'BUDGET' ? (
          <>
            {/* Budget Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryInfo}>
                <View>
                  <Text style={styles.summaryLabel}>TOTAL ANGGARAN</Text>
                  <Text style={styles.summaryAmount}>{formatCurrency(budgetSummary?.totalBudget || 0)}</Text>
                </View>
                <View style={styles.summaryBadge}><Text style={styles.badgeText}>{budgetSummary?.percentage.toFixed(0)}%</Text></View>
              </View>
              <View style={styles.progBar}><View style={[styles.progFill, { width: `${Math.min(budgetSummary?.percentage || 0, 100)}%` }]} /></View>
              <View style={styles.summaryFooter}>
                <View>
                  <Text style={styles.subLabel}>TERPAKAI</Text>
                  <Text style={styles.subAmount}>{formatCurrency(budgetSummary?.totalSpent || 0)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.subLabel}>SISA PENGELUARAN</Text>
                  <Text style={[styles.subAmount, { color: (budgetSummary?.remaining || 0) < 0 ? '#ef4444' : '#0f172a' }]}>{formatCurrency(budgetSummary?.remaining || 0)}</Text>
                </View>
              </View>
            </View>

            {/* Budget Items */}
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>POST PENGELUARAN</Text></View>
            {budgetSummary && budgetSummary.categories.length > 0 ? (
              budgetSummary.categories.map((cat) => (
                <View key={cat.categoryId} style={styles.budgetItem}>
                    <View style={styles.itemMain}>
                        <View style={[styles.catIconBox, { backgroundColor: cat.categoryColor + '10' }]}><Text style={styles.catEmoji}>{cat.categoryIcon}</Text></View>
                        <View style={styles.itemContent}>
                            <View style={styles.itemTop}>
                                <Text style={styles.itemName}>{cat.categoryName}</Text>
                                <TouchableOpacity onPress={() => handleDeleteBudget(cat.categoryId)}><Ionicons name="close-circle" size={20} color="#cbd5e1" /></TouchableOpacity>
                            </View>
                            <Text style={styles.itemLimit}>{formatCurrency(cat.spent)} / {formatCurrency(cat.budget)}</Text>
                            <View style={styles.itemProgBar}><View style={[styles.itemProgFill, { width: `${Math.min(cat.percentage, 100)}%`, backgroundColor: cat.percentage > 90 ? '#ef4444' : '#3b82f6' }]} /></View>
                        </View>
                    </View>
                </View>
              ))
            ) : (
                <View style={styles.emptyContainer}>
                    <Ionicons name="pie-chart-outline" size={48} color="#f1f5f9" />
                    <Text style={styles.emptyText}>Belum ada anggaran bulanan</Text>
                </View>
            )}
          </>
        ) : (
          <>
            {/* Wallet Grid - Follows wallets.tsx design but FLAT */}
            <View style={styles.walletGrid}>
              {wallets.map((wallet) => (
                <TouchableOpacity 
                   key={wallet.id} 
                   onPress={() => handleSelectWallet(wallet.id)} 
                   activeOpacity={0.9} 
                   style={[styles.walletCard, selectedWalletId === wallet.id && { backgroundColor: wallet.color, borderColor: wallet.color }]}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.walletIconBox, { backgroundColor: selectedWalletId === wallet.id ? 'rgba(255,255,255,0.2)' : wallet.color + '15' }]}>
                        <Ionicons name={wallet.icon as any} size={22} color={selectedWalletId === wallet.id ? '#fff' : wallet.color} />
                    </View>
                    {selectedWalletId === wallet.id ? (
                        <View style={styles.activePill}><Ionicons name="checkmark-circle" size={14} color={wallet.color} /><Text style={[styles.activeText, { color: wallet.color }]}>AKTIF</Text></View>
                    ) : (
                        <TouchableOpacity onPress={() => { setEditingWallet(wallet); setWalletFormData({ name: wallet.name, icon: wallet.icon, color: wallet.color }); setIsWalletModalOpen(true); }}><Ionicons name="ellipsis-horizontal" size={20} color="#cbd5e1" /></TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={[styles.walletName, selectedWalletId === wallet.id && { color: '#fff' }]} numberOfLines={1}>{wallet.name}</Text>
                    <View style={styles.balContainer}>
                        <Text style={[styles.balLabel, selectedWalletId === wallet.id && { color: 'rgba(255,255,255,0.7)' }]}>SALDO TERSEDIA</Text>
                        <Text style={[styles.balAmount, selectedWalletId === wallet.id && { color: '#fff' }]}>{formatCurrency(walletBalances[wallet.id] || 0)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Budget Modal */}
      <Modal visible={showBudgetModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowBudgetModal(false)}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalWrap}>
                <Pressable style={styles.modalSheet} onPress={e => e.stopPropagation()}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Atur Anggaran</Text>
                        <TouchableOpacity onPress={() => setShowBudgetModal(false)}><Ionicons name="close" size={24} color="#0f172a" /></TouchableOpacity>
                    </View>
                    <View style={styles.modalBody}>
                        <Text style={styles.inputLabel}>Kategori</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catPicker}>
                            {categories.map(cat => (
                                <TouchableOpacity key={cat.id} style={[styles.catChip, selectedCategory === cat.id && styles.catChipActive]} onPress={() => setSelectedCategory(cat.id)}>
                                    <Text style={styles.catLabel}>{cat.icon} {cat.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TextInput style={styles.input} placeholder="Jumlah Anggaran" keyboardType="numeric" value={budgetAmount} onChangeText={setBudgetAmount} />
                        <TouchableOpacity style={styles.saveBtn} onPress={handleSetBudget}><Text style={styles.saveBtnText}>Simpan Anggaran</Text></TouchableOpacity>
                    </View>
                </Pressable>
            </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      {/* Wallet Modal */}
      <Modal visible={isWalletModalOpen} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setIsWalletModalOpen(false)}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalWrap}>
                <Pressable style={styles.modalSheet} onPress={e => e.stopPropagation()}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{editingWallet ? 'Edit Dompet' : 'Tambah Dompet'}</Text>
                        <TouchableOpacity onPress={() => setIsWalletModalOpen(false)}><Ionicons name="close" size={24} color="#0f172a" /></TouchableOpacity>
                    </View>
                    <View style={styles.modalBody}>
                        <TextInput style={styles.input} placeholder="Nama Dompet" value={walletFormData.name} onChangeText={t => setWalletFormData(p => ({ ...p, name: t }))} />
                        <Text style={styles.inputLabel}>Pilih Ikon</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catPicker}>
                            {WALLET_ICONS.map(i => (
                                <TouchableOpacity key={i} style={[styles.iconBoxMini, walletFormData.icon === i && styles.iconBoxSelected]} onPress={() => setWalletFormData(p => ({ ...p, icon: i }))}>
                                    <Ionicons name={i as any} size={20} color={walletFormData.icon === i ? '#3b82f6' : '#64748b'} />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <Text style={styles.inputLabel}>Warna</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catPicker}>
                            {WALLET_COLORS.map(c => (
                                <TouchableOpacity key={c} style={[styles.colorBox, { backgroundColor: c }, walletFormData.color === c && { borderWidth: 3, borderColor: '#000' }]} onPress={() => setWalletFormData(p => ({ ...p, color: c }))} />
                            ))}
                        </ScrollView>
                        <TouchableOpacity style={styles.saveBtn} onPress={handleWalletSave}><Text style={styles.saveBtnText}>Simpan Dompet</Text></TouchableOpacity>
                    </View>
                </Pressable>
            </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      <CustomAlert visible={alertVisible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} buttons={alertConfig.buttons} onClose={() => setAlertVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tabSwitcher: { flex: 1, flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 14, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabBtnActive: { backgroundColor: '#fff' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  tabTextActive: { color: '#0f172a' },
  addIconBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center' },

  scrollContent: { paddingVertical: 16 },
  summaryCard: { marginHorizontal: 20, padding: 24, backgroundColor: '#f8fafc', borderRadius: 24, marginBottom: 24 },
  summaryInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  summaryLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1 },
  summaryAmount: { fontSize: 24, fontWeight: '900', color: '#0f172a', marginTop: 4 },
  summaryBadge: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#e2e8f0', borderRadius: 6 },
  badgeText: { fontSize: 12, fontWeight: '800' },
  progBar: { height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden', marginBottom: 16 },
  progFill: { height: '100%', backgroundColor: '#0f172a' },
  summaryFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  subLabel: { fontSize: 9, fontWeight: '700', color: '#94a3b8', marginBottom: 2 },
  subAmount: { fontSize: 14, fontWeight: '800', color: '#475569' },

  sectionHeader: { paddingHorizontal: 24, marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '900', color: '#94a3b8', letterSpacing: 1 },

  budgetItem: { marginHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  itemMain: { flexDirection: 'row', gap: 16 },
  catIconBox: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  catEmoji: { fontSize: 22 },
  itemContent: { flex: 1 },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  itemName: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  itemLimit: { fontSize: 12, color: '#64748b', fontWeight: '500', marginBottom: 8 },
  itemProgBar: { height: 4, backgroundColor: '#f1f5f9', borderRadius: 2, overflow: 'hidden' },
  itemProgFill: { height: '100%', borderRadius: 2 },

  walletGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 18, justifyContent: 'space-between' },
  walletCard: { width: CARD_WIDTH, backgroundColor: '#fff', borderRadius: 28, padding: 20, marginBottom: 16, borderWidth: 1.5, borderColor: '#f1f5f9' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  walletIconBox: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  activePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, gap: 4 },
  activeText: { fontSize: 8, fontWeight: '900' },
  cardBody: { gap: 4 },
  walletName: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  balContainer: { marginTop: 8 },
  balLabel: { fontSize: 9, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase' },
  balAmount: { fontSize: 16, fontWeight: '900', color: '#0f172a' },

  emptyContainer: { padding: 60, alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#94a3b8', marginTop: 16 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalWrap: { width: '100%' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 40 },
  modalHeader: { padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  modalBody: { padding: 24 },
  input: { backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, fontSize: 16, color: '#0f172a', borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 20 },
  inputLabel: { fontSize: 12, fontWeight: '800', color: '#64748b', marginBottom: 12 },
  catPicker: { marginBottom: 20 },
  catChip: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#f1f5f9', borderRadius: 12, marginRight: 8 },
  catChipActive: { backgroundColor: '#3b82f6' },
  catLabel: { fontSize: 14, fontWeight: '700' },
  iconBoxMini: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  iconBoxSelected: { backgroundColor: '#3b82f620', borderColor: '#3b82f6', borderWidth: 1 },
  colorBox: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  saveBtn: { backgroundColor: '#0f172a', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
