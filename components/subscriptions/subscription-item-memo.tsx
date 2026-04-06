import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { formatCurrency } from '@/lib/utils/format';
import type { Subscription } from '@/lib/storage/storage-adapter';

type Props = {
  subscription: Subscription;
  onEdit: (subscription: Subscription) => void;
  onDelete: (id: string) => void;
};

// Memoized subscription item untuk performa lebih baik
export const SubscriptionItemMemo = memo<Props>(
  ({ subscription, onEdit, onDelete }) => {
    const handleDelete = useCallback(() => {
      Alert.alert(
        'Hapus Langganan',
        `Yakin ingin menghapus ${subscription.name}?`,
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Hapus',
            style: 'destructive',
            onPress: () => onDelete(subscription.id),
          },
        ]
      );
    }, [subscription.id, subscription.name, onDelete]);


    const handleEdit = useCallback(() => {
      onEdit(subscription);
    }, [subscription, onEdit]);

    const nextBillingDate = new Date(subscription.nextBillingDate);
    const today = new Date();
    const daysUntil = Math.ceil(
      (nextBillingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    const isUpcoming = daysUntil <= 7 && daysUntil >= 0;
    const isOverdue = daysUntil < 0;

    return (
      <View style={styles.container}>
        <View style={[styles.iconContainer, subscription.iconType === 'image' ? styles.imageContainer : { backgroundColor: (subscription.color || '#3b82f6') + '15' }]}>
          {subscription.iconType === 'image' && subscription.imageUri ? (
            <Image 
              source={{ uri: subscription.imageUri }} 
              style={styles.brandImage} 
            />
          ) : (
            <Ionicons 
              name={(subscription.icon || 'calendar-outline') as any} 
              size={24} 
              color={subscription.color || '#3b82f6'} 
            />
          )}
        </View>

        <TouchableOpacity
          style={styles.content}
          onPress={handleEdit}
          activeOpacity={0.7}
        >
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.name}>{subscription.name}</Text>
            </View>
            <Text style={styles.amount}>{formatCurrency(subscription.amount)}</Text>
          </View>

          <View style={styles.details}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={14} color="#6b7280" />
              <Text style={styles.detailText}>
                Setiap {subscription.billingCycle === 'MONTHLY' ? 'bulan' : 'tahun'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={14} color="#6b7280" />
              <Text
                style={[
                  styles.detailText,
                  isOverdue && styles.overdueText,
                  isUpcoming && styles.upcomingText,
                ]}
              >
                {isOverdue
                  ? `Terlambat ${Math.abs(daysUntil)} hari`
                  : isUpcoming
                  ? `${daysUntil} hari lagi`
                  : nextBillingDate.toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                    })}
              </Text>
            </View>
          </View>

          {subscription.description && (
            <Text style={styles.notes} numberOfLines={2}>
              {subscription.description}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison untuk optimasi re-render
    return (
      prevProps.subscription.id === nextProps.subscription.id &&
      prevProps.subscription.amount === nextProps.subscription.amount &&
      prevProps.subscription.nextBillingDate === nextProps.subscription.nextBillingDate &&
      prevProps.subscription.icon === nextProps.subscription.icon &&
      prevProps.subscription.color === nextProps.subscription.color &&
      prevProps.subscription.imageUri === nextProps.subscription.imageUri &&
      prevProps.subscription.iconType === nextProps.subscription.iconType
    );
  }
);

SubscriptionItemMemo.displayName = 'SubscriptionItemMemo';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  imageContainer: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  brandImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#3b82f6',
  },
  details: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#6b7280',
  },
  upcomingText: {
    color: '#f59e0b',
    fontWeight: '500',
  },
  overdueText: {
    color: '#ef4444',
    fontWeight: '500',
  },
  notes: {
    fontSize: 12,
    color: '#9ca3af',
    lineHeight: 16,
  },
  actions: {
    paddingLeft: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  deleteButton: {
    borderColor: '#fee2e2',
    backgroundColor: '#fef2f2',
  },
});
