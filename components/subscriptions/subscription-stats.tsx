import { View, Text, StyleSheet } from 'react-native';
import { formatCurrency } from '@/lib/utils/format';
import type { SubscriptionStats } from '@/lib/storage/storage-adapter';

interface SubscriptionStatsProps {
  stats: SubscriptionStats;
}

export function SubscriptionStatsComponent({ stats }: SubscriptionStatsProps) {
  return (
    <View style={styles.container}>
      {/* Main Stats Row */}
      <View style={styles.mainRow}>
        <View style={styles.mainStat}>
          <Text style={styles.mainLabel}>Per Bulan</Text>
          <Text style={styles.mainValue}>{formatCurrency(stats.monthlyCost)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.mainStat}>
          <Text style={styles.mainLabel}>Per Tahun</Text>
          <Text style={styles.mainValue}>{formatCurrency(stats.yearlyCost)}</Text>
        </View>
      </View>

      {/* Secondary Stats Row */}
      <View style={styles.secondaryRow}>
        <View style={styles.secondaryStat}>
          <Text style={styles.secondaryValue}>{stats.totalActive}</Text>
          <View style={styles.secondaryTextContainer}>
            <Text style={styles.secondaryLabel}>Total Aktif</Text>
          </View>
        </View>
        <View style={styles.secondaryStat}>
          <Text style={[styles.secondaryValue, { color: '#f59e0b' }]}>{stats.upcomingRenewals}</Text>
          <View style={styles.secondaryTextContainer}>
            <Text style={styles.secondaryLabel}>Akan Datang</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 16,
  },
  mainStat: {
    flex: 1,
  },
  mainLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  mainValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  divider: {
    width: 1,
    backgroundColor: '#f3f4f6',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  secondaryStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 16,
    gap: 10,
  },
  secondaryTextContainer: {
    flex: 1,
  },
  secondaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3b82f6',
  },
  secondaryLabel: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '600',
  },
});
