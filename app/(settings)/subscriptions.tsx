import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  TouchableOpacity,
  useColorScheme as useNativeColorScheme,
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
import { Colors, getRadius } from '@/constants/theme';

export default function SubscriptionsScreen() {
  const colorScheme = useNativeColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

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
      <ScreenWrapper backgroundColor={theme.background}>
        <Header title="Langganan" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.tint} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper backgroundColor={theme.background}>
      <Header 
        title="Langganan" 
        rightAction={
          <TouchableOpacity onPress={handleAddNew} style={styles.addButtonMini}>
            <Ionicons name="add" size={28} color={theme.tint} />
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
              <Text style={[styles.sectionTitle, { color: isDark ? '#94A3B8' : '#6b7280' }]}>Daftar Langganan</Text>
              <TouchableOpacity style={[styles.testButton, { backgroundColor: theme.tint + '15', borderRadius: getRadius(80, 'small') }]} onPress={handleTestNotification}>
                <Ionicons name="notifications-outline" size={14} color={theme.tint} />
                <Text style={[styles.testButtonText, { color: theme.tint }]}>Cek Notif</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor={theme.tint} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="calendar" size={48} color={isDark ? '#262626' : '#cbd5e1'} />
            <Text style={[styles.emptyText, { color: isDark ? '#404040' : '#64748b' }]}>Belum ada langganan. Tambahkan sekarang!</Text>
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
  sectionTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  testButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6 },
  testButtonText: { fontSize: 12, fontWeight: '800' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 14, fontWeight: '600' },
});
