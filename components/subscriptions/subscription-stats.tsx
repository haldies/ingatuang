import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '@/lib/format';
import type { SubscriptionStats } from '@/lib/storage';

interface SubscriptionStatsProps {
  stats: SubscriptionStats;
}

export function SubscriptionStatsComponent({ stats }: SubscriptionStatsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.statCard}>
          <View style={[styles.iconContainer, { backgroundColor: '#dbeafe' }]}>
            <Ionicons name="trending-up" size={20} color="#3b82f6" />
          </View>
          <Text style={styles.statValue}>{stats.totalActive}</Text>
          <Text style={styles.statLabel}>aktif</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.iconContainer, { backgroundColor: '#dcfce7' }]}>
            <Ionicons name="cash" size={20} color="#10b981" />
          </View>
          <Text style={styles.statValue}>
            {(stats.monthlyCost / 1000).toFixed(0)}K
          </Text>
          <Text style={styles.statLabel}>/bulan</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.statCard}>
          <View style={[styles.iconContainer, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="calendar" size={20} color="#f59e0b" />
          </View>
          <Text style={styles.statValue}>
            {(stats.yearlyCost / 1000000).toFixed(1)}M
          </Text>
          <Text style={styles.statLabel}>/tahun</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.iconContainer, { backgroundColor: '#fee2e2' }]}>
            <Ionicons name="alert-circle" size={20} color="#ef4444" />
          </View>
          <Text style={styles.statValue}>{stats.upcomingRenewals}</Text>
          <Text style={styles.statLabel}>7 hari</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
});
