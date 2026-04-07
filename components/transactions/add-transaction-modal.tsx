import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Pressable,
  Animated,
  Easing,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import {
  storage,
  type Transaction,
  type Category,
  type Wallet,
} from '@/lib/storage/storage-adapter';

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
  onSuccess?: () => void;
}

export function AddTransactionModal({
  visible,
  onClose,
  transaction,
  onSuccess,
}: AddTransactionModalProps) {
  // useSafeAreaInsets diganti SafeAreaView untuk handling yang lebih robust
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showWalletPicker, setShowWalletPicker] = useState(false);
  const slideAnim = useRef(new Animated.Value(1)).current;
  const [formData, setFormData] = useState({
    type: 'EXPENSE' as 'EXPENSE' | 'INCOME',
    categoryId: '',
    walletId: 'default',
    amount: '',
    date: new Date(),
    notes: '',
  });

  // Load categories
  useEffect(() => {
    const loadData = async () => {
      const [cats, walls, selectedId] = await Promise.all([
        storage.getCategories(),
        storage.getWallets(),
        storage.getSelectedWalletId()
      ]);
      setCategories(cats);
      setWallets(walls);
      
      if (!transaction) {
        setFormData(prev => ({ ...prev, walletId: selectedId }));
      }
    };
    if (visible) {
      loadData();
      // Reset and animate in
      slideAnim.setValue(1);
      
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1), // iOS-like easing curve
      }).start();
    } else {
      // Animate out
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }).start();
    }
  }, [visible]);

  // Load transaction data when editing
  useEffect(() => {
    if (transaction && visible) {
      setFormData({
        type: transaction.type,
        categoryId: transaction.categoryId,
        walletId: transaction.walletId || 'default',
        amount: transaction.amount.toString(),
        date: new Date(transaction.date),
        notes: transaction.notes || '',
      });
    } else if (!transaction && visible) {
      // Reset form (wallet handles separately in loadData)
      setFormData({
        type: 'EXPENSE',
        categoryId: '',
        walletId: 'default',
        amount: '',
        date: new Date(),
        notes: '',
      });
    }
  }, [transaction, visible]);

  const handleSubmit = async () => {
    if (!formData.categoryId || !formData.amount) {
      alert('Mohon isi semua field yang diperlukan');
      return;
    }

    setLoading(true);

    try {
      if (transaction) {
        // Update
        await storage.updateTransaction(transaction.id, {
          type: formData.type,
          categoryId: formData.categoryId,
          walletId: formData.walletId,
          amount: parseFloat(formData.amount),
          date: formData.date.toISOString(),
          notes: formData.notes || undefined,
        });
      } else {
        // Create
        await storage.addTransaction({
          type: formData.type,
          categoryId: formData.categoryId,
          walletId: formData.walletId,
          amount: parseFloat(formData.amount),
          date: formData.date.toISOString(),
          notes: formData.notes || undefined,
        });
      }

      setFormData({
        type: 'EXPENSE',
        categoryId: '',
        walletId: 'default',
        amount: '',
        date: new Date(),
        notes: '',
      });

      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Gagal menyimpan transaksi');
    } finally {
      setLoading(false);
    }
  };

  // Filter categories by type
  const filteredCategories = categories.filter(cat => cat.type === formData.type);

  // Get selected category
  const selectedCategory = categories.find(cat => cat.id === formData.categoryId);

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric',
      month: 'long', 
      year: 'numeric' 
    });
  };

  const handleDateSelect = (day: any) => {
    const selected = new Date(day.dateString);
    setFormData({ ...formData, date: selected });
    setShowCalendar(false);
  };

  const handleCategorySelect = (categoryId: string) => {
    setFormData({ ...formData, categoryId });
    setShowCategoryPicker(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View 
        style={{
          flex: 1,
          transform: [{
            translateY: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1000],
            }),
          }],
        }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'bottom']}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">
          <TouchableOpacity onPress={onClose} className="p-1 w-10">
            <Ionicons name="close" size={28} color="#6b7280" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">
            {transaction ? 'Edit Transaksi' : 'Tambah Transaksi'}
          </Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
          {/* Type */}
          <View className="mb-5">
            <View className="flex-row gap-3">
              <TouchableOpacity
                className={`flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-xl ${
                  formData.type === 'INCOME' ? 'bg-green-500' : 'bg-gray-100'
                }`}
                onPress={() => setFormData({ ...formData, type: 'INCOME', categoryId: '' })}
              >
                <Ionicons 
                  name="arrow-down-circle" 
                  size={20} 
                  color={formData.type === 'INCOME' ? '#fff' : '#6b7280'} 
                />
                <Text className={`text-[15px] font-semibold ${
                  formData.type === 'INCOME' ? 'text-white' : 'text-gray-500'
                }`}>
                  Pemasukan
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 flex-row items-center justify-center gap-2 py-3.5 rounded-xl ${
                  formData.type === 'EXPENSE' ? 'bg-red-500' : 'bg-gray-100'
                }`}
                onPress={() => setFormData({ ...formData, type: 'EXPENSE', categoryId: '' })}
              >
                <Ionicons 
                  name="arrow-up-circle" 
                  size={20} 
                  color={formData.type === 'EXPENSE' ? '#fff' : '#6b7280'} 
                />
                <Text className={`text-[15px] font-semibold ${
                  formData.type === 'EXPENSE' ? 'text-white' : 'text-gray-500'
                }`}>
                  Pengeluaran
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="mb-5 flex-row gap-3">
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-900 mb-2.5">Kategori</Text>
              <TouchableOpacity
                className="flex-row items-center gap-2 border border-gray-200 rounded-xl px-4 py-3 bg-gray-50"
                onPress={() => setShowCategoryPicker(true)}
              >
                {selectedCategory ? (
                  <>
                    <Text className="text-xl">{selectedCategory.icon}</Text>
                    <Text className="flex-1 text-[15px] text-gray-900" numberOfLines={1}>{selectedCategory.name}</Text>
                  </>
                ) : (
                  <Text className="flex-1 text-[15px] text-gray-400">Pilih</Text>
                )}
                <Ionicons name="chevron-down" size={16} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-900 mb-2.5">Dompet</Text>
              <TouchableOpacity
                className="flex-row items-center gap-2 border border-gray-200 rounded-xl px-4 py-3 bg-gray-50"
                onPress={() => setShowWalletPicker(true)}
              >
                {wallets.find(w => w.id === formData.walletId) ? (
                  <>
                    <Ionicons name={wallets.find(w => w.id === formData.walletId)?.icon as any || 'wallet'} size={18} color="#374151" />
                    <Text className="flex-1 text-[15px] text-gray-900" numberOfLines={1}>
                      {wallets.find(w => w.id === formData.walletId)?.name}
                    </Text>
                  </>
                ) : (
                  <Text className="flex-1 text-[15px] text-gray-400">Pilih</Text>
                )}
                <Ionicons name="chevron-down" size={16} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Amount & Date */}
          <View className="flex-row gap-3">
            <View className="flex-1 mb-5">
              <Text className="text-sm font-semibold text-gray-900 mb-2.5">Jumlah</Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-3 text-[15px] text-gray-900 bg-gray-50"
                value={formData.amount}
                onChangeText={(text) => setFormData({ ...formData, amount: text })}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View className="flex-1 mb-5">
              <Text className="text-sm font-semibold text-gray-900 mb-2.5">Tanggal</Text>
              <TouchableOpacity
                className="flex-row items-center gap-2 border border-gray-200 rounded-xl px-4 py-3 bg-gray-50"
                onPress={() => setShowCalendar(true)}
              >
                <Ionicons name="calendar-outline" size={18} color="#6b7280" />
                <Text className="flex-1 text-[15px] text-gray-900">
                  {formatDate(formData.date)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Notes */}
          <View className="mb-5">
            <Text className="text-sm font-semibold text-gray-900 mb-2.5">Catatan</Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3 text-[15px] text-gray-900 bg-gray-50 min-h-[100px] pt-3"
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              placeholder="Tambahkan catatan..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </ScrollView>

        {/* Footer */}
        <View className="flex-row gap-3 px-5 pt-4 pb-5 border-t border-gray-100 bg-white">
          <TouchableOpacity
            className={`flex-1 flex-row items-center justify-center gap-2 py-4 rounded-xl bg-blue-500 ${
              loading ? 'opacity-50' : ''
            }`}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text className="text-base font-semibold text-white">
              {loading ? 'Menyimpan...' : transaction ? 'Perbarui' : 'Simpan'}
            </Text>
          </TouchableOpacity>
        </View>
        </SafeAreaView>

      {/* Calendar Overlay */}
      {showCalendar && (
        <View style={StyleSheet.absoluteFill} className="z-50">
          <Pressable
            className="flex-1 bg-black/50 justify-end"
            onPress={() => setShowCalendar(false)}
          >
            <Pressable className="bg-white rounded-t-[20px] p-5 pb-10" onPress={(e) => e.stopPropagation()}>
              <View className="flex-row items-center justify-between mb-5">
                <Text className="text-xl font-bold text-gray-900">Pilih Tanggal</Text>
                <TouchableOpacity onPress={() => setShowCalendar(false)}>
                  <Ionicons name="close" size={28} color="#6b7280" />
                </TouchableOpacity>
              </View>
              <Calendar
                onDayPress={handleDateSelect}
                markedDates={{
                  [formData.date.toISOString().split('T')[0]]: {
                    selected: true,
                    selectedColor: '#3b82f6',
                  },
                }}
                theme={{
                  todayTextColor: '#3b82f6',
                  selectedDayBackgroundColor: '#3b82f6',
                  selectedDayTextColor: '#ffffff',
                  arrowColor: '#3b82f6',
                  textDayFontSize: 16,
                  textMonthFontSize: 18,
                  textDayHeaderFontSize: 14,
                  textMonthFontWeight: '600',
                }}
              />
            </Pressable>
          </Pressable>
        </View>
      )}

      {/* Wallet Picker Overlay */}
      {showWalletPicker && (
        <View style={StyleSheet.absoluteFill} className="z-50">
          <Pressable
            className="flex-1 bg-black/50 justify-end"
            onPress={() => setShowWalletPicker(false)}
          >
            <Pressable className="bg-white rounded-t-[20px] max-h-[70%]" onPress={(e) => e.stopPropagation()}>
              <View className="flex-row items-center justify-between px-5 py-5 border-b border-gray-100">
                <Text className="text-xl font-bold text-gray-900">Pilih Dompet</Text>
                <TouchableOpacity onPress={() => setShowWalletPicker(false)}>
                  <Ionicons name="close" size={28} color="#6b7280" />
                </TouchableOpacity>
              </View>
              <ScrollView 
                className="px-5 py-3"
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
              >
                {wallets.map((wallet) => (
                  <TouchableOpacity
                    key={wallet.id}
                    className={`flex-row items-center justify-between py-4 px-4 rounded-xl mb-2 ${
                      formData.walletId === wallet.id 
                        ? 'bg-blue-50 border border-blue-500' 
                        : 'bg-gray-50'
                    }`}
                    onPress={() => {
                      setFormData({ ...formData, walletId: wallet.id });
                      setShowWalletPicker(false);
                    }}
                  >
                    <View className="flex-row items-center gap-3 flex-1">
                      <View 
                        className="w-10 h-10 rounded-full items-center justify-center bg-gray-200"
                      >
                        <Ionicons name={wallet.icon as any} size={20} color={wallet.color} />
                      </View>
                      <Text className="text-base font-medium text-gray-900">{wallet.name}</Text>
                    </View>
                    {formData.walletId === wallet.id && (
                      <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Pressable>
          </Pressable>
        </View>
      )}

      {/* Category Picker Overlay */}
      {showCategoryPicker && (
        <View style={StyleSheet.absoluteFill} className="z-50">
          <Pressable
            className="flex-1 bg-black/50 justify-end"
            onPress={() => setShowCategoryPicker(false)}
          >
            <Pressable className="bg-white rounded-t-[20px] max-h-[70%]" onPress={(e) => e.stopPropagation()}>
              <View className="flex-row items-center justify-between px-5 py-5 border-b border-gray-100">
                <Text className="text-xl font-bold text-gray-900">Pilih Kategori</Text>
                <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                  <Ionicons name="close" size={28} color="#6b7280" />
                </TouchableOpacity>
              </View>
              <ScrollView 
                className="px-5 py-3"
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
              >
                {filteredCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    className={`flex-row items-center justify-between py-4 px-4 rounded-xl mb-2 ${
                      formData.categoryId === cat.id 
                        ? 'bg-blue-50 border border-blue-500' 
                        : 'bg-gray-50'
                    }`}
                    onPress={() => handleCategorySelect(cat.id)}
                  >
                    <View className="flex-row items-center gap-3 flex-1">
                      <View 
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: cat.color + '20' }}
                      >
                        <Text className="text-xl">{cat.icon}</Text>
                      </View>
                      <Text className="text-base font-medium text-gray-900">{cat.name}</Text>
                    </View>
                    {formData.categoryId === cat.id && (
                      <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Pressable>
          </Pressable>
        </View>
      )}
      </Animated.View>
    </Modal>
  );
}
