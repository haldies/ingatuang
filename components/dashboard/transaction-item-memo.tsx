import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { Colors } from '@/constants/theme';

type TransactionWithCategory = {
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
};

type Props = {
  transaction: TransactionWithCategory;
  onPress: (transaction: TransactionWithCategory) => void;
};

// Memoized component untuk performa lebih baik
export const TransactionItemMemo = memo<Props>(({ transaction, onPress }) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.background, borderBottomColor: theme.border }]}
      onPress={() => onPress(transaction)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: transaction.category.color + '20' }]}>
        <Text style={styles.icon}>{transaction.category.icon}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.categoryName, { color: theme.text }]}>{transaction.category.name}</Text>
        {transaction.notes && (
          <Text style={[styles.notes, { color: theme.textSecondary }]} numberOfLines={1}>
            {transaction.notes}
          </Text>
        )}
        <Text style={[styles.date, { color: theme.tabIconDefault }]}>{formatDate(transaction.date)}</Text>
      </View>
      <Text
        style={[
          styles.amount,
          transaction.type === 'INCOME' ? styles.income : styles.expense,
        ]}
      >
        {transaction.type === 'INCOME' ? '+' : '-'}
        {formatCurrency(transaction.amount)}
      </Text>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Custom comparison untuk optimasi re-render
  return (
    prevProps.transaction.id === nextProps.transaction.id &&
    prevProps.transaction.amount === nextProps.transaction.amount &&
    prevProps.transaction.notes === nextProps.transaction.notes
  );
});

TransactionItemMemo.displayName = 'TransactionItemMemo';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  notes: {
    fontSize: 12,
    marginBottom: 2,
  },
  date: {
    fontSize: 11,
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
  },
  income: {
    color: '#10b981',
  },
  expense: {
    color: '#ef4444',
  },
});
