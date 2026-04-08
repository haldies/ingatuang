import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { type Wallet } from '@/lib/storage/storage-adapter';
import { Colors, getRadius } from '@/constants/theme';
import { formatCurrency } from '@/lib/utils/format';

interface WalletItemProps {
  wallet: Wallet;
  onEdit: () => void;
  onDelete: () => void;
}

export function WalletItem({ wallet, onEdit, onDelete }: WalletItemProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  return (
    <View style={[
      styles.card, 
      { 
        backgroundColor: isDark ? '#171717' : '#fff',
        borderColor: isDark ? '#262626' : '#f1f5f9',
        borderRadius: getRadius(100) 
      }
    ]}>
      <View style={styles.content}>
        <View style={[styles.iconBox, { backgroundColor: wallet.color + '15', borderRadius: getRadius(48) }]}>
          <Ionicons name={wallet.icon as any} size={24} color={wallet.color} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: theme.text }]}>{wallet.name}</Text>
          <Text style={styles.balance}>Saldo Aktif</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity 
          onPress={onEdit} 
          style={[
            styles.actionBtn, 
            { backgroundColor: isDark ? '#1a1a1a' : '#f8fafc' }
          ]}
        >
          <Feather name="edit-2" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={onDelete} 
          style={[
            styles.actionBtn, 
            { backgroundColor: isDark ? '#7f1d1d' : '#fef2f2' }
          ]}
        >
          <Feather name="trash-2" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, borderWidth: 1 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  info: { gap: 2 },
  name: { fontSize: 15, fontWeight: '800' },
  balance: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 8, borderRadius: 10 },
});
