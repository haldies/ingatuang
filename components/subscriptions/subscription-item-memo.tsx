import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { formatCurrency } from '@/lib/utils/format';
import type { Subscription } from '@/lib/storage/storage-adapter';
import { Colors, getRadius } from '@/constants/theme';

type Props = {
  subscription: Subscription;
  onEdit: (subscription: Subscription) => void;
  onDelete: (id: string) => void;
};

export const SubscriptionItemMemo = memo<Props>(
  ({ subscription, onEdit, onDelete }) => {
    const handleDelete = useCallback(() => {
      Alert.alert(
        'Hapus Langganan',
        `Yakin ingin menghapus ${subscription.name}?`,
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Hapus', style: 'destructive', onPress: () => onDelete(subscription.id) },
        ]
      );
    }, [subscription.id, subscription.name, onDelete]);

    const handleEdit = useCallback(() => { onEdit(subscription); }, [subscription, onEdit]);

    const nextBillingDate = new Date(subscription.nextBillingDate);
    const today = new Date();
    const daysUntil = Math.ceil((nextBillingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isUpcoming = daysUntil <= 7 && daysUntil >= 0;
    const isOverdue = daysUntil < 0;

    return (
      <View style={[styles.container, { borderRadius: getRadius(100) }]}>
        <View style={[styles.iconBox, { backgroundColor: (subscription.color || Colors.light.tint) + '15', borderRadius: getRadius(48) }]}>
          {subscription.iconType === 'image' && subscription.imageUri ? (
            <Image source={{ uri: subscription.imageUri }} style={styles.brandImage} />
          ) : (
            <Ionicons name={(subscription.icon || 'calendar-outline') as any} size={22} color={subscription.color || Colors.light.tint} />
          )}
        </View>

        <TouchableOpacity style={styles.content} onPress={handleEdit} activeOpacity={0.7}>
          <View style={styles.header}>
            <Text style={styles.name}>{subscription.name}</Text>
            <Text style={[styles.amount, { color: Colors.light.tint }]}>{formatCurrency(subscription.amount)}</Text>
          </View>

          <View style={styles.details}>
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={12} color="#94a3b8" />
              <Text style={[styles.detailText, isOverdue && styles.overdueText, isUpcoming && styles.upcomingText]}>
                {isOverdue ? `Terlambat ${Math.abs(daysUntil)} h` : isUpcoming ? `${daysUntil} h lagi` : nextBillingDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
              </Text>
            </View>
            <View style={styles.dot} />
            <Text style={styles.cycleText}>{subscription.billingCycle === 'MONTHLY' ? 'Bulanan' : 'Tahunan'}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.deleteBtn, { borderRadius: getRadius(24) }]} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
    );
  },
  (prev, next) => prev.subscription.id === next.subscription.id && prev.subscription.amount === next.subscription.amount && prev.subscription.nextBillingDate === next.subscription.nextBillingDate
);

SubscriptionItemMemo.displayName = 'SubscriptionItemMemo';

const styles = StyleSheet.create({
  container: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 20, marginVertical: 6, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' },
  iconBox: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  brandImage: { width: '100%', height: '100%' },
  content: { flex: 1, marginLeft: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  name: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  amount: { fontSize: 14, fontWeight: '900' },
  details: { flexDirection: 'row', alignItems: 'center' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 11, color: '#64748b', fontWeight: '700' },
  upcomingText: { color: '#f59e0b' },
  overdueText: { color: '#ef4444' },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#cbd5e1', marginHorizontal: 8 },
  cycleText: { fontSize: 11, color: '#94a3b8', fontWeight: '700' },
  deleteBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', marginLeft: 8 },
});
