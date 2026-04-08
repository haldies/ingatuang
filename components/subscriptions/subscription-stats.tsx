import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { formatCurrency } from '@/lib/utils/format';
import type { SubscriptionStats } from '@/lib/storage/storage-adapter';
import { Colors, getRadius } from '@/constants/theme';

interface SubscriptionStatsProps {
  stats: SubscriptionStats;
}

export function SubscriptionStatsComponent({ stats }: SubscriptionStatsProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: isDark ? '#171717' : '#fff',
        borderColor: isDark ? '#262626' : '#f1f5f9',
        borderRadius: getRadius(180, 'large'),
        shadowColor: theme.tint 
      }
    ]}>
      <View style={styles.mainRow}>
        <View style={styles.mainStat}>
          <Text style={styles.mainLabel}>PENGELUARAN BULANAN</Text>
          <Text style={[styles.mainValue, { color: theme.text }]}>{formatCurrency(stats.monthlyCost)}</Text>
        </View>
      </View>

      <View style={styles.secondaryRow}>
        <View style={[
          styles.secondaryStat, 
          { 
            backgroundColor: isDark ? '#1a1a1a' : '#f8fafc',
            borderColor: isDark ? '#262626' : '#f1f5f9',
            borderRadius: getRadius(56) 
          }
        ]}>
          <Text style={styles.secondaryLabel}>TAHUNAN</Text>
          <Text style={[styles.secondaryValue, { color: isDark ? '#e5e7eb' : '#1e293b' }]}>{formatCurrency(stats.yearlyCost)}</Text>
        </View>
        <View style={[
          styles.secondaryStat, 
          { 
            backgroundColor: isDark ? '#1a1a1a' : '#f8fafc',
            borderColor: isDark ? '#262626' : '#f1f5f9',
            borderRadius: getRadius(56) 
          }
        ]}>
          <Text style={styles.secondaryLabel}>AKTIF</Text>
          <Text style={[styles.secondaryValue, { color: theme.tint }]}>{stats.totalActive} Akun</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  mainRow: { marginBottom: 24 },
  mainStat: { gap: 4 },
  mainLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '800', letterSpacing: 1 },
  mainValue: { fontSize: 28, fontWeight: '900' },
  secondaryRow: { flexDirection: 'row', gap: 12 },
  secondaryStat: { flex: 1, padding: 14, gap: 4, borderWidth: 1 },
  secondaryLabel: { fontSize: 8, color: '#94a3b8', fontWeight: '800', letterSpacing: 0.5 },
  secondaryValue: { fontSize: 13, fontWeight: '800' },
});
