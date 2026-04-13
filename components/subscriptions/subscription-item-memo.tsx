import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { formatCurrency } from '@/lib/utils/format';
import type { Subscription } from '@/lib/storage/storage-adapter';
import { Colors, getRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Props = {
  subscription: Subscription;
  onEdit: (subscription: Subscription) => void;
  onDelete: (id: string) => void;
};

export const SubscriptionItemMemo = memo<Props>(
  ({ subscription, onEdit, onDelete }) => {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme];
    const isDark = colorScheme === 'dark';

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
      <View style={[
        styles.container, 
        { 
          backgroundColor: theme.card,
          borderColor: theme.border,
          borderRadius: getRadius(100) 
        }
      ]}>
        <View style={[
          styles.iconBox, 
          { 
            backgroundColor: (subscription.color || theme.tint) + '15', 
            borderRadius: getRadius(48) 
          }
        ]}>
          {subscription.iconType === 'image' && subscription.imageUri ? (
            <Image source={{ uri: subscription.imageUri }} style={styles.brandImage} />
          ) : (
            <Ionicons name={(subscription.icon || 'calendar-outline') as any} size={22} color={subscription.color || theme.tint} />
          )}
        </View>

        <TouchableOpacity style={styles.content} onPress={handleEdit} activeOpacity={0.7}>
          <View style={styles.header}>
            <Text style={[styles.name, { color: theme.text }]}>{subscription.name}</Text>
            <Text style={[styles.amount, { color: theme.tint }]}>{formatCurrency(subscription.amount)}</Text>
          </View>

          <View style={styles.details}>
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={12} color={theme.textSecondary} />
              <Text style={[styles.detailText, isOverdue && styles.overdueText, isUpcoming && styles.upcomingText]}>
                {isOverdue ? `Terlambat ${Math.abs(daysUntil)} h` : isUpcoming ? `${daysUntil} h lagi` : nextBillingDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
              </Text>
            </View>
            <View style={[styles.dot, { backgroundColor: theme.border }]} />
            <Text style={styles.cycleText}>{subscription.billingCycle === 'MONTHLY' ? 'Bulanan' : 'Tahunan'}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.deleteBtn, { backgroundColor: isDark ? '#421c1c' : '#fef2f2', borderRadius: getRadius(24) }]} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
    );
  },
  (prev, next) => prev.subscription.id === next.subscription.id && prev.subscription.amount === next.subscription.amount && prev.subscription.nextBillingDate === next.subscription.nextBillingDate
);

SubscriptionItemMemo.displayName = 'SubscriptionItemMemo';

const styles = StyleSheet.create({
  container: { flexDirection: 'row', marginHorizontal: 20, marginVertical: 6, padding: 16, alignItems: 'center', borderWidth: 1 },
  iconBox: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  brandImage: { width: '100%', height: '100%' },
  content: { flex: 1, marginLeft: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  name: { fontSize: 15, fontWeight: '800' },
  amount: { fontSize: 14, fontWeight: '900' },
  details: { flexDirection: 'row', alignItems: 'center' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 11, color: '#64748b', fontWeight: '700' },
  upcomingText: { color: '#f59e0b' },
  overdueText: { color: '#ef4444' },
  dot: { width: 3, height: 3, borderRadius: 2, marginHorizontal: 8 },
  cycleText: { fontSize: 11, color: '#94a3b8', fontWeight: '700' },
  deleteBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
});
