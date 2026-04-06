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
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CustomAlert } from '@/components/ui/custom-alert';
import { 
  storage,
  type StatsData,
  type Category,
} from '@/lib/storage/storage-adapter';
import { formatMonthYear, formatCurrency } from '@/lib/utils/format';
import { PieChart } from '@/components/stats/pie-chart';
import { eventEmitter, EVENTS } from '@/lib/utils/events';

export default function StatsScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeRange, setTimeRange] = useState<'WEEKLY' | 'MONTHLY' | 'ANNUALLY' | 'CUSTOM'>('MONTHLY');
  const [customRange, setCustomRange] = useState<{ start: Date; end: Date }>({
    start: new Date(new Date().setDate(new Date().getDate() - 30)),
    end: new Date()
  });
  
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [showCustomRangeModal, setShowCustomRangeModal] = useState(false);
  const [isRangeDropdownOpen, setIsRangeDropdownOpen] = useState(false);
  const [tempRange, setTempRange] = useState({ start: '', end: '' });

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

  const getRangeLabels = () => {
    switch (timeRange) {
      case 'WEEKLY': {
        const start = new Date(currentDate);
        start.setDate(currentDate.getDate() - currentDate.getDay() + 1);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return `${start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      }
      case 'ANNUALLY':
        return currentDate.getFullYear().toString();
      case 'CUSTOM':
        return `${customRange.start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${customRange.end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      default:
        return formatMonthYear(currentDate);
    }
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      let startDate: Date;
      let endDate: Date;

      if (timeRange === 'WEEKLY') {
        startDate = new Date(currentDate);
        startDate.setDate(currentDate.getDate() - currentDate.getDay() + 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      } else if (timeRange === 'ANNUALLY') {
        startDate = new Date(currentDate.getFullYear(), 0, 1);
        endDate = new Date(currentDate.getFullYear(), 11, 31, 23, 59, 59, 999);
      } else if (timeRange === 'CUSTOM') {
        startDate = customRange.start;
        endDate = customRange.end;
      } else {
        // MONTHLY
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);
      }

      const statsData = await storage.getStatsInRange(startDate, endDate);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  }, [currentDate, timeRange, customRange]);

  useEffect(() => {
    loadData();

    const handleTransactionEvent = () => loadData();
    eventEmitter.on(EVENTS.TRANSACTION_ADDED, handleTransactionEvent);
    eventEmitter.on(EVENTS.TRANSACTION_UPDATED, handleTransactionEvent);

    return () => {
      eventEmitter.off(EVENTS.TRANSACTION_ADDED, handleTransactionEvent);
      eventEmitter.off(EVENTS.TRANSACTION_UPDATED, handleTransactionEvent);
    };
  }, [loadData]);

  const goToPrevious = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (timeRange === 'WEEKLY') newDate.setDate(prev.getDate() - 7);
      else if (timeRange === 'ANNUALLY') newDate.setFullYear(prev.getFullYear() - 1);
      else newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const goToNext = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (timeRange === 'WEEKLY') newDate.setDate(prev.getDate() + 7);
      else if (timeRange === 'ANNUALLY') newDate.setFullYear(prev.getFullYear() + 1);
      else newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };


  const categoryData = activeTab === 'EXPENSE' 
    ? stats?.expenseByCategory || []
    : stats?.incomeByCategory || [];

  const totalAmount = activeTab === 'EXPENSE' ? stats?.totalExpense || 0 : stats?.totalIncome || 0;

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading && !refreshing) {
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
            colors={['#3b82f6']}
          />
        }
      >
        {/* Navigation & Filter */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={goToPrevious} style={styles.monthButton}>
            <Ionicons name="chevron-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          
          <View style={styles.monthContent}>
            <Text style={styles.monthText}>{getRangeLabels()}</Text>
          </View>

          <View style={styles.navRightGroup}>
            <TouchableOpacity onPress={goToNext} style={styles.monthButton}>
              <Ionicons name="chevron-forward" size={24} color="#0f172a" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.filterToggleButton, isRangeDropdownOpen && styles.filterButtonActive]}
              onPress={() => setIsRangeDropdownOpen(!isRangeDropdownOpen)}
            >
              <Ionicons name="options" size={20} color="#0f172a" />
              {isRangeDropdownOpen && (
                <View style={styles.inlineDropdown}>
                  {[
                    { id: 'WEEKLY', label: 'Mingguan', icon: 'calendar-outline' },
                    { id: 'MONTHLY', label: 'Bulanan', icon: 'calendar' },
                    { id: 'ANNUALLY', label: 'Tahunan', icon: 'business-outline' },
                    { id: 'CUSTOM', label: 'Kustom', icon: 'create-outline' }
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.inlineMenuItem,
                        timeRange === item.id && styles.inlineMenuItemActive
                      ]}
                      onPress={() => {
                        if (item.id === 'CUSTOM') {
                          setIsRangeDropdownOpen(false);
                          setShowCustomRangeModal(true);
                        } else {
                          setTimeRange(item.id as any);
                          setIsRangeDropdownOpen(false);
                        }
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Ionicons 
                          name={item.icon as any} 
                          size={18} 
                          color={timeRange === item.id ? '#0f172a' : '#64748b'} 
                        />
                        <Text style={[
                          styles.inlineMenuText,
                          timeRange === item.id && styles.inlineMenuTextActive
                        ]}>
                          {item.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'EXPENSE' && styles.tabActive]}
            onPress={() => setActiveTab('EXPENSE')}
          >
            <Ionicons 
              name="arrow-down" 
              size={12} 
              color={activeTab === 'EXPENSE' ? '#0f172a' : '#94a3b8'} 
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
              name="arrow-up" 
              size={12} 
              color={activeTab === 'INCOME' ? '#0f172a' : '#94a3b8'} 
            />
            <Text style={[styles.tabText, activeTab === 'INCOME' && styles.tabTextActive]}>
              Pemasukan
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Content */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>
            ESTIMASI TOTAL {activeTab === 'EXPENSE' ? 'PENGELUARAN' : 'PEMASUKAN'}
          </Text>
          <Text style={styles.totalAmount}>
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
            <Ionicons name="layers-outline" size={40} color="#94a3b8" />
            <Text style={styles.emptyText}>Tidak ada aktivitas finansial</Text>
          </View>
        )}

        {/* Category List */}
        {categoryData.length > 0 && (
          <View style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryHeaderText}>Analisa Kategori</Text>
            </View>
            {categoryData.map((item) => (
              <View key={item.categoryId} style={styles.categoryItem}>
                <View 
                  style={[styles.categoryIcon, { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#f1f5f9' }]}
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
                            backgroundColor: '#334155' 
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
                    { color: '#0f172a', fontWeight: '800' }
                  ]}>
                    {formatCurrency(item.total)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Custom Range Modal */}
      <Modal
        visible={showCustomRangeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCustomRangeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowCustomRangeModal(false)} />
          <View style={[styles.modalContent, { maxHeight: 400 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Rentang Waktu</Text>
              <TouchableOpacity onPress={() => setShowCustomRangeModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 20, gap: 16 }}>
              <View>
                <Text style={styles.inputLabel}>Tanggal Mulai (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2024-01-01"
                  value={tempRange.start}
                  onChangeText={(val) => setTempRange(prev => ({ ...prev, start: val }))}
                />
              </View>
              <View>
                <Text style={styles.inputLabel}>Tanggal Selesai (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2024-01-31"
                  value={tempRange.end}
                  onChangeText={(val) => setTempRange(prev => ({ ...prev, end: val }))}
                />
              </View>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => {
                  const start = new Date(tempRange.start);
                  const end = new Date(tempRange.end);
                  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                    showAlert({ title: 'Error', message: 'Format tanggal salah', type: 'error' });
                    return;
                  }
                  setCustomRange({ start, end });
                  setTimeRange('CUSTOM');
                  setShowCustomRangeModal(false);
                }}
              >
                <Text style={styles.saveButtonText}>Terapkan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Alert */}
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  tabActive: {
    backgroundColor: '#fff',
    borderColor: '#0f172a',
    borderWidth: 1.5,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#0f172a',
    fontWeight: '700',
  },
  totalCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 12,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  chartCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  emptyCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 12,
  },
  categoryCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
  },
  categoryHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  categoryHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    gap: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  categoryEmoji: {
    fontSize: 18,
  },
  categoryContent: {
    flex: 1,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  percentageText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    width: 36,
    textAlign: 'right',
  },
  transactionCount: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  categoryAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    fontSize: 14,
    color: '#0f172a',
  },
  saveButton: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  monthContent: {
    flex: 1,
    paddingHorizontal: 8,
  },
  monthButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  navRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  filterButtonActive: {
    backgroundColor: '#e2e8f0',
    borderColor: '#cbd5e1',
  },
  inlineDropdown: {
    position: 'absolute',
    top: 54,
    right: 0,
    width: 170,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    zIndex: 1100,
  },
  inlineMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  inlineMenuItemActive: {
    backgroundColor: '#f8fafc',
  },
  inlineMenuText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  inlineMenuTextActive: {
    color: '#0f172a',
    fontWeight: '700',
  },
});
