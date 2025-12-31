import { View, Text, StyleSheet } from 'react-native';
import { formatCurrency } from '@/lib/format';

interface SummaryCardProps {
  title: string;
  value: number;
  change: number;
}

export function SummaryCard({ title, value, change }: SummaryCardProps) {
  const isPositive = change >= 0;
  const changeColor = isPositive ? '#10b981' : '#ef4444';

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{formatCurrency(value)}</Text>
      {change !== 0 && (
        <Text style={[styles.change, { color: changeColor }]}>
          {isPositive ? '+' : ''}{change.toFixed(1)}%
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  change: {
    fontSize: 12,
    fontWeight: '600',
  },
});
