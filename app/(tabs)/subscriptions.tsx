import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  getSubscriptions,
  getSubscriptionStats,
  updateSubscription,
  deleteSubscription,
  type Subscription,
  type SubscriptionStats,
} from '@/lib/storage';
import { SubscriptionStatsComponent } from '@/components/subscriptions/subscription-stats';
import { SubscriptionItem } from '@/components/subscriptions/subscription-item';
import { AddSubscriptionModal } from '@/components/subscriptions/add-subscription-modal';
import { eventEmitter, EVENTS } from '@/lib/events';
import { sendLocalNotification } from '@/lib/notifications';

export default function SubscriptionsScreen() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [subsData, statsData] = await Promise.all([
        getSubscriptions(),
        getSubscriptionStats(),
      ]);

      setSubscriptions(subsData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading subscriptions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const handleSubscriptionEvent = () => {
      loadData(true);
    };

    eventEmitter.on(EVENTS.SUBSCRIPTION_ADDED, handleSubscriptionEvent);
    eventEmitter.on(EVENTS.SUBSCRIPTION_UPDATED, handleSubscriptionEvent);

    return () => {
      eventEmitter.off(EVENTS.SUBSCRIPTION_ADDED, handleSubscriptionEvent);
      eventEmitter.off(EVENTS.SUBSCRIPTION_UPDATED, handleSubscriptionEvent);
    };
  }, [loadData]);

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateSubscription(id, { isActive: !isActive });
      loadData(true);
    } catch (error) {
      console.error('Error toggling subscription:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSubscription(id);
      loadData(true);
    } catch (error) {
      console.error('Error deleting subscription:', error);
    }
  };

  const handleEdit = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingSubscription(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingSubscription(null);
  };

  const handleSuccess = () => {
    loadData(true);
  };

  const handleTestNotification = async () => {
    // Get subscriptions that will renew in the next 7 days
    const today = new Date();
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const upcomingSubscriptions = subscriptions.filter((sub) => {
      if (!sub.isActive) return false;
      
      const nextBilling = new Date(sub.nextBillingDate);
      return nextBilling >= today && nextBilling <= sevenDaysFromNow;
    });

    if (upcomingSubscriptions.length === 0) {
      Alert.alert(
        'Tidak Ada Pengingat',
        'Tidak ada langganan yang akan jatuh tempo dalam 7 hari ke depan.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Send notification for each upcoming subscription
    for (const sub of upcomingSubscriptions) {
      const nextBilling = new Date(sub.nextBillingDate);
      const daysUntil = Math.ceil((nextBilling.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const formattedDate = nextBilling.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const formattedAmount = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(sub.amount);

      await sendLocalNotification(
        `🔔 Pengingat: ${sub.name}`,
        `Jatuh tempo ${formattedDate} (${daysUntil} hari lagi) - ${formattedAmount}`,
        { subscriptionId: sub.id }
      );
    }

  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Langganan</Text>
            <Text style={styles.headerSubtitle}>Kelola semua langganan Anda</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        {stats && (
          <View style={styles.statsContainer}>
            <SubscriptionStatsComponent stats={stats} />
          </View>
        )}

        {/* Subscription List */}
        <View style={styles.listContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daftar Langganan</Text>
            <TouchableOpacity style={styles.testButton} onPress={handleTestNotification}>
              <Ionicons name="notifications-outline" size={16} color="#3b82f6" />
              <Text style={styles.testButtonText}>Test Notif 7 Hari</Text>
            </TouchableOpacity>
          </View>
          {subscriptions.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
              </View>
              <Text style={styles.emptyTitle}>Belum ada langganan</Text>
              <Text style={styles.emptyText}>
                Klik tombol + untuk menambahkan langganan pertama Anda
              </Text>
            </View>
          ) : (
            <View style={styles.listCard}>
              {subscriptions.map((sub) => (
                <SubscriptionItem
                  key={sub.id}
                  subscription={sub}
                  onEdit={handleEdit}
                  onToggleActive={handleToggleActive}
                  onDelete={handleDelete}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add/Edit Modal */}
      <AddSubscriptionModal
        visible={isModalOpen}
        onClose={handleModalClose}
        subscription={editingSubscription}
        onSuccess={handleSuccess}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  statsContainer: {
    padding: 16,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  testButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  listCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 48,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
