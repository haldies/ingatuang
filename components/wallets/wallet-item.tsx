import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
  return (
    <View style={[styles.card, { borderRadius: getRadius(100) }]}>
      <View style={styles.content}>
        <View style={[styles.iconBox, { backgroundColor: wallet.color + '15', borderRadius: getRadius(48) }]}>
          <Ionicons name={wallet.icon as any} size={24} color={wallet.color} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{wallet.name}</Text>
          <Text style={styles.balance}>Saldo Aktif</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={onEdit} style={styles.actionBtn}>
          <Feather name="edit-2" size={18} color="#64748b" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={styles.actionBtn}>
          <Feather name="trash-2" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  info: { gap: 2 },
  name: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  balance: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 8, backgroundColor: '#f8fafc', borderRadius: 10 },
});
