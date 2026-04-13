import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { formatCurrency } from '@/lib/utils/format';
import type { DashboardStats } from '@/lib/storage/storage-adapter';
import { useTranslation } from 'react-i18next';
import { Colors, getRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface BalanceCardProps {
  stats: DashboardStats;
}

export function BalanceCard({ stats }: BalanceCardProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  
  return (
    <View style={styles.outerContainer}>
      <View style={[styles.card, { backgroundColor: theme.background, shadowColor: '#000' }]}>
        {/* Main Balance */}
        <View style={styles.balanceContainer}>
          <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>
            {t('dashboard.total_balance')}
          </Text>
          <Text style={[styles.balanceValue, { color: theme.text }]}>
            {formatCurrency(stats.totalBalance)}
          </Text>
          
          {stats.balanceChange !== undefined && (
            <View style={[styles.changeBadge, { backgroundColor: isDark ? theme.card : '#f1f5f9' }]}>
              <Text style={[styles.changeText, { color: stats.balanceChange >= 0 ? '#10b981' : '#ef4444' }]}>
                {stats.balanceChange >= 0 ? '+' : ''}{stats.balanceChange.toFixed(1)}%
              </Text>
              <Text style={[styles.vsText, { color: theme.textSecondary }]}>{t('dashboard.vs_last_month')}</Text>
            </View>
          )}
        </View>

        {/* Income & Expense Row */}
        <View style={[styles.row, { backgroundColor: isDark ? theme.card : '#f8fafc' }]}>
          <View style={styles.rowItem}>
            <View style={styles.iconBox}>
              <Feather name="arrow-down-circle" size={20} color="#10b981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>{t('dashboard.income')}</Text>
              <Text style={[styles.rowValue, { color: theme.text }]} numberOfLines={1}>
                {formatCurrency(stats.totalIncome)}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.rowItem}>
            <View style={styles.iconBox}>
              <Feather name="arrow-up-circle" size={20} color="#ef4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>{t('dashboard.expense')}</Text>
              <Text style={[styles.rowValue, { color: theme.text }]} numberOfLines={1}>
                {formatCurrency(stats.totalExpense)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    marginHorizontal: 16,
    marginVertical: 16,
  },
  card: {
    borderRadius: getRadius(320, 'large'),
    padding: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  balanceContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 12,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  changeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  vsText: {
    fontSize: 11,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 30,
  },
  rowItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  divider: {
    width: 1,
    height: 24,
    marginHorizontal: 12,
  },
});
