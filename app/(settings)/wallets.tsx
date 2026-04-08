import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  LayoutAnimation,
  useColorScheme as useNativeColorScheme,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Header } from '@/components/ui/header';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { storage, type Wallet, type WalletStats } from '@/lib/storage/storage-adapter';
import { CustomAlert } from '@/components/ui/custom-alert';
import { AddWalletModal } from '@/components/wallets/add-wallet-modal';
import { WalletItem } from '@/components/wallets/wallet-item';
import { WalletStats as WalletStatsComponent } from '@/components/wallets/wallet-stats';
import { useTranslation } from 'react-i18next';
import { Colors, getRadius } from '@/constants/theme';

export default function WalletsScreen() {
  const { t } = useTranslation();
  const colorScheme = useNativeColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
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

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [walletsData, statsData] = await Promise.all([
        storage.getWallets(),
        storage.getWalletStats(),
      ]);

      setWallets(walletsData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading wallets:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await storage.deleteWallet(id);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      loadData(true);
    } catch (error) {
      console.error('Error deleting wallet:', error);
    }
  };

  const handleEdit = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingWallet(null);
    setIsModalOpen(true);
  };

  if (loading && !refreshing) {
    return (
      <ScreenWrapper backgroundColor={theme.background}>
        <Header title={t('wallets.header')} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.tint} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper backgroundColor={theme.background}>
      <Header 
        title={t('wallets.header')} 
        rightAction={
          <TouchableOpacity onPress={handleAddNew} style={styles.addButtonMini}>
            <Ionicons name="add" size={28} color={theme.tint} />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={wallets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <WalletItem wallet={item} onEdit={() => handleEdit(item)} onDelete={() => handleDelete(item.id)} />
        )}
        ListHeaderComponent={stats ? <WalletStatsComponent stats={stats} /> : null}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor={theme.tint} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="credit-card" size={48} color={isDark ? '#262626' : '#cbd5e1'} />
            <Text style={[styles.emptyText, { color: isDark ? '#404040' : '#64748b' }]}>Belum ada dompet. Tambahkan sekarang!</Text>
          </View>
        }
      />

      <AddWalletModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        wallet={editingWallet}
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
  listContent: { padding: 20, paddingBottom: 100 },
  addButtonMini: { padding: 4 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 14, fontWeight: '600' },
});
