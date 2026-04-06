import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { storage, type Wallet } from '@/lib/storage/storage-adapter';
import { CustomAlert } from '@/components/ui/custom-alert';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/lib/utils/format';
import { Colors } from '@/constants/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const WALLET_ICONS = [
  'wallet', 'card', 'cash', 'business', 'home', 'car', 'gift', 'heart', 
  'airplane', 'briefcase', 'book', 'cart', 'cafe', 'game-controller'
];

const WALLET_COLORS = [
  '#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', 
  '#06b6d4', '#14b8a6', '#6366f1', '#4b5563'
];

interface WalletWithBalance extends Wallet {
  balance: number;
}

export default function WalletsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [wallets, setWallets] = useState<WalletWithBalance[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('default');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  
  // Alert state
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
  });

  const [formData, setFormData] = useState({
    name: '',
    icon: 'wallet',
    color: '#3b82f6',
  });

  const loadWallets = useCallback(async () => {
    try {
      setLoading(true);
      const [walletData, balances, activeId] = await Promise.all([
        storage.getWallets(),
        storage.getWalletBalances(),
        storage.getSelectedWalletId()
      ]);
      
      const combined = (walletData as Wallet[]).map(w => ({
        ...w,
        balance: balances[w.id] || 0
      }));
      
      setWallets(combined as WalletWithBalance[]);
      setSelectedWalletId(activeId);
    } catch (error) {
      console.error('Error loading wallets:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWallets();
  }, [loadWallets]);

  const handleSelectWallet = async (id: string) => {
    if (selectedWalletId === id) return;
    try {
      await storage.setSelectedWalletId(id);
      setSelectedWalletId(id);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    } catch (error) {
       console.error(error);
    }
  };

  const handleAddWallet = () => {
    setEditingWallet(null);
    setFormData({ name: '', icon: 'wallet', color: '#3b82f6' });
    setIsModalOpen(true);
  };

  const handleEditWallet = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setFormData({ name: wallet.name, icon: wallet.icon, color: wallet.color });
    setIsModalOpen(true);
  };

  const handleDeleteWallet = (wallet: Wallet) => {
    if (wallet.id === 'default') {
      showAlert({
        title: t('common.failed'),
        message: t('wallets.delete_error_main'),
        type: 'error'
      });
      return;
    }

    showAlert({
      title: t('wallets.delete_confirm_title'),
      message: t('wallets.delete_confirm_msg', { name: wallet.name }),
      type: 'warning',
      buttons: [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await storage.deleteWallet(wallet.id);
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              loadWallets();
            } catch (error) {
              console.error(error);
            }
          }
        }
      ]
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      return;
    }

    try {
      if (editingWallet) {
        await storage.updateWallet(editingWallet.id, {
          name: formData.name.trim(),
          icon: formData.icon,
          color: formData.color,
        });
      } else {
        await storage.addWallet({
          id: Date.now().toString(),
          name: formData.name.trim(),
          icon: formData.icon,
          color: formData.color,
          createdAt: new Date().toISOString(),
        });
      }
      setIsModalOpen(false);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      loadWallets();
    } catch (error) {
      console.error(error);
    }
  };

  const showAlert = (config: typeof alertConfig) => {
    setAlertConfig(config);
    setAlertVisible(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-slate-100">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text className="text-lg font-extrabold text-slate-800">{t('wallets.header')}</Text>
        <TouchableOpacity onPress={handleAddWallet} className="p-1">
          <Ionicons name="add" size={26} color={Colors.light.tint} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        <View className="mb-5">
          <Text className="text-[13px] text-slate-500 leading-5 font-medium">
            {t('wallets.subtitle')}
          </Text>
        </View>

        <View className="flex-row flex-wrap justify-between">
          {wallets.map((wallet) => {
            const isActive = selectedWalletId === wallet.id;
            return (
              <TouchableOpacity 
                key={wallet.id} 
                onPress={() => handleSelectWallet(wallet.id)}
                activeOpacity={0.9}
                style={{ width: CARD_WIDTH, backgroundColor: isActive ? wallet.color : 'white' }}
                className="rounded-[28px] p-5 mb-4 border-[1.5px] border-slate-100 shadow-sm relative overflow-hidden"
              >
                {isActive && (
                  <View className="absolute -top-5 -right-5 w-24 h-24 rounded-full bg-white/10" />
                )}

                <View className="flex-row justify-between items-center mb-5">
                  <View 
                    style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : `${wallet.color}15` }}
                    className="w-11 h-11 rounded-[15px] justify-center items-center"
                  >
                    <Ionicons 
                      name={wallet.icon as any} 
                      size={22} 
                      color={isActive ? '#fff' : wallet.color} 
                    />
                  </View>
                  
                  {isActive ? (
                     <View className="flex-row items-center bg-white px-2 py-1 rounded-full gap-1">
                        <Ionicons name="shield-checkmark" size={12} color={wallet.color} />
                        <Text style={{ color: wallet.color }} className="text-[8px] font-black tracking-widest">ACTIVE</Text>
                     </View>
                  ) : (
                     <TouchableOpacity onPress={() => handleEditWallet(wallet)} className="p-1">
                        <Ionicons name="ellipsis-horizontal" size={18} color="#94a3b8" />
                     </TouchableOpacity>
                  )}
                </View>

                <View className="gap-1.5">
                  <Text 
                    className={`text-base font-extrabold ${isActive ? 'text-white' : 'text-slate-800'}`} 
                    numberOfLines={1}
                  >
                    {wallet.name}
                  </Text>
                  
                  <View className="mt-2.5">
                     <Text className={`text-[10px] font-bold uppercase mb-0.5 ${isActive ? 'text-white/60' : 'text-slate-400'}`}>
                       {t('common.balance') || 'Saldo'}
                     </Text>
                     <Text 
                       className={`text-base font-black ${isActive ? 'text-white' : 'text-slate-900'}`} 
                       numberOfLines={1}
                     >
                       {formatCurrency(wallet.balance)}
                     </Text>
                  </View>
                </View>

                {!isActive && wallet.id !== 'default' && (
                  <TouchableOpacity 
                    onPress={() => handleDeleteWallet(wallet)} 
                    className="absolute bottom-3 right-3 w-7 h-7 rounded-full bg-red-100/80 items-center justify-center border border-red-200"
                  >
                    <Ionicons name="trash-outline" size={14} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={isModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View className="flex-1 bg-slate-900/40 justify-end">
          <View className="bg-white rounded-t-[32px] max-h-[85%] pb-5">
            <View className="flex-row items-center justify-between px-6 py-5 border-b border-slate-100">
              <Text className="text-xl font-extrabold text-slate-800">
                {editingWallet ? t('wallets.edit_wallet') : t('wallets.add_wallet')}
              </Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)} className="p-1">
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
              <View className="mb-6">
                <Text className="text-sm font-bold text-slate-700 mb-2.5">{t('wallets.wallet_name_label')}</Text>
                <TextInput
                  className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-base text-slate-800 font-semibold"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder={t('wallets.wallet_name_placeholder')}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View className="mb-6">
                <Text className="text-sm font-bold text-slate-700 mb-2.5">{t('wallets.choose_icon_label')}</Text>
                <View className="flex-row flex-wrap gap-2.5">
                  {WALLET_ICONS.map((icon) => (
                    <TouchableOpacity
                      key={icon}
                      className={`w-12 h-12 rounded-xl bg-slate-50 justify-center items-center border ${formData.icon === icon ? 'border-primary bg-primary/5' : 'border-slate-100'}`}
                      onPress={() => setFormData({ ...formData, icon })}
                    >
                      <Ionicons 
                        name={icon as any} 
                        size={20} 
                        color={formData.icon === icon ? Colors.light.tint : '#64748b'} 
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View className="mb-6">
                <Text className="text-sm font-bold text-slate-700 mb-2.5">{t('wallets.choose_color_label')}</Text>
                <View className="flex-row flex-wrap gap-2.5">
                  {WALLET_COLORS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={{ backgroundColor: color }}
                      className={`w-9 h-9 rounded-full justify-center items-center ${formData.color === color ? 'border-[3px] border-white' : ''}`}
                      onPress={() => setFormData({ ...formData, color })}
                    >
                      {formData.color === color && (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View className="px-6 py-4">
              <TouchableOpacity
                className="bg-primary py-4 rounded-2xl items-center"
                onPress={handleSave}
              >
                <Text className="text-base font-extrabold text-white">{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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

