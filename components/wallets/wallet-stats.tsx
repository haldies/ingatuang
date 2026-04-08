import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { type WalletStats } from '@/lib/storage/storage-adapter';
import { formatCurrency } from '@/lib/utils/format';
import { Colors, getRadius } from '@/constants/theme';

interface WalletStatsProps {
  stats: WalletStats;
}

export function WalletStats({ stats }: WalletStatsProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <View style={[styles.card, { borderRadius: getRadius(180, 'large'), backgroundColor: theme.tint }]}>
      <Text style={styles.label}>TOTAL SALDO TERSEDIA</Text>
      <Text style={styles.amount}>{formatCurrency(stats.totalBalance)}</Text>
      <View style={styles.footer}>
        <View>
          <Text style={styles.subLabel}>DOMPET AKTIF</Text>
          <Text style={styles.subVal}>{stats.walletCount}</Text>
        </View>
        <View style={styles.divider} />
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.subLabel}>AKTIVITAS BULAN INI</Text>
          <Text style={styles.subVal}>{stats.transactionCount} Transaksi</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 24, marginBottom: 24, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 10 },
  label: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
  amount: { fontSize: 26, fontWeight: '900', color: '#fff', marginVertical: 8 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', paddingTop: 16 },
  subLabel: { fontSize: 8, fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: 2 },
  subVal: { fontSize: 14, fontWeight: '800', color: '#fff' },
  divider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.2)' },
});
