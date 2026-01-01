import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { addSubscription, updateSubscription, type Subscription } from '@/lib/storage';
import { eventEmitter, EVENTS } from '@/lib/events';

interface AddSubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  subscription?: Subscription | null;
  onSuccess?: () => void;
}

export function AddSubscriptionModal({
  visible,
  onClose,
  subscription,
  onSuccess,
}: AddSubscriptionModalProps) {
  const [loading, setLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showBillingCyclePicker, setShowBillingCyclePicker] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    billingCycle: 'MONTHLY' as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
    startDate: new Date(),
    description: '',
  });

  useEffect(() => {
    if (subscription && visible) {
      setFormData({
        name: subscription.name,
        amount: subscription.amount.toString(),
        billingCycle: subscription.billingCycle,
        startDate: new Date(subscription.startDate),
        description: subscription.description || '',
      });
    } else if (!subscription && visible) {
      setFormData({
        name: '',
        amount: '',
        billingCycle: 'MONTHLY',
        startDate: new Date(),
        description: '',
      });
    }
  }, [subscription, visible]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.amount) {
      alert('Mohon isi nama dan harga');
      return;
    }

    setLoading(true);

    try {
      if (subscription) {
        await updateSubscription(subscription.id, {
          name: formData.name,
          amount: parseFloat(formData.amount),
          billingCycle: formData.billingCycle,
          startDate: formData.startDate.toISOString(),
          description: formData.description || undefined,
        });
      } else {
        await addSubscription({
          name: formData.name,
          amount: parseFloat(formData.amount),
          billingCycle: formData.billingCycle,
          startDate: formData.startDate.toISOString(),
          description: formData.description || undefined,
        });
      }

      setFormData({
        name: '',
        amount: '',
        billingCycle: 'MONTHLY',
        startDate: new Date(),
        description: '',
      });

      // Emit event to refresh transactions if new subscription was added
      if (!subscription) {
        eventEmitter.emit(EVENTS.TRANSACTION_ADDED);
      }

      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving subscription:', error);
      alert('Gagal menyimpan langganan');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric',
      month: 'long', 
      year: 'numeric' 
    });
  };

  const handleDateSelect = (day: any) => {
    const selected = new Date(day.dateString);
    setFormData({ ...formData, startDate: selected });
    setShowCalendar(false);
  };

  const handleBillingCycleSelect = (cycle: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY') => {
    setFormData({ ...formData, billingCycle: cycle });
    setShowBillingCyclePicker(false);
  };

  const billingCycles = [
    { value: 'DAILY', label: 'Harian', icon: 'today-outline' },
    { value: 'WEEKLY', label: 'Mingguan', icon: 'calendar-outline' },
    { value: 'MONTHLY', label: 'Bulanan', icon: 'calendar' },
    { value: 'YEARLY', label: 'Tahunan', icon: 'calendar-sharp' },
  ];

  const selectedBillingCycle = billingCycles.find(c => c.value === formData.billingCycle);

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      transparent={false} 
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">
          <TouchableOpacity onPress={onClose} className="p-1 w-10">
            <Ionicons name="close" size={28} color="#6b7280" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">
            {subscription ? 'Edit Langganan' : 'Tambah Langganan'}
          </Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
          {/* Name */}
          <View className="mb-5">
            <Text className="text-sm font-semibold text-gray-900 mb-2.5">Nama Langganan</Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3 text-[15px] text-gray-900 bg-gray-50"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Netflix, Spotify, dll"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Amount */}
          <View className="mb-5">
            <Text className="text-sm font-semibold text-gray-900 mb-2.5">Harga</Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3 text-[15px] text-gray-900 bg-gray-50"
              value={formData.amount}
              onChangeText={(text) => setFormData({ ...formData, amount: text })}
              placeholder="50000"
              keyboardType="numeric"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Billing Cycle & Start Date */}
          <View className="flex-row gap-3">
            <View className="flex-1 mb-5">
              <Text className="text-sm font-semibold text-gray-900 mb-2.5">Siklus</Text>
              <TouchableOpacity
                className="flex-row items-center gap-2 border border-gray-200 rounded-xl px-4 py-3 bg-gray-50"
                onPress={() => setShowBillingCyclePicker(true)}
              >
                <Ionicons name={selectedBillingCycle?.icon as any} size={18} color="#6b7280" />
                <Text className="flex-1 text-[15px] text-gray-900">
                  {selectedBillingCycle?.label}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View className="flex-1 mb-5">
              <Text className="text-sm font-semibold text-gray-900 mb-2.5">Tanggal Mulai</Text>
              <TouchableOpacity
                className="flex-row items-center gap-2 border border-gray-200 rounded-xl px-4 py-3 bg-gray-50"
                onPress={() => setShowCalendar(true)}
              >
                <Ionicons name="calendar-outline" size={18} color="#6b7280" />
                <Text className="flex-1 text-[15px] text-gray-900">
                  {formatDate(formData.startDate)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          <View className="mb-5">
            <Text className="text-sm font-semibold text-gray-900 mb-2.5">Deskripsi</Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3 text-[15px] text-gray-900 bg-gray-50 min-h-[100px] pt-3"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Catatan tambahan..."
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
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text className="text-base font-semibold text-white">
              {loading ? 'Menyimpan...' : subscription ? 'Perbarui' : 'Simpan'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Calendar Modal */}
      <Modal
        visible={showCalendar}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCalendar(false)}
      >
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
                [formData.startDate.toISOString().split('T')[0]]: {
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
      </Modal>

      {/* Billing Cycle Picker Modal */}
      <Modal
        visible={showBillingCyclePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBillingCyclePicker(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowBillingCyclePicker(false)}
        >
          <Pressable className="bg-white rounded-t-[20px]" onPress={(e) => e.stopPropagation()}>
            <View className="flex-row items-center justify-between px-5 py-5 border-b border-gray-100">
              <Text className="text-xl font-bold text-gray-900">Pilih Siklus Pembayaran</Text>
              <TouchableOpacity onPress={() => setShowBillingCyclePicker(false)}>
                <Ionicons name="close" size={28} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <ScrollView 
              className="px-5 py-3"
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            >
              {billingCycles.map((cycle) => (
                <TouchableOpacity
                  key={cycle.value}
                  className={`flex-row items-center justify-between py-4 px-4 rounded-xl mb-2 ${
                    formData.billingCycle === cycle.value 
                      ? 'bg-blue-50 border border-blue-500' 
                      : 'bg-gray-50'
                  }`}
                  onPress={() => handleBillingCycleSelect(cycle.value as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY')}
                >
                  <View className="flex-row items-center gap-3 flex-1">
                    <View className="w-10 h-10 rounded-full items-center justify-center bg-blue-100">
                      <Ionicons name={cycle.icon as any} size={20} color="#3b82f6" />
                    </View>
                    <Text className="text-base font-medium text-gray-900">{cycle.label}</Text>
                  </View>
                  {formData.billingCycle === cycle.value && (
                    <Ionicons name="checkmark-circle" size={24} color="#3b82f6" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </Modal>
  );
}
