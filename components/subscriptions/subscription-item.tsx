import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '@/lib/format';
import type { Subscription } from '@/lib/storage';

interface SubscriptionItemProps {
  subscription: Subscription;
  onEdit: (subscription: Subscription) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
}

export function SubscriptionItem({
  subscription,
  onEdit,
  onToggleActive,
  onDelete,
}: SubscriptionItemProps) {
  const getBillingCycleText = (cycle: string) => {
    const map: Record<string, string> = {
      DAILY: 'Harian',
      WEEKLY: 'Mingguan',
      MONTHLY: 'Bulanan',
      YEARLY: 'Tahunan',
    };
    return map[cycle] || cycle;
  };

  const getDaysUntilRenewal = (nextBillingDate: string) => {
    const today = new Date();
    const next = new Date(nextBillingDate);
    const diff = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const daysUntil = getDaysUntilRenewal(subscription.nextBillingDate);
  const isUpcoming = daysUntil <= 7 && daysUntil >= 0;

  const handleMorePress = () => {
    Alert.alert(
      subscription.name,
      'Pilih aksi',
      [
        {
          text: 'Edit',
          onPress: () => onEdit(subscription),
        },
        {
          text: subscription.isActive ? 'Nonaktifkan' : 'Aktifkan',
          onPress: () => onToggleActive(subscription.id, subscription.isActive),
        },
        {
          text: 'Hapus',
          onPress: () => {
            Alert.alert(
              'Hapus Langganan',
              'Yakin ingin menghapus langganan ini?',
              [
                { text: 'Batal', style: 'cancel' },
                {
                  text: 'Hapus',
                  style: 'destructive',
                  onPress: () => onDelete(subscription.id),
                },
              ]
            );
          },
          style: 'destructive',
        },
        {
          text: 'Batal',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{subscription.name}</Text>
          {isUpcoming && subscription.isActive && (
            <Text style={styles.upcomingBadge}>
              {daysUntil === 0 ? 'Hari ini' : `${daysUntil} hari lagi`}
            </Text>
          )}
        </View>

        {subscription.description && (
          <Text style={styles.description} numberOfLines={1}>
            {subscription.description}
          </Text>
        )}

        <View style={styles.details}>
          <Text style={styles.amount}>{formatCurrency(subscription.amount)}</Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.cycle}>{getBillingCycleText(subscription.billingCycle)}</Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.date}>{formatDate(subscription.nextBillingDate)}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        {!subscription.isActive && (
          <Text style={styles.inactiveLabel}>Nonaktif</Text>
        )}
        <TouchableOpacity onPress={handleMorePress} style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  upcomingBadge: {
    fontSize: 12,
    fontWeight: '500',
    color: '#f59e0b',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  separator: {
    fontSize: 14,
    color: '#9ca3af',
  },
  cycle: {
    fontSize: 14,
    color: '#6b7280',
  },
  date: {
    fontSize: 12,
    color: '#9ca3af',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inactiveLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  moreButton: {
    padding: 4,
  },
});
