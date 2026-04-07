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
import { Ionicons } from '@expo/vector-icons';
import { CustomAlert } from '@/components/ui/custom-alert';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import {
  storage,
  type Category,
  type BudgetSummary,
  type Wallet,
} from '@/lib/storage/storage-adapter';
import { formatCurrency } from '@/lib/utils/format';
import { eventEmitter, EVENTS } from '@/lib/utils/events';
import { Colors, getRadius } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2;

const WALLET_ICONS = ['wallet', 'card', 'cash', 'business', 'home', 'car', 'gift', 'heart', 'airplane', 'briefcase', 'book', 'cart', 'cafe', 'game-controller'];
const WALLET_COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#6366f1', '#4b5563'];

export default function BudgetingWalletScreen() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'BUDGET' | 'WALLET'>('BUDGET');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [walletBalances, setWalletBalances] = useState<Record<string, number>>({});
  const [selectedWalletId, setSelectedWalletId] = useState<string>('default');
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [walletFormData, setWalletFormData] = useState({ name: '', icon: 'wallet', color: Colors.light.tint });

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
    } catch (err) { console.error(err); } finally { setLoading(false); setRefreshing(false); }
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

  const handleSetBudget = async () => {
    if (!selectedCategory || !budgetAmount) { showAlert({ title: 'Error', message: 'Tentukan kategori & budget', type: 'error' }); return; }
    try {
      const now = new Date();
      await storage.setBudget(selectedCategory, parseFloat(budgetAmount), now.getFullYear(), now.getMonth() + 1);
      await loadData();
      setShowBudgetModal(false);
      setSelectedCategory('');
      setBudgetAmount('');
      showAlert({ title: 'Berhasil', message: 'Budget diperbarui', type: 'success' });
    } catch (error) { showAlert({ title: 'Error', message: 'Gagal simpan', type: 'error' }); }
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

  if (loading && !refreshing) {
    return (
      <ScreenWrapper>
        <View style={styles.centered}><ActivityIndicator size="large" color={Colors.light.tint} /></View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper backgroundColor="#fff">
      <View style={styles.header}>
        <View style={styles.tabSwitcher}>
            <TouchableOpacity style={[styles.tabBtn, activeTab === 'BUDGET' && styles.tabBtnActive]} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setActiveTab('BUDGET'); }}>
              <Text style={[styles.tabText, activeTab === 'BUDGET' && styles.tabTextActive]}>Anggaran</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabBtn, activeTab === 'WALLET' && styles.tabBtnActive]} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setActiveTab('WALLET'); }}>
              <Text style={[styles.tabText, activeTab === 'WALLET' && styles.tabTextActive]}>Dompet</Text>
            </TouchableOpacity>
        </View>
        <TouchableOpacity style={[styles.addIconBtn, { borderRadius: getRadius(44, 'small') }]} onPress={() => activeTab === 'BUDGET' ? setShowBudgetModal(true) : (setEditingWallet(null), setWalletFormData({ name: '', icon: 'wallet', color: Colors.light.tint }), setIsWalletModalOpen(true))}>
            <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={Colors.light.tint} />}>
        {activeTab === 'BUDGET' ? (
          <>
            <View style={[styles.summaryCard, { borderRadius: getRadius(150) }]}>
              <View style={styles.summaryInfo}>
                <View>
                  <Text style={styles.summaryLabel}>TOTAL ANGGARAN</Text>
                  <Text style={styles.summaryAmount}>{formatCurrency(budgetSummary?.totalBudget || 0)}</Text>
                </View>
                <View style={styles.summaryBadge}><Text style={styles.badgeText}>{budgetSummary?.percentage.toFixed(0)}%</Text></View>
              </View>
              <View style={[styles.progBar, { borderRadius: 4 }]}><View style={[styles.progFill, { width: `${Math.min(budgetSummary?.percentage || 0, 100)}%` }]} /></View>
              <View style={styles.summaryFooter}>
                <View><Text style={styles.subLabel}>TERPAKAI</Text><Text style={styles.subAmount}>{formatCurrency(budgetSummary?.totalSpent || 0)}</Text></View>
                <View style={{ alignItems: 'flex-end' }}><Text style={styles.subLabel}>SISA</Text><Text style={[styles.subAmount, { color: (budgetSummary?.remaining || 0) < 0 ? '#ef4444' : Colors.light.tint }]}>{formatCurrency(budgetSummary?.remaining || 0)}</Text></View>
              </View>
            </View>
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>POST PENGELUARAN</Text></View>
            {budgetSummary && budgetSummary.categories.length > 0 ? budgetSummary.categories.map((cat) => (
              <View key={cat.categoryId} style={styles.budgetItem}>
                <View style={[styles.catIconBox, { backgroundColor: cat.categoryColor + '10', borderRadius: getRadius(48) }]}><Text style={styles.catEmoji}>{cat.categoryIcon}</Text></View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={styles.itemName}>{cat.categoryName}</Text>
                  <Text style={styles.itemLimit}>{formatCurrency(cat.spent)} / {formatCurrency(cat.budget)}</Text>
                  <View style={styles.itemProgBar}><View style={[styles.itemProgFill, { width: `${Math.min(cat.percentage, 100)}%`, backgroundColor: cat.percentage > 90 ? '#ef4444' : Colors.light.tint }]} /></View>
                </View>
              </View>
            )) : <View style={styles.emptyContainer}><Ionicons name="pie-chart-outline" size={48} color="#f1f5f9" /><Text style={styles.emptyText}>Belum ada anggaran</Text></View>}
          </>
        ) : (
          <View style={styles.walletGrid}>
            {wallets.map((wallet) => (
              <TouchableOpacity key={wallet.id} onPress={() => { storage.setSelectedWalletId(wallet.id); setSelectedWalletId(wallet.id); LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); }} activeOpacity={0.9} style={[styles.walletCard, { borderRadius: getRadius(130) }, selectedWalletId === wallet.id && { backgroundColor: wallet.color, borderColor: wallet.color }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.walletIconBox, { backgroundColor: selectedWalletId === wallet.id ? 'rgba(255,255,255,0.2)' : wallet.color + '15', borderRadius: getRadius(44) }]}><Ionicons name={wallet.icon as any} size={22} color={selectedWalletId === wallet.id ? '#fff' : wallet.color} /></View>
                  {selectedWalletId === wallet.id ? <View style={styles.activePill}><Ionicons name="checkmark-circle" size={12} color={wallet.color} /><Text style={[styles.activeText, { color: wallet.color }]}>AKTIF</Text></View> : <TouchableOpacity onPress={() => { setEditingWallet(wallet); setWalletFormData({ name: wallet.name, icon: wallet.icon, color: wallet.color }); setIsWalletModalOpen(true); }}><Ionicons name="ellipsis-horizontal" size={20} color="#cbd5e1" /></TouchableOpacity>}
                </View>
                <Text style={[styles.walletName, selectedWalletId === wallet.id && { color: '#fff' }]}>{wallet.name}</Text>
                <Text style={[styles.balAmount, selectedWalletId === wallet.id && { color: '#fff' }]}>{formatCurrency(walletBalances[wallet.id] || 0)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Simplified Modal Logic */}
      <Modal visible={showBudgetModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowBudgetModal(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalWrap}>
            <View style={[styles.modalSheet, { borderTopLeftRadius: getRadius(400, 'large'), borderTopRightRadius: getRadius(400, 'large') }]}>
              <View style={styles.modalHeader}><Text style={styles.modalTitle}>Atur Anggaran</Text><TouchableOpacity onPress={() => setShowBudgetModal(false)}><Ionicons name="close" size={24} color="#0f172a" /></TouchableOpacity></View>
              <View style={styles.modalBody}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                  {categories.map(cat => <TouchableOpacity key={cat.id} style={[styles.catChip, { borderRadius: getRadius(44) }, selectedCategory === cat.id && { backgroundColor: Colors.light.tint }]} onPress={() => setSelectedCategory(cat.id)}><Text style={[styles.catLabel, selectedCategory === cat.id && { color: '#fff' }]}>{cat.icon} {cat.name}</Text></TouchableOpacity>)}
                </ScrollView>
                <TextInput style={[styles.input, { borderRadius: getRadius(56) }]} placeholder="Jumlah Anggaran" keyboardType="numeric" value={budgetAmount} onChangeText={setBudgetAmount} />
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: Colors.light.tint, borderRadius: getRadius(56) }]} onPress={handleSetBudget}><Text style={styles.saveBtnText}>Simpan</Text></TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      <CustomAlert visible={alertVisible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} buttons={alertConfig.buttons} onClose={() => setAlertVisible(false)} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tabSwitcher: { flex: 1, flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 16, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  tabBtnActive: { backgroundColor: '#fff', elevation: 2, shadowOpacity: 0.1 },
  tabText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  tabTextActive: { color: '#0f172a' },
  addIconBtn: { width: 44, height: 44, backgroundColor: Colors.light.tint, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingVertical: 16, paddingBottom: 100 },
  summaryCard: { marginHorizontal: 20, padding: 24, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 24 },
  summaryInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  summaryLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1 },
  summaryAmount: { fontSize: 26, fontWeight: '900', color: '#0f172a' },
  summaryBadge: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#e2e8f0', borderRadius: 6 },
  badgeText: { fontSize: 12, fontWeight: '800' },
  progBar: { height: 8, backgroundColor: '#e2e8f0', overflow: 'hidden', marginBottom: 16 },
  progFill: { height: '100%', backgroundColor: '#0f172a' },
  summaryFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  subLabel: { fontSize: 9, fontWeight: '700', color: '#94a3b8' },
  subAmount: { fontSize: 14, fontWeight: '800', color: '#475569' },
  sectionHeader: { paddingHorizontal: 24, marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '900', color: '#94a3b8', letterSpacing: 1 },
  budgetItem: { marginHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  catIconBox: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  catEmoji: { fontSize: 22 },
  itemName: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  itemLimit: { fontSize: 12, color: '#64748b', fontWeight: '500', marginBottom: 8 },
  itemProgBar: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  itemProgFill: { height: '100%', borderRadius: 3 },
  walletGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 18, justifyContent: 'space-between' },
  walletCard: { width: CARD_WIDTH, backgroundColor: '#fff', padding: 20, marginBottom: 16, borderWidth: 1.5, borderColor: '#f1f5f9' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  walletIconBox: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  activePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, gap: 4 },
  activeText: { fontSize: 8, fontWeight: '900' },
  walletName: { fontSize: 15, fontWeight: '800', color: '#1e293b', marginBottom: 4 },
  balAmount: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  emptyContainer: { padding: 60, alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#94a3b8', marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalWrap: { width: '100%' },
  modalSheet: { backgroundColor: '#fff', paddingBottom: 40 },
  modalHeader: { padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  modalBody: { padding: 24 },
  input: { backgroundColor: '#f8fafc', padding: 16, fontSize: 16, color: '#0f172a', borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 20 },
  catChip: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#f1f5f9', marginRight: 8 },
  catLabel: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  saveBtn: { paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
