import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getStats, type StatsData } from '@/lib/storage';
import { formatMonthYear, formatCurrency } from '@/lib/format';
import { PieChart } from '@/components/stats/pie-chart';
import { eventEmitter, EVENTS } from '@/lib/events';

export default function StatsScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const statsData = await getStats(year, month);
      setStats(statsData);
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
      <ScrollView showsVerticalScrollIndicator={false}>
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
        </View>

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

        {/* Category Legend */}
        {categoryData.length > 0 && (
          <View style={styles.legendCard}>
            <View style={styles.legendContainer}>
              {categoryData.map((item) => (
                <View key={item.categoryId} style={styles.legendItem}>
                  <View style={styles.legendRow}>
                    <View 
                      style={[styles.legendDot, { backgroundColor: item.categoryColor }]}
                    />
                    <Text style={styles.legendEmoji}>{item.categoryIcon}</Text>
                    <Text style={styles.legendName}>{item.categoryName}</Text>
                  </View>
                  <View style={styles.legendStats}>
                    <Text style={styles.legendPercentage}>
                      {item.percentage.toFixed(1)}%
                    </Text>
                    <Text style={[
                      styles.legendAmount,
                      activeTab === 'EXPENSE' ? styles.amountExpense : styles.amountIncome
                    ]}>
                      {formatCurrency(item.total)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
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
      </ScrollView>
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
});
