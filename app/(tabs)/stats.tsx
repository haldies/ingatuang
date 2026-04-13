import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Platform,
  RefreshControl,
  useColorScheme as useNativeColorScheme
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CustomAlert } from '@/components/ui/custom-alert';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { Header } from '@/components/ui/header';
import { 
  storage,
  type StatsData,
} from '@/lib/storage/storage-adapter';
import { formatMonthYear, formatCurrency } from '@/lib/utils/format';
import { PieChart } from '@/components/stats/pie-chart';
import { eventEmitter, EVENTS } from '@/lib/utils/events';
import { Colors, getRadius } from '@/constants/theme';

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useNativeColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  
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
    buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>;
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
      case 'ANNUALLY': return currentDate.getFullYear().toString();
      case 'CUSTOM': return `${customRange.start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${customRange.end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      default: return formatMonthYear(currentDate);
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
        endDate = new Date(currentDate.getFullYear(), currentDate.getFullYear(), 31, 23, 59, 59, 999);
      } else if (timeRange === 'CUSTOM') {
        startDate = customRange.start;
        endDate = customRange.end;
      } else {
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

  const categoryData = activeTab === 'EXPENSE' ? stats?.expenseByCategory || [] : stats?.incomeByCategory || [];
  const totalAmount = activeTab === 'EXPENSE' ? stats?.totalExpense || 0 : stats?.totalIncome || 0;

  if (loading && !refreshing) {
    return (
      <ScreenWrapper>
        <Header title="Statistik & Analisa" hideBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.tint} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper backgroundColor={theme.background}>
      <Header title="Statistik & Analisa" hideBack />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={loadData} 
            tintColor={theme.tint} 
          />
        }
      >
        <View style={[
          styles.monthNav, 
          { 
            backgroundColor: theme.background,
            borderBottomColor: colorScheme === 'dark' ? '#262626' : '#f1f5f9'
          }
        ]}>
          <TouchableOpacity onPress={goToPrevious} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={20} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.monthContent}>
            <Text style={[styles.monthText, { color: theme.text }]}>{getRangeLabels()}</Text>
          </View>
          <View style={styles.navRightGroup}>
            <TouchableOpacity onPress={goToNext} style={styles.navBtn}>
              <Ionicons name="chevron-forward" size={20} color={theme.text} />
            </TouchableOpacity>
            <View>
              <TouchableOpacity 
                style={[
                  styles.filterBtn, 
                  isRangeDropdownOpen && { backgroundColor: theme.tint + '15', borderRadius: 8 }
                ]}
                onPress={() => setIsRangeDropdownOpen(!isRangeDropdownOpen)}
              >
                <Ionicons name="options" size={18} color={theme.text} />
              </TouchableOpacity>
              
              {isRangeDropdownOpen && (
                <View style={[
                  styles.inlineDropdown, 
                  { 
                    backgroundColor: theme.background,
                    borderColor: colorScheme === 'dark' ? '#262626' : '#f1f5f9',
                    borderRadius: getRadius(170, 'medium') 
                  }
                ]}>
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
                        timeRange === item.id && { backgroundColor: colorScheme === 'dark' ? '#262626' : '#f1f5f9' }
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
                          size={16} 
                          color={timeRange === item.id ? theme.tint : '#64748b'} 
                        />
                        <Text style={[
                          styles.inlineMenuText, 
                          timeRange === item.id && { color: theme.tint, fontWeight: '700' }
                        ]}>
                          {item.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={[styles.tabContainer, { backgroundColor: theme.background }]}>
          <TouchableOpacity 
            style={[
              styles.tab, 
              { backgroundColor: colorScheme === 'dark' ? '#262626' : '#f8fafc', borderColor: colorScheme === 'dark' ? '#404040' : '#f1f5f9' },
              activeTab === 'EXPENSE' && { backgroundColor: theme.background, borderColor: theme.tint, borderWidth: 1.5 }
            ]} 
            onPress={() => setActiveTab('EXPENSE')}
          >
            <Ionicons name="arrow-down" size={12} color={activeTab === 'EXPENSE' ? theme.tint : '#94a3b8'} />
            <Text style={[
              styles.tabText, 
              activeTab === 'EXPENSE' && { color: theme.tint, fontWeight: '700' }
            ]}>
              Pengeluaran
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.tab, 
              { backgroundColor: colorScheme === 'dark' ? '#262626' : '#f8fafc', borderColor: colorScheme === 'dark' ? '#404040' : '#f1f5f9' },
              activeTab === 'INCOME' && { backgroundColor: theme.background, borderColor: theme.tint, borderWidth: 1.5 }
            ]} 
            onPress={() => setActiveTab('INCOME')}
          >
            <Ionicons name="arrow-up" size={12} color={activeTab === 'INCOME' ? theme.tint : '#94a3b8'} />
            <Text style={[
              styles.tabText, 
              activeTab === 'INCOME' && { color: theme.tint, fontWeight: '700' }
            ]}>
              Pemasukan
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[
          styles.totalCard, 
          { 
            backgroundColor: theme.background, 
            borderColor: colorScheme === 'dark' ? '#262626' : '#f1f5f9',
            borderRadius: getRadius(100) 
          }
        ]}>
          <Text style={styles.totalLabel}>ESTIMASI TOTAL {activeTab === 'EXPENSE' ? 'PENGELUARAN' : 'PEMASUKAN'}</Text>
          <Text style={[styles.totalAmount, { color: theme.text }]}>{formatCurrency(totalAmount)}</Text>
        </View>

        {categoryData.length > 0 ? (
          <View style={[
            styles.chartCard, 
            { 
              backgroundColor: theme.background,
              borderColor: colorScheme === 'dark' ? '#262626' : '#f1f5f9',
              borderRadius: getRadius(220) 
            }
          ]}>
            <PieChart data={categoryData} />
          </View>
        ) : (
          <View style={[
            styles.emptyCard, 
            { 
              backgroundColor: theme.background,
              borderColor: colorScheme === 'dark' ? '#262626' : '#f1f5f9',
              borderRadius: getRadius(150) 
            }
          ]}>
            <Ionicons name="layers-outline" size={40} color={colorScheme === 'dark' ? '#262626' : '#e2e8f0'} />
            <Text style={styles.emptyText}>Tidak ada aktivitas finansial</Text>
          </View>
        )}

        {categoryData.length > 0 && (
          <View style={[
            styles.categoryCard, 
            { 
              backgroundColor: theme.background,
              borderColor: colorScheme === 'dark' ? '#262626' : '#f1f5f9',
              borderRadius: getRadius(200) 
            }
          ]}>
            <View style={[styles.categoryHeader, { backgroundColor: colorScheme === 'dark' ? '#262626' : '#f8fafc' }]}>
              <Text style={styles.categoryHeaderText}>Analisa Kategori</Text>
            </View>
            {categoryData.map((item) => (
              <View key={item.categoryId} style={[styles.categoryItem, { borderBottomColor: colorScheme === 'dark' ? '#262626' : '#f1f5f9' }]}>
                <View style={[
                  styles.categoryIcon, 
                  { 
                    backgroundColor: colorScheme === 'dark' ? '#262626' : '#f8fafc',
                    borderColor: colorScheme === 'dark' ? '#404040' : '#f1f5f9',
                    borderRadius: getRadius(40) 
                  }
                ]}>
                  <Text style={styles.categoryEmoji}>{item.categoryIcon}</Text>
                </View>
                <View style={styles.categoryContent}>
                  <Text style={[styles.categoryName, { color: theme.text }]}>{item.categoryName}</Text>
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { backgroundColor: colorScheme === 'dark' ? '#262626' : '#f1f5f9' }]}>
                      <View style={[
                        styles.progressFill, 
                        { width: `${item.percentage}%`, backgroundColor: colorScheme === 'dark' ? '#3b82f6' : '#475569' }
                      ]} />
                    </View>
                    <Text style={styles.percentageText}>{item.percentage.toFixed(1)}%</Text>
                  </View>
                </View>
                <View style={styles.categoryAmount}>
                  <Text style={[styles.amountText, { color: theme.text }]}>{formatCurrency(item.total)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={showCustomRangeModal} transparent animationType="fade" onRequestClose={() => setShowCustomRangeModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowCustomRangeModal(false)} />
          <View style={[
            styles.modalContent, 
            { 
              backgroundColor: theme.background,
              borderRadius: getRadius(300, 'large') 
            }
          ]}>
            <View style={[styles.modalHeader, { borderBottomColor: colorScheme === 'dark' ? '#262626' : '#f1f5f9' }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Rentang Waktu</Text>
              <TouchableOpacity onPress={() => setShowCustomRangeModal(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 20, gap: 16 }}>
              <View>
                <Text style={styles.inputLabel}>Mulai (YYYY-MM-DD)</Text>
                <TextInput 
                  style={[
                    styles.input, 
                    { 
                      backgroundColor: colorScheme === 'dark' ? '#262626' : '#f8fafc',
                      borderColor: colorScheme === 'dark' ? '#404040' : '#f1f5f9',
                      color: theme.text,
                      borderRadius: getRadius(50) 
                    }
                  ]} 
                  placeholder="2024-01-01" 
                  placeholderTextColor="#64748b"
                  value={tempRange.start} 
                  onChangeText={(val) => setTempRange(prev => ({ ...prev, start: val }))} 
                />
              </View>
              <View>
                <Text style={styles.inputLabel}>Selesai (YYYY-MM-DD)</Text>
                <TextInput 
                  style={[
                    styles.input, 
                    { 
                      backgroundColor: colorScheme === 'dark' ? '#262626' : '#f8fafc',
                      borderColor: colorScheme === 'dark' ? '#404040' : '#f1f5f9',
                      color: theme.text,
                      borderRadius: getRadius(50) 
                    }
                  ]} 
                  placeholder="2024-01-31" 
                  placeholderTextColor="#64748b"
                  value={tempRange.end} 
                  onChangeText={(val) => setTempRange(prev => ({ ...prev, end: val }))} 
                />
              </View>
              <TouchableOpacity 
                style={[styles.saveBtn, { backgroundColor: theme.tint, borderRadius: getRadius(56) }]} 
                onPress={() => { 
                  const start = new Date(tempRange.start); 
                  const end = new Date(tempRange.end); 
                  if (isNaN(start.getTime()) || isNaN(end.getTime())) { 
                    showAlert({ title: 'Error', message: 'Format salah', type: 'error' }); 
                    return; 
                  } 
                  setCustomRange({ start, end }); 
                  setTimeRange('CUSTOM'); 
                  setShowCustomRangeModal(false); 
                }}
              >
                <Text style={styles.saveBtnText}>Terapkan</Text>
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
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  monthNav: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1 },
  monthContent: { flex: 1, alignItems: 'center' },
  navBtn: { padding: 8, backgroundColor: 'transparent' },
  monthText: { fontSize: 13, fontWeight: '800', letterSpacing: -0.3 },
  navRightGroup: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', width: 40, height: 40 },
  tabContainer: { flexDirection: 'row', padding: 16, gap: 12 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, gap: 6, borderWidth: 1 },
  tabText: { fontSize: 12, fontWeight: '500', color: '#64748b' },
  totalCard: { margin: 16, marginBottom: 12, padding: 20, alignItems: 'center', borderWidth: 1 },
  totalLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', marginBottom: 6, letterSpacing: 0.5 },
  totalAmount: { fontSize: 24, fontWeight: '900', letterSpacing: -1 },
  chartCard: { marginHorizontal: 16, marginBottom: 12, padding: 24, alignItems: 'center', borderWidth: 1 },
  emptyCard: { marginHorizontal: 16, padding: 40, alignItems: 'center', borderWidth: 1 },
  emptyText: { fontSize: 13, color: '#94a3b8', marginTop: 12 },
  categoryCard: { marginHorizontal: 16, marginBottom: 24, borderWidth: 1, overflow: 'hidden' },
  categoryHeader: { paddingHorizontal: 16, paddingVertical: 12 },
  categoryHeaderText: { fontSize: 12, fontWeight: '700', color: '#64748b', letterSpacing: 0.5 },
  categoryItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, gap: 12 },
  categoryIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  categoryEmoji: { fontSize: 20 },
  categoryContent: { flex: 1 },
  categoryName: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  percentageText: { fontSize: 11, fontWeight: '700', color: '#64748b' },
  categoryAmount: { alignItems: 'flex-end', justifyContent: 'center' },
  amountText: { fontSize: 15, fontWeight: '900' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'center', padding: 24 },
  modalContent: { width: '100%', overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, alignItems: 'center' },
  modalTitle: { fontSize: 16, fontWeight: '800' },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 8 },
  input: { padding: 14, borderWidth: 1, fontSize: 14 },
  saveBtn: { padding: 16, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  inlineDropdown: { position: 'absolute', top: 50, right: 0, width: 170, padding: 6, borderWidth: 1, zIndex: 1100, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  inlineMenuItem: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 },
  inlineMenuText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
});
