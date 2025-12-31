import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { formatCurrency, formatDate } from '@/lib/format';

interface TransactionWithCategory {
  id: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  notes?: string;
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
}

interface TransactionItemProps {
  transaction: TransactionWithCategory;
  onPress?: (transaction: TransactionWithCategory) => void;
}

export function TransactionItem({ transaction, onPress }: TransactionItemProps) {
  const isIncome = transaction.type === 'INCOME';
  const amountColor = isIncome ? '#10b981' : '#ef4444';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(transaction)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <View
          style={[
            styles.icon,
            { backgroundColor: transaction.category.color || '#3b82f6' },
          ]}
        >
          <Text style={styles.iconText}>{transaction.category.icon || '💰'}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.category}>{transaction.category.name}</Text>
        {transaction.notes && (
          <Text style={styles.notes} numberOfLines={1}>
            {transaction.notes}
          </Text>
        )}
        <Text style={styles.date}>{formatDate(transaction.date)}</Text>
      </View>

      <View style={styles.amountContainer}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {isIncome ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  category: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  notes: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  date: {
    fontSize: 11,
    color: '#9ca3af',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
  },
});
