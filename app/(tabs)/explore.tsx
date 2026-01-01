import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { 
  getStats, 
  getBudgetSummary, 
  setBudget, 
  deleteBudget,
  getCategories,
  type StatsData,
  type BudgetSummary,
  type Category,
} from '@/lib/storage';
import { formatMonthYear, formatCurrency } from '@/lib/format';
import { PieChart } from '@/components/stats/pie-chart';
import { eventEmitter, EVENTS } from '@/lib/events';

export default function StatsScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [stats, setStats] = useState<StatsData | null>(null);
  const [budgetSummary, setBudgetSummaryState] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'EXPENSE' | 'INCOME' | 'BUDGET'>('EXPENSE');
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [budgetAmount, setBudgetAmount] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const statsData = await getStats(year, month);
      const budgetData = await getBudgetSummary(year, month);
      const cats = await getCategories();
      setStats(statsData);
      setBudgetSummaryState(budgetData);
      setCategories(cats.filter(c => c.type === 'EXPENSE'));
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    loadData();

    // Listen for transaction events
    const handleTransactionEvent = () => {
      loadData();
    };

    eventEmitter.on(EVENTS.TRANSACTION_ADDED, handleTransactionEvent);
    eventEmitter.on(EVENTS.TRANSACTION_UPDATED, handleTransactionEvent);

    return () => {
      eventEmitter.off(EVENTS.TRANSACTION_ADDED, handleTransactionEvent);
      eventEmitter.off(EVENTS.TRANSACTION_UPDATED, handleTransactionEvent);
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

  const handleSetBudget = async () => {
    if (!selectedCategory || !budgetAmount) {
      Alert.alert('Error', 'Pilih kategori dan masukkan jumlah budget');
      return;
    }

    try {
      await setBudget(selectedCategory, parseFloat(budgetAmount), year, month);
      await loadData();
      setShowBudgetModal(false);
      setSelectedCategory('');
      setBudgetAmount('');
      Alert.alert('Berhasil', 'Budget berhasil disimpan');
    } catch (error) {
      Alert.alert('Error', 'Gagal menyimpan budget');
    }
  };

  const handleDeleteBudget = async (categoryId: string) => {
    Alert.alert(
      'Hapus Budget',
      'Apakah Anda yakin ingin menghapus budget ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBudget(categoryId, year, month);
              await loadData();
              Alert.alert('Berhasil', 'Budget berhasil dihapus');
            } catch (error) {
              Alert.alert('Error', 'Gagal menghapus budget');
            }
          },
        },
      ]
    );
  };

  const categoryData = activeTab === 'EXPENSE' 
    ? stats?.expenseByCategory || []
    : stats?.incomeByCategory || [];

  const totalAmount = activeTab === 'EXPENSE' ? stats?.totalExpense || 0 : stats?.totalIncome || 0;

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
      <ScrollView 
        showsVerticalScrollIndicator={false}
      >
        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={goToPreviousMonth} style={styles.monthButton}>
            <Ionicons name="chevron-back" size={20} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.monthText}>{formatMonthYear(currentDate)}</Text>
          <TouchableOpacity onPress={goToNextMonth} style={styles.monthButton}>
            <Ionicons name="chevron-forward" size={20} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'EXPENSE' && styles.tabActive]}
            onPress={() => setActiveTab('EXPENSE')}
          >
            <Ionicons 
              name="trending-down" 
              size={16} 
              color={activeTab === 'EXPENSE' ? '#111827' : '#6b7280'} 
            />
            <Text style={[styles.tabText, activeTab === 'EXPENSE' && styles.tabTextActive]}>
              Pengeluaran
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'INCOME' && styles.tabActive]}
            onPress={() => setActiveTab('INCOME')}
          >
            <Ionicons 
              name="trending-up" 
              size={16} 
              color={activeTab === 'INCOME' ? '#111827' : '#6b7280'} 
            />
            <Text style={[styles.tabText, activeTab === 'INCOME' && styles.tabTextActive]}>
              Pemasukan
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'BUDGET' && styles.tabActive]}
            onPress={() => setActiveTab('BUDGET')}
          >
            <Ionicons 
              name="wallet" 
              size={16} 
              color={activeTab === 'BUDGET' ? '#111827' : '#6b7280'} 
            />
            <Text style={[styles.tabText, activeTab === 'BUDGET' && styles.tabTextActive]}>
              Budget
            </Text>
          </TouchableOpacity>
        </View>

        {/* Budget Tab Content */}
        {activeTab === 'BUDGET' && (
          <>
            {/* Budget Summary Card */}
            {budgetSummary && budgetSummary.totalBudget > 0 ? (
              <>
                <View style={styles.budgetCard}>
                  <View style={styles.budgetHeader}>
                    <View>
                      <Text style={styles.budgetLabel}>Budget Bulan Ini</Text>
                      <Text style={styles.budgetAmount}>{formatCurrency(budgetSummary.totalBudget)}</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.budgetAddButton}
                      onPress={() => setShowBudgetModal(true)}
                    >
                      <Ionicons name="add-circle" size={24} color="#3b82f6" />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.budgetProgress}>
                    <View style={styles.budgetProgressBar}>
                      <View 
                        style={[
                          styles.budgetProgressFill,
                          {
                            width: `${Math.min(budgetSummary.percentage, 100)}%`,
                            backgroundColor: budgetSummary.percentage > 100 
                              ? '#ef4444' 
                              : budgetSummary.percentage > 80 
                              ? '#f59e0b' 
                              : '#10b981'
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.budgetProgressText}>
                      {budgetSummary.percentage.toFixed(0)}%
                    </Text>
                  </View>

                  <View style={styles.budgetStats}>
                    <View style={styles.budgetStat}>
                      <Text style={styles.budgetStatLabel}>Terpakai</Text>
                      <Text style={[styles.budgetStatValue, { color: '#ef4444' }]}>
                        {formatCurrency(budgetSummary.totalSpent)}
                      </Text>
                    </View>
                    <View style={styles.budgetStat}>
                      <Text style={styles.budgetStatLabel}>Sisa</Text>
                      <Text style={[
                        styles.budgetStatValue, 
                        { color: budgetSummary.remaining >= 0 ? '#10b981' : '#ef4444' }
                      ]}>
                        {formatCurrency(Math.abs(budgetSummary.remaining))}
                      </Text>
                    </View>
                  </View>

                  {budgetSummary.percentage > 80 && (
                    <View style={[
                      styles.budgetWarning,
                      { backgroundColor: budgetSummary.percentage > 100 ? '#fee2e2' : '#fef3c7' }
                    ]}>
                      <Ionicons 
                        name="warning" 
                        size={16} 
                        color={budgetSummary.percentage > 100 ? '#ef4444' : '#f59e0b'} 
                      />
                      <Text style={[
                        styles.budgetWarningText,
                        { color: budgetSummary.percentage > 100 ? '#ef4444' : '#f59e0b' }
                      ]}>
                        {budgetSummary.percentage > 100 
                          ? 'Budget sudah terlampaui!' 
                          : 'Budget hampir habis!'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Budget by Category */}
                <View style={styles.categoryCard}>
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryHeaderText}>Budget per Kategori</Text>
                  </View>
                  {budgetSummary.categories.map((cat) => (
                    <View key={cat.categoryId} style={styles.categoryItem}>
                      <View 
                        style={[styles.categoryIcon, { backgroundColor: cat.categoryColor }]}
                      >
                        <Text style={styles.categoryEmoji}>{cat.categoryIcon}</Text>
                      </View>
                      <View style={styles.categoryContent}>
                        <Text style={styles.categoryName}>{cat.categoryName}</Text>
                        <View style={styles.progressContainer}>
                          <View style={styles.progressBar}>
                            <View 
                              style={[
                                styles.progressFill,
                                { 
                                  width: `${Math.min(cat.percentage, 100)}%`,
                                  backgroundColor: cat.percentage > 100 ? '#ef4444' : cat.categoryColor 
                                }
                              ]}
                            />
                          </View>
                          <Text style={styles.percentageText}>
                            {cat.percentage.toFixed(0)}%
                          </Text>
                        </View>
                        <Text style={styles.transactionCount}>
                          {formatCurrency(cat.spent)} / {formatCurrency(cat.budget)}
                        </Text>
                      </View>
                      <View style={styles.categoryAmount}>
                        <Text style={[
                          styles.amountText,
                          { color: cat.remaining >= 0 ? '#10b981' : '#ef4444' }
                        ]}>
                          {cat.remaining >= 0 ? 'Sisa' : 'Over'}
                        </Text>
                        <Text style={[
                          styles.amountText,
                          { color: cat.remaining >= 0 ? '#10b981' : '#ef4444' }
                        ]}>
                          {formatCurrency(Math.abs(cat.remaining))}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <TouchableOpacity 
                style={styles.addBudgetCard}
                onPress={() => setShowBudgetModal(true)}
              >
                <Ionicons name="wallet-outline" size={48} color="#3b82f6" />
                <Text style={styles.addBudgetTitle}>Atur Budget</Text>
                <Text style={styles.addBudgetSubtitle}>
                  Kelola pengeluaran dengan lebih baik
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Stats Content - Only show for EXPENSE and INCOME tabs */}
        {activeTab !== 'BUDGET' && (
          <>

        {/* Total Amount */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>
            Total {activeTab === 'EXPENSE' ? 'Pengeluaran' : 'Pemasukan'}
          </Text>
          <Text style={[
            styles.totalAmount,
            activeTab === 'EXPENSE' ? styles.totalExpense : styles.totalIncome
          ]}>
            {formatCurrency(totalAmount)}
          </Text>
        </View>

        {/* Pie Chart */}
        {categoryData.length > 0 ? (
          <View style={styles.chartCard}>
            <PieChart data={categoryData} />
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="pie-chart-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>Tidak ada data untuk bulan ini</Text>
          </View>
        )}

        {/* Category List */}
        {categoryData.length > 0 && (
          <View style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryHeaderText}>Detail per Kategori</Text>
            </View>
            {categoryData.map((item) => (
              <View key={item.categoryId} style={styles.categoryItem}>
                <View 
                  style={[styles.categoryIcon, { backgroundColor: item.categoryColor }]}
                >
                  <Text style={styles.categoryEmoji}>{item.categoryIcon}</Text>
                </View>
                <View style={styles.categoryContent}>
                  <Text style={styles.categoryName}>{item.categoryName}</Text>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill,
                          { 
                            width: `${item.percentage}%`,
                            backgroundColor: item.categoryColor 
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.percentageText}>
                      {item.percentage.toFixed(1)}%
                    </Text>
                  </View>
                  <Text style={styles.transactionCount}>
                    {item.transactionCount} transaksi
                  </Text>
                </View>
                <View style={styles.categoryAmount}>
                  <Text style={[
                    styles.amountText,
                    activeTab === 'EXPENSE' ? styles.amountExpense : styles.amountIncome
                  ]}>
                    {formatCurrency(item.total)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
          </>
        )}
      </ScrollView>

      {/* Budget Modal */}
      <Modal
        visible={showBudgetModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBudgetModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowBudgetModal(false)}
          >
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Atur Budget</Text>
                <TouchableOpacity onPress={() => setShowBudgetModal(false)}>
                  <Ionicons name="close" size={28} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.modalBody} 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Current Budgets */}
                {budgetSummary && budgetSummary.categories.length > 0 && (
                  <View style={styles.currentBudgets}>
                    <Text style={styles.sectionTitle}>Budget Saat Ini</Text>
                    {budgetSummary.categories.map((cat) => (
                      <View key={cat.categoryId} style={styles.budgetItem}>
                        <View style={styles.budgetItemLeft}>
                          <View style={[styles.budgetItemIcon, { backgroundColor: cat.categoryColor + '20' }]}>
                            <Text style={styles.budgetItemEmoji}>{cat.categoryIcon}</Text>
                          </View>
                          <View style={styles.budgetItemInfo}>
                            <Text style={styles.budgetItemName}>{cat.categoryName}</Text>
                            <Text style={styles.budgetItemAmount}>{formatCurrency(cat.budget)}</Text>
                            <View style={styles.budgetItemProgress}>
                              <View style={styles.budgetItemProgressBar}>
                                <View 
                                  style={[
                                    styles.budgetItemProgressFill,
                                    {
                                      width: `${Math.min(cat.percentage, 100)}%`,
                                      backgroundColor: cat.percentage > 100 ? '#ef4444' : cat.categoryColor
                                    }
                                  ]}
                                />
                              </View>
                              <Text style={styles.budgetItemProgressText}>
                                {formatCurrency(cat.spent)} ({cat.percentage.toFixed(0)}%)
                              </Text>
                            </View>
                          </View>
                        </View>
                        <TouchableOpacity 
                          onPress={() => handleDeleteBudget(cat.categoryId)}
                          style={styles.budgetItemDelete}
                        >
                          <Ionicons name="trash-outline" size={20} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {/* Add New Budget */}
                <View style={styles.addBudgetSection}>
                  <Text style={styles.sectionTitle}>Tambah Budget Baru</Text>
                  
                  <Text style={styles.inputLabel}>Kategori</Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoryScroll}
                  >
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryChip,
                          selectedCategory === cat.id && styles.categoryChipActive,
                          selectedCategory === cat.id && { borderColor: cat.color }
                        ]}
                        onPress={() => setSelectedCategory(cat.id)}
                      >
                        <Text style={styles.categoryChipEmoji}>{cat.icon}</Text>
                        <Text style={styles.categoryChipText}>{cat.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <Text style={styles.inputLabel}>Jumlah Budget</Text>
                  <TextInput
                    style={styles.input}
                    value={budgetAmount}
                    onChangeText={setBudgetAmount}
                    placeholder="Masukkan jumlah budget"
                    keyboardType="numeric"
                    placeholderTextColor="#9ca3af"
                  />

                  <TouchableOpacity
                    style={[styles.saveButton, (!selectedCategory || !budgetAmount) && styles.saveButtonDisabled]}
                    onPress={handleSetBudget}
                    disabled={!selectedCategory || !budgetAmount}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>Simpan Budget</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
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
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 12,
  },
  monthButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    minWidth: 140,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#f3f4f6',
    marginTop: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#111827',
    fontWeight: '600',
  },
  totalCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 12,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  totalLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
  },
  totalExpense: {
    color: '#ef4444',
  },
  totalIncome: {
    color: '#10b981',
  },
  chartCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  legendCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  legendContainer: {
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendEmoji: {
    fontSize: 16,
  },
  legendName: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  legendStats: {
    alignItems: 'flex-end',
  },
  legendPercentage: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  legendAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
  },
  categoryCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  categoryHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryEmoji: {
    fontSize: 18,
  },
  categoryContent: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 6,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  percentageText: {
    fontSize: 12,
    color: '#6b7280',
    width: 48,
    textAlign: 'right',
  },
  transactionCount: {
    fontSize: 12,
    color: '#9ca3af',
  },
  categoryAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 14,
    fontWeight: '600',
  },
  amountExpense: {
    color: '#ef4444',
  },
  amountIncome: {
    color: '#10b981',
  },
  // Budget Card Styles
  budgetCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 12,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  budgetLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  budgetAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  budgetAddButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
  },
  budgetProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  budgetProgressBar: {
    flex: 1,
    height: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    overflow: 'hidden',
  },
  budgetProgressFill: {
    height: '100%',
    borderRadius: 6,
  },
  budgetProgressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    width: 48,
    textAlign: 'right',
  },
  budgetStats: {
    flexDirection: 'row',
    gap: 12,
  },
  budgetStat: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  budgetStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  budgetStatValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  budgetWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  budgetWarningText: {
    fontSize: 13,
    fontWeight: '500',
  },
  addBudgetCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 12,
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  addBudgetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
  },
  addBudgetSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalBody: {
    padding: 20,
  },
  currentBudgets: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  budgetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 12,
  },
  budgetItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  budgetItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetItemEmoji: {
    fontSize: 20,
  },
  budgetItemInfo: {
    flex: 1,
  },
  budgetItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  budgetItemAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  budgetItemProgress: {
    gap: 4,
  },
  budgetItemProgressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  budgetItemProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  budgetItemProgressText: {
    fontSize: 11,
    color: '#6b7280',
  },
  budgetItemDelete: {
    padding: 8,
  },
  addBudgetSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#eff6ff',
    borderWidth: 2,
  },
  categoryChipEmoji: {
    fontSize: 16,
  },
  categoryChipText: {
    fontSize: 14,
    color: '#111827',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#f9fafb',
    marginBottom: 16,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
  },
  saveButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
