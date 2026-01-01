import { View, Text, StyleSheet } from 'react-native';
import { formatCurrency } from '@/lib/format';
import type { DashboardStats } from '@/lib/storage';

interface BalanceCardProps {
  stats: DashboardStats;
}

export function BalanceCard({ stats }: BalanceCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Main Balance */}
        <View style={styles.mainBalance}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceValue}>{formatCurrency(stats.balance)}</Text>
          {stats.balanceChange !== undefined && (
            <View style={styles.changeContainer}>
              <Text style={[
                styles.changeText,
                stats.balanceChange >= 0 ? styles.changePositive : styles.changeNegative
              ]}>
                {stats.balanceChange >= 0 ? '+' : ''}{stats.balanceChange.toFixed(1)}%
              </Text>
              <Text style={styles.changeLabel}>vs bulan lalu</Text>
            </View>
          )}
        </View>

        {/* Income & Expense Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, styles.incomeIcon]}>
              <Text style={[styles.statIcon, { color: '#10b981' }]}>↓</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Pemasukan</Text>
              <Text style={styles.statValue}>{formatCurrency(stats.totalIncome)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, styles.expenseIcon]}>
              <Text style={[styles.statIcon, { color: '#ef4444' }]}>↑</Text>
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Pengeluaran</Text>
              <Text style={styles.statValue}>{formatCurrency(stats.totalExpense)}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mainBalance: {
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  balanceValue: {
    fontSize: 40,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  changeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  changePositive: {
    color: '#10b981',
  },
  changeNegative: {
    color: '#ef4444',
  },
  changeLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 12,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incomeIcon: {
    backgroundColor: '#d1fae5',
  },
  expenseIcon: {
    backgroundColor: '#fee2e2',
  },
  statIcon: {
    fontSize: 16,
    fontWeight: '600',
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 2,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 12,
  },
});
