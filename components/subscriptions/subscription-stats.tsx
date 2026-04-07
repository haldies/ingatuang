import { View, Text, StyleSheet } from 'react-native';
import { formatCurrency } from '@/lib/utils/format';
import type { SubscriptionStats } from '@/lib/storage/storage-adapter';
import { Colors, getRadius } from '@/constants/theme';

interface SubscriptionStatsProps {
  stats: SubscriptionStats;
}

export function SubscriptionStatsComponent({ stats }: SubscriptionStatsProps) {
  return (
    <View style={[styles.container, { borderRadius: getRadius(180, 'large') }]}>
      <View style={styles.mainRow}>
        <View style={styles.mainStat}>
          <Text style={styles.mainLabel}>PENGELUARAN BULANAN</Text>
          <Text style={styles.mainValue}>{formatCurrency(stats.monthlyCost)}</Text>
        </View>
      </View>

      <View style={styles.secondaryRow}>
        <View style={[styles.secondaryStat, { borderRadius: getRadius(56) }]}>
          <Text style={styles.secondaryLabel}>TAHUNAN</Text>
          <Text style={styles.secondaryValue}>{formatCurrency(stats.yearlyCost)}</Text>
        </View>
        <View style={[styles.secondaryStat, { borderRadius: getRadius(56) }]}>
          <Text style={styles.secondaryLabel}>AKTIF</Text>
          <Text style={[styles.secondaryValue, { color: Colors.light.tint }]}>{stats.totalActive} Akun</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 24,
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 12,
  },
  mainRow: { marginBottom: 24 },
  mainStat: { gap: 4 },
  mainLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '800', letterSpacing: 1 },
  mainValue: { fontSize: 28, fontWeight: '900', color: '#0f172a' },
  secondaryRow: { flexDirection: 'row', gap: 12 },
  secondaryStat: { flex: 1, backgroundColor: '#f8fafc', padding: 14, gap: 4, borderWidth: 1, borderColor: '#f1f5f9' },
  secondaryLabel: { fontSize: 8, color: '#94a3b8', fontWeight: '800', letterSpacing: 0.5 },
  secondaryValue: { fontSize: 13, fontWeight: '800', color: '#1e293b' },
});
