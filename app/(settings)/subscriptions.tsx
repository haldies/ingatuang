import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Header } from '@/components/ui/header';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { CustomAlert } from '@/components/ui/custom-alert';
import { storage, type Subscription, type SubscriptionStats } from '@/lib/storage/storage-adapter';
import { SubscriptionStatsComponent } from '@/components/subscriptions/subscription-stats';
import { SubscriptionItemMemo } from '@/components/subscriptions/subscription-item-memo';
import { AddSubscriptionModal } from '@/components/subscriptions/add-subscription-modal';
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
    buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>;
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
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

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
  }, [loadData]);

  const handleDelete = async (id: string) => {
    try {
      await storage.deleteSubscription(id);
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

  const handleTestNotification = async () => {
    await sendLocalNotification('Cek Notif', 'Test langganan berhasil!');
    showAlert({ title: 'Sukses', message: 'Notifikasi terkirim!', type: 'success' });
  };

  if (loading && !refreshing) {
    return (
      <ScreenWrapper>
        <Header title="Langganan" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper backgroundColor="#f9fafb">
      <Header 
        title="Langganan" 
        rightAction={
          <TouchableOpacity onPress={handleAddNew} style={styles.addButtonMini}>
            <Ionicons name="add" size={28} color="#3b82f6" />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={subscriptions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SubscriptionItemMemo subscription={item} onEdit={() => handleEdit(item)} onDelete={() => handleDelete(item.id)} />
        )}
        ListHeaderComponent={
          <>
            {stats && <View style={styles.statsContainer}><SubscriptionStatsComponent stats={stats} /></View>}
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="calendar" size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>Belum ada langganan. Tambahkan sekarang!</Text>
          </View>
        }
      />

      <AddSubscriptionModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        subscription={editingSubscription}
        onSuccess={() => loadData(true)}
      />

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setAlertVisible(false)}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  addButtonMini: { padding: 4 },
  statsContainer: { padding: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  testButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#eff6ff', borderRadius: 8 },
  testButtonText: { fontSize: 12, fontWeight: '600', color: '#3b82f6' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, color: '#64748b', fontSize: 14 },
});
