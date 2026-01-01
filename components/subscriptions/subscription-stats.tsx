import { View, Text, StyleSheet } from 'react-native';
import { formatCurrency } from '@/lib/format';
import type { SubscriptionStats } from '@/lib/storage';

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
          <Text style={styles.secondaryLabel}>Aktif</Text>
        </View>
        <View style={styles.secondaryStat}>
          <Text style={styles.secondaryValue}>{stats.upcomingRenewals}</Text>
          <Text style={styles.secondaryLabel}>Perpanjang 7 Hari</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainStat: {
    flex: 1,
    alignItems: 'center',
  },
  mainLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  mainValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  secondaryRow: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  secondaryStat: {
    flex: 1,
    alignItems: 'center',
  },
  secondaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3b82f6',
    marginBottom: 2,
  },
  secondaryLabel: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'center',
  },
});
