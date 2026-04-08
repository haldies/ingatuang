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
  useColorScheme as useNativeColorScheme,
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

export default function BudgetingWalletScreen() {
  const { t } = useTranslation();
  const colorScheme = useNativeColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  
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

  if (loading && !refreshing) {
    return (
      <ScreenWrapper>
        <View style={styles.centered}><ActivityIndicator size="large" color={theme.tint} /></View>
      </ScreenWrapper>
    );
  }

  const handleAddPress = () => {
    if (activeTab === 'BUDGET') {
      setShowBudgetModal(true);
    } else {
      showAlert({ title: 'Tambah Dompet', message: 'Fitur tambah dompet ada di pengaturan akun.', type: 'info' });
    }
  };

  return (
    <ScreenWrapper backgroundColor={theme.background}>
      <View style={[styles.header, { borderBottomColor: colorScheme === 'dark' ? '#262626' : '#f1f5f9' }]}>
        <View style={[styles.tabSwitcher, { backgroundColor: colorScheme === 'dark' ? '#262626' : '#f1f5f9', borderRadius: getRadius(100, 'small') }]}>
            <TouchableOpacity 
              style={[
                styles.tabBtn, 
                activeTab === 'BUDGET' && [styles.tabBtnActive, { backgroundColor: theme.background }]
              ]} 
              onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setActiveTab('BUDGET'); }}
            >
              <Text style={[styles.tabText, activeTab === 'BUDGET' && { color: theme.text }]}>Anggaran</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.tabBtn, 
                activeTab === 'WALLET' && [styles.tabBtnActive, { backgroundColor: theme.background }]
              ]} 
              onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setActiveTab('WALLET'); }}
            >
              <Text style={[styles.tabText, activeTab === 'WALLET' && { color: theme.text }]}>Dompet</Text>
            </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={[styles.addIconBtn, { backgroundColor: theme.tint, borderRadius: getRadius(70, 'small') }]} 
          onPress={handleAddPress}
        >
            <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={theme.tint} />}
      >
        {activeTab === 'BUDGET' ? (
          <>
            <View style={[
              styles.summaryCard, 
              { 
                backgroundColor: colorScheme === 'dark' ? '#171717' : '#f8fafc',
                borderColor: colorScheme === 'dark' ? '#262626' : '#f1f5f9',
                borderRadius: getRadius(150) 
              }
            ]}>
              <View style={styles.summaryInfo}>
                <View>
                  <Text style={styles.summaryLabel}>TOTAL ANGGARAN</Text>
                  <Text style={[styles.summaryAmount, { color: theme.text }]}>{formatCurrency(budgetSummary?.totalBudget || 0)}</Text>
                </View>
                <View style={[styles.summaryBadge, { backgroundColor: colorScheme === 'dark' ? '#262626' : '#e2e8f0' }]}>
                  <Text style={[styles.badgeText, { color: theme.text }]}>{budgetSummary?.percentage.toFixed(0)}%</Text>
                </View>
              </View>
              <View style={[styles.progBar, { backgroundColor: colorScheme === 'dark' ? '#262626' : '#e2e8f0', borderRadius: 4 }]}>
                <View style={[styles.progFill, { backgroundColor: theme.tint, width: `${Math.min(budgetSummary?.percentage || 0, 100)}%` }]} />
              </View>
              <View style={styles.summaryFooter}>
                <View><Text style={styles.subLabel}>TERPAKAI</Text><Text style={[styles.subAmount, { color: theme.text }]}>{formatCurrency(budgetSummary?.totalSpent || 0)}</Text></View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.subLabel}>SISA</Text>
                  <Text style={[
                    styles.subAmount, 
                    { color: (budgetSummary?.remaining || 0) < 0 ? '#ef4444' : theme.tint }
                  ]}>
                    {formatCurrency(budgetSummary?.remaining || 0)}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>POST PENGELUARAN</Text></View>
            
            {budgetSummary && budgetSummary.categories.length > 0 ? budgetSummary.categories.map((cat) => (
              <View key={cat.categoryId} style={[styles.budgetItem, { borderBottomColor: colorScheme === 'dark' ? '#262626' : '#f1f5f9' }]}>
                <View style={[
                  styles.catIconBox, 
                  { 
                    backgroundColor: cat.categoryColor + '15', 
                    borderRadius: getRadius(48) 
                  }
                ]}>
                  <Text style={styles.catEmoji}>{cat.categoryIcon}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={[styles.itemName, { color: theme.text }]}>{cat.categoryName}</Text>
                  <Text style={styles.itemLimit}>{formatCurrency(cat.spent)} / {formatCurrency(cat.budget)}</Text>
                  <View style={[styles.itemProgBar, { backgroundColor: colorScheme === 'dark' ? '#262626' : '#f1f5f9' }]}>
                    <View style={[
                      styles.itemProgFill, 
                      { 
                        width: `${Math.min(cat.percentage, 100)}%`, 
                        backgroundColor: cat.percentage > 90 ? '#ef4444' : theme.tint 
                      }
                    ]} />
                  </View>
                </View>
              </View>
            )) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="pie-chart-outline" size={48} color={colorScheme === 'dark' ? '#262626' : '#f1f5f9'} />
                <Text style={styles.emptyText}>Belum ada anggaran</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.walletGrid}>
            {wallets.map((wallet) => (
              <TouchableOpacity 
                key={wallet.id} 
                onPress={() => { 
                  storage.setSelectedWalletId(wallet.id); 
                  setSelectedWalletId(wallet.id); 
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); 
                }} 
                activeOpacity={0.9} 
                style={[
                  styles.walletCard, 
                  { 
                    backgroundColor: theme.background,
                    borderColor: colorScheme === 'dark' ? '#262626' : '#f1f5f9',
                    borderRadius: getRadius(130) 
                  }, 
                  selectedWalletId === wallet.id && { backgroundColor: wallet.color, borderColor: wallet.color }
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={[
                    styles.walletIconBox, 
                    { 
                      backgroundColor: selectedWalletId === wallet.id ? 'rgba(255,255,255,0.2)' : wallet.color + '15', 
                      borderRadius: getRadius(44) 
                    }
                  ]}>
                    <Ionicons 
                      name={wallet.icon as any} 
                      size={22} 
                      color={selectedWalletId === wallet.id ? '#fff' : wallet.color} 
                    />
                  </View>
                  {selectedWalletId === wallet.id ? (
                    <View style={[styles.activePill, { borderRadius: getRadius(40, 'small') }]}>
                      <Ionicons name="checkmark-circle" size={12} color={wallet.color} />
                      <Text style={[styles.activeText, { color: wallet.color }]}>AKTIF</Text>
                    </View>
                  ) : (
                    <Ionicons name="ellipsis-horizontal" size={20} color="#cbd5e1" />
                  )}
                </View>
                <Text style={[styles.walletName, { color: theme.text }, selectedWalletId === wallet.id && { color: '#fff' }]}>{wallet.name}</Text>
                <Text style={[styles.balAmount, { color: theme.text }, selectedWalletId === wallet.id && { color: '#fff' }]}>{formatCurrency(walletBalances[wallet.id] || 0)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Budget Modal */}
      <Modal visible={showBudgetModal} transparent animationType="slide" onRequestClose={() => setShowBudgetModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowBudgetModal(false)} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalWrap}>
            <View style={[
              styles.modalSheet, 
              { 
                backgroundColor: theme.background,
                borderTopLeftRadius: getRadius(400, 'large'), 
                borderTopRightRadius: getRadius(400, 'large') 
              }
            ]}>
              <View style={[styles.modalHeader, { borderBottomColor: colorScheme === 'dark' ? '#262626' : '#f1f5f9' }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Atur Anggaran</Text>
                <TouchableOpacity onPress={() => setShowBudgetModal(false)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                  {categories.map(cat => (
                    <TouchableOpacity 
                      key={cat.id} 
                      style={[
                        styles.catChip, 
                        { 
                          backgroundColor: colorScheme === 'dark' ? '#262626' : '#f1f5f9',
                          borderRadius: getRadius(44) 
                        }, 
                        selectedCategory === cat.id && { backgroundColor: theme.tint }
                      ]} 
                      onPress={() => setSelectedCategory(cat.id)}
                    >
                      <Text style={[styles.catLabel, selectedCategory === cat.id && { color: '#fff' }]}>{cat.icon} {cat.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TextInput 
                  style={[
                    styles.input, 
                    { 
                      backgroundColor: colorScheme === 'dark' ? '#171717' : '#f8fafc',
                      borderColor: colorScheme === 'dark' ? '#262626' : '#f1f5f9',
                      color: theme.text,
                      borderRadius: getRadius(56) 
                    }
                  ]} 
                  placeholder="Jumlah Anggaran" 
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric" 
                  value={budgetAmount} 
                  onChangeText={setBudgetAmount} 
                />
                <TouchableOpacity 
                  style={[styles.saveBtn, { backgroundColor: theme.tint, borderRadius: getRadius(56) }]} 
                  onPress={handleSetBudget}
                >
                  <Text style={styles.saveBtnText}>Simpan</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
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
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    gap: 12, 
    borderBottomWidth: 1 
  },
  tabSwitcher: { flex: 1, flexDirection: 'row', padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  tabBtnActive: { 
    elevation: 2, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4 
  },
  tabText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  addIconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingVertical: 16, paddingBottom: 100 },
  summaryCard: { marginHorizontal: 20, padding: 24, borderWidth: 1, marginBottom: 24 },
  summaryInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  summaryLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1 },
  summaryAmount: { fontSize: 26, fontWeight: '900' },
  summaryBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 12, fontWeight: '800' },
  progBar: { height: 8, overflow: 'hidden', marginBottom: 16 },
  progFill: { height: '100%' },
  summaryFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  subLabel: { fontSize: 9, fontWeight: '700', color: '#94a3b8' },
  subAmount: { fontSize: 14, fontWeight: '800' },
  sectionHeader: { paddingHorizontal: 24, marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '900', color: '#94a3b8', letterSpacing: 1 },
  budgetItem: { marginHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  catIconBox: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  catEmoji: { fontSize: 22 },
  itemName: { fontSize: 15, fontWeight: '800' },
  itemLimit: { fontSize: 12, color: '#64748b', fontWeight: '500', marginBottom: 8 },
  itemProgBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  itemProgFill: { height: '100%', borderRadius: 3 },
  walletGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 18, justifyContent: 'space-between' },
  walletCard: { width: CARD_WIDTH, padding: 20, marginBottom: 16, borderWidth: 1.5 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  walletIconBox: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  activePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 4, gap: 4 },
  activeText: { fontSize: 8, fontWeight: '900' },
  walletName: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  balAmount: { fontSize: 18, fontWeight: '900' },
  emptyContainer: { padding: 60, alignItems: 'center' },
  emptyText: { fontSize: 13, color: '#94a3b8', marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalWrap: { width: '100%' },
  modalSheet: { paddingBottom: 40 },
  modalHeader: { padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  modalBody: { padding: 24 },
  input: { padding: 16, fontSize: 16, borderWidth: 1, marginBottom: 20 },
  catChip: { paddingHorizontal: 16, paddingVertical: 10, marginRight: 8 },
  catLabel: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  saveBtn: { paddingVertical: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
