import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CustomAlert } from '@/components/ui/custom-alert';
import {
  storage,
  type Subscription,
  type SubscriptionStats,
} from '@/lib/storage/storage-adapter';
import { SubscriptionStatsComponent } from '@/components/subscriptions/subscription-stats';
import { SubscriptionItemMemo } from '@/components/subscriptions/subscription-item-memo';
import { AddSubscriptionModal } from '@/components/subscriptions/add-subscription-modal';
import { eventEmitter, EVENTS } from '@/lib/utils/events';
import { sendLocalNotification } from '@/lib/utils/notifications';

export default function SubscriptionsScreen() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    buttons?: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>;
  }>({
    title: '',
    message: '',
    type: 'info',
    buttons: [{ text: 'OK', style: 'default' }],
  });

  const showAlert = (config: typeof alertConfig) => {
    setAlertConfig(config);
    setAlertVisible(true);
  };

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [subsData, statsData] = await Promise.all([
        storage.getSubscriptions(),
        storage.getSubscriptionStats(),
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


  const handleDelete = useCallback(async (id: string) => {
    try {
      await storage.deleteSubscription(id);
      loadData(true);
    } catch (error) {
      console.error('Error deleting subscription:', error);
    }
  }, [loadData]);

  const handleEdit = useCallback((subscription: Subscription) => {
    setEditingSubscription(subscription);
    setIsModalOpen(true);
  }, []);

  const handleAddNew = useCallback(() => {
    setEditingSubscription(null);
    setIsModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setEditingSubscription(null);
  }, []);

  const handleSuccess = useCallback(() => {
    loadData(true);
  }, [loadData]);

  const handleTestNotification = useCallback(async () => {
    // Get subscriptions that will renew in the next 7 days
    const today = new Date();
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const upcomingSubscriptions = subscriptions.filter((sub) => {
      const nextBilling = new Date(sub.nextBillingDate);
      return nextBilling >= today && nextBilling <= sevenDaysFromNow;
    });

    if (upcomingSubscriptions.length === 0) {
      showAlert({
        title: 'Tidak Ada Pengingat',
        message: 'Tidak ada langganan yang akan jatuh tempo dalam 7 hari ke depan.',
        type: 'info',
      });
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
        `Pengingat: ${sub.name}`,
        `Jatuh tempo ${formattedDate} (${daysUntil} hari lagi) - ${formattedAmount}`,
        { subscriptionId: sub.id }
      );
    }
  }, [subscriptions]);

  // Render item dengan useCallback untuk optimasi FlatList
  const renderItem = useCallback(({ item }: { item: Subscription }) => (
    <SubscriptionItemMemo
      subscription={item}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  ), [handleEdit, handleDelete]);

  const keyExtractor = useCallback((item: Subscription) => item.id, []);

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
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Langganan</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={subscriptions}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={
          <>
            {/* Stats */}
            {stats && (
              <View style={styles.statsContainer}>
                <SubscriptionStatsComponent stats={stats} />
              </View>
            )}

            {/* Section Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Daftar Langganan</Text>
              <TouchableOpacity style={styles.testButton} onPress={handleTestNotification}>
                <Ionicons name="notifications-outline" size={14} color="#3b82f6" />
                <Text style={styles.testButtonText}>Cek Notif</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
            </View>
            <Text style={styles.emptyTitle}>Belum ada langganan</Text>
            <Text style={styles.emptyText}>
              Klik tombol + untuk menambahkan langganan pertama Anda
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />
        }
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={8}
      />

      {/* Add/Edit Modal */}
      <AddSubscriptionModal
        visible={isModalOpen}
        onClose={handleModalClose}
        subscription={editingSubscription}
        onSuccess={handleSuccess}
      />

      {/* Custom Alert */}
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setAlertVisible(false)}
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
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    zIndex: 10,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  statsContainer: {
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
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
  emptyCard: {
    backgroundColor: '#fff',
    margin: 16,
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
