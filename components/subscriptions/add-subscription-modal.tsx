import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  useColorScheme as useNativeColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { storage, type Subscription } from '@/lib/storage/storage-adapter';
import { eventEmitter, EVENTS } from '@/lib/utils/events';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Colors, getRadius } from '@/constants/theme';

interface AddSubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  subscription?: Subscription | null;
  onSuccess?: () => void;
}

const PRESET_BRANDS = [
  { name: 'Netflix', icon: 'tv', color: '#E50914', defaultPrice: '186000' },
  { name: 'Spotify', icon: 'musical-notes', color: '#1DB954', defaultPrice: '54990' },
  { name: 'YouTube', icon: 'logo-youtube', color: '#FF0000', defaultPrice: '59000' },
  { name: 'Apple Music', icon: 'logo-apple', color: '#000000', defaultPrice: '55000' },
  { name: 'Disney+', icon: 'videocam', color: '#113CCF', defaultPrice: '39000' },
  { name: 'iCloud', icon: 'cloud', color: '#007AFF', defaultPrice: '15000' },
  { name: 'Shopee VIP', icon: 'cart', color: '#EE4D2D', defaultPrice: '10000' },
  { name: 'Tokopedia', icon: 'basket', color: '#42B549', defaultPrice: '10000' },
  { name: 'Google One', icon: 'logo-google', color: '#4285F4', defaultPrice: '26900' },
  { name: 'Prime Video', icon: 'play-circle', color: '#00A8E1', defaultPrice: '59000' },
];

export function AddSubscriptionModal({
  visible,
  onClose,
  subscription,
  onSuccess,
}: AddSubscriptionModalProps) {
  const colorScheme = useNativeColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [loading, setLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showBillingCyclePicker, setShowBillingCyclePicker] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    billingCycle: 'MONTHLY' as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
    startDate: new Date(),
    description: '',
    icon: 'calendar-outline',
    color: theme.tint,
    imageUri: '',
    iconType: 'icon' as 'icon' | 'image',
  });

  useEffect(() => {
    if (subscription && visible) {
      setFormData({
        name: subscription.name,
        amount: subscription.amount.toString(),
        billingCycle: subscription.billingCycle,
        startDate: new Date(subscription.startDate),
        description: subscription.description || '',
        icon: subscription.icon || 'calendar-outline',
        color: subscription.color || theme.tint,
        imageUri: subscription.imageUri || '',
        iconType: subscription.iconType || 'icon',
      });
    } else if (!subscription && visible) {
      setFormData({
        name: '',
        amount: '',
        billingCycle: 'MONTHLY',
        startDate: new Date(),
        description: '',
        icon: 'calendar-outline',
        color: theme.tint,
        imageUri: '',
        iconType: 'icon',
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
        await storage.updateSubscription(subscription.id, {
          name: formData.name,
          amount: parseFloat(formData.amount),
          billingCycle: formData.billingCycle,
          startDate: formData.startDate.toISOString(),
          description: formData.description || undefined,
          icon: formData.icon,
          color: formData.color,
          imageUri: formData.imageUri || undefined,
          iconType: formData.iconType,
        });
      } else {
        await storage.addSubscription({
          name: formData.name,
          amount: parseFloat(formData.amount),
          billingCycle: formData.billingCycle,
          startDate: formData.startDate.toISOString(),
          description: formData.description || undefined,
          icon: formData.icon,
          color: formData.color,
          imageUri: formData.imageUri || undefined,
          iconType: formData.iconType,
        });
      }

      setFormData({
        name: '',
        amount: '',
        billingCycle: 'MONTHLY',
        startDate: new Date(),
        description: '',
        icon: 'calendar-outline',
        color: theme.tint,
        imageUri: '',
        iconType: 'icon',
      });

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

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setFormData({
        ...formData,
        imageUri: result.assets[0].uri,
        iconType: 'image',
        icon: '', 
      });
    }
  };

  const selectedBillingCycle = billingCycles.find(c => c.value === formData.billingCycle);

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      transparent={false} 
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: isDark ? '#262626' : '#f1f5f9' }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={28} color={isDark ? '#94A3B8' : '#6b7280'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {subscription ? 'Edit Langganan' : 'Tambah Langganan'}
          </Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Icon/Image Preview */}
          <View style={styles.previewContainer}>
            <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8}>
              {formData.iconType === 'image' && formData.imageUri ? (
                <View style={[styles.imageWrapper, { borderRadius: getRadius(240, 'large'), borderColor: isDark ? '#262626' : '#fff' }]}>
                  <Image source={{ uri: formData.imageUri }} style={styles.previewImage} />
                </View>
              ) : (
                <View 
                  style={[
                    styles.iconWrapper, 
                    { 
                      backgroundColor: formData.color,
                      borderRadius: getRadius(240, 'large'),
                      borderColor: isDark ? '#262626' : '#fff'
                    }
                  ]}
                >
                  <Ionicons name={formData.icon as any} size={48} color="#fff" />
                </View>
              )}
              <View style={[styles.cameraBadge, { backgroundColor: theme.tint, borderColor: isDark ? '#262626' : '#fff' }]}>
                <Ionicons name="camera" size={18} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.previewHint}>Ketuk untuk ubah gambar</Text>
          </View>

          {/* Brand Grid Selector */}
          {!subscription && (
             <View style={styles.section}>
                <Text style={[styles.label, { color: theme.text }]}>Mulai Cepat dengan Brand</Text>
                <View style={styles.brandGrid}>
                   {PRESET_BRANDS.map((brand) => (
                      <TouchableOpacity
                         key={brand.name}
                         onPress={() => setFormData({
                            ...formData,
                            name: brand.name,
                            icon: brand.icon,
                            color: brand.color,
                            amount: brand.defaultPrice,
                            iconType: 'icon',
                            imageUri: '' 
                         })}
                         style={styles.brandItem}
                      >
                         <View 
                            style={[
                                styles.brandIcon, 
                                { 
                                    backgroundColor: brand.color,
                                    borderRadius: getRadius(120, 'small') 
                                }
                            ]}
                         >
                            <Ionicons name={brand.icon as any} size={24} color="#fff" />
                         </View>
                         <Text style={styles.brandName} numberOfLines={1}>
                            {brand.name}
                         </Text>
                      </TouchableOpacity>
                   ))}
                </View>
             </View>
          )}

          {/* Name */}
          <View style={styles.inputSection}>
            <Text style={[styles.label, { color: theme.text }]}>Nama Langganan</Text>
            <TextInput
              style={[
                styles.input, 
                { 
                  backgroundColor: isDark ? '#1a1a1a' : '#f9fafb',
                  borderColor: isDark ? '#262626' : '#e2e8f0',
                  color: theme.text,
                  borderRadius: getRadius(120, 'small') 
                }
              ]}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Netflix, Spotify, dll"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Amount */}
          <View style={styles.inputSection}>
            <Text style={[styles.label, { color: theme.text }]}>Harga</Text>
            <TextInput
              style={[
                styles.input, 
                { 
                  backgroundColor: isDark ? '#1a1a1a' : '#f9fafb',
                  borderColor: isDark ? '#262626' : '#e2e8f0',
                  color: theme.text,
                  borderRadius: getRadius(120, 'small') 
                }
              ]}
              value={formData.amount}
              onChangeText={(text) => setFormData({ ...formData, amount: text })}
              placeholder="50000"
              keyboardType="numeric"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Billing Cycle & Start Date */}
          <View style={styles.row}>
            <View style={[styles.inputSection, { flex: 1 }]}>
              <Text style={[styles.label, { color: theme.text }]}>Siklus</Text>
              <TouchableOpacity
                style={[
                  styles.pickerBtn, 
                  { 
                    backgroundColor: isDark ? '#1a1a1a' : '#f9fafb',
                    borderColor: isDark ? '#262626' : '#e2e8f0',
                    borderRadius: getRadius(120, 'small') 
                  }
                ]}
                onPress={() => setShowBillingCyclePicker(true)}
              >
                <Ionicons name={selectedBillingCycle?.icon as any} size={18} color="#6b7280" />
                <Text style={[styles.pickerText, { color: theme.text }]}>
                  {selectedBillingCycle?.label}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View style={[styles.inputSection, { flex: 1 }]}>
              <Text style={[styles.label, { color: theme.text }]}>Tanggal Mulai</Text>
              <TouchableOpacity
                style={[
                  styles.pickerBtn, 
                  { 
                    backgroundColor: isDark ? '#1a1a1a' : '#f9fafb',
                    borderColor: isDark ? '#262626' : '#e2e8f0',
                    borderRadius: getRadius(120, 'small') 
                  }
                ]}
                onPress={() => setShowCalendar(true)}
              >
                <Ionicons name="calendar-outline" size={18} color="#6b7280" />
                <Text style={[styles.pickerText, { color: theme.text }]}>
                  {formatDate(formData.startDate)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          <View style={styles.inputSection}>
            <Text style={[styles.label, { color: theme.text }]}>Deskripsi</Text>
            <TextInput
              style={[
                styles.input, 
                styles.multilineInput,
                { 
                  backgroundColor: isDark ? '#1a1a1a' : '#f9fafb',
                  borderColor: isDark ? '#262626' : '#e2e8f0',
                  color: theme.text,
                  borderRadius: getRadius(120, 'small') 
                }
              ]}
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
        <View style={[styles.footer, { borderTopColor: isDark ? '#262626' : '#f1f5f9' }]}>
          <TouchableOpacity
            style={[
              styles.submitBtn, 
              { 
                backgroundColor: theme.tint,
                borderRadius: getRadius(120, 'small'),
                opacity: loading ? 0.5 : 1
              }
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.submitBtnText}>
              {loading ? 'Menyimpan...' : subscription ? 'Perbarui' : 'Simpan'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Calendar Overlay */}
      <Modal visible={showCalendar} transparent animationType="fade">
        <Pressable
          style={styles.overlay}
          onPress={() => setShowCalendar(false)}
        >
          <Pressable style={[styles.sheetContent, { backgroundColor: isDark ? '#171717' : '#fff', borderTopLeftRadius: getRadius(200, 'large'), borderTopRightRadius: getRadius(200, 'large') }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: theme.text }]}>Pilih Tanggal</Text>
              <TouchableOpacity onPress={() => setShowCalendar(false)}>
                <Ionicons name="close" size={28} color={isDark ? '#94A3B8' : '#6b7280'} />
              </TouchableOpacity>
            </View>
            <Calendar
              onDayPress={handleDateSelect}
              markedDates={{
                [formData.startDate.toISOString().split('T')[0]]: {
                  selected: true,
                  selectedColor: theme.tint,
                },
              }}
              theme={{
                calendarBackground: isDark ? '#171717' : '#fff',
                textSectionTitleColor: isDark ? '#94A3B8' : '#b6c1cd',
                dayTextColor: isDark ? '#fff' : '#2d4150',
                todayTextColor: theme.tint,
                selectedDayBackgroundColor: theme.tint,
                selectedDayTextColor: '#ffffff',
                arrowColor: theme.tint,
                monthTextColor: isDark ? '#fff' : '#2d4150',
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Billing Cycle Picker Overlay */}
      <Modal visible={showBillingCyclePicker} transparent animationType="fade">
        <Pressable
          style={styles.overlay}
          onPress={() => setShowBillingCyclePicker(false)}
        >
          <Pressable style={[styles.sheetContent, { backgroundColor: isDark ? '#171717' : '#fff', borderTopLeftRadius: getRadius(200, 'large'), borderTopRightRadius: getRadius(200, 'large') }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.sheetHeader, { borderBottomColor: isDark ? '#262626' : '#f1f5f9', borderBottomWidth: 1, paddingBottom: 16 }]}>
              <Text style={[styles.sheetTitle, { color: theme.text }]}>Pilih Siklus Pembayaran</Text>
              <TouchableOpacity onPress={() => setShowBillingCyclePicker(false)}>
                <Ionicons name="close" size={28} color={isDark ? '#94A3B8' : '#6b7280'} />
              </TouchableOpacity>
            </View>
            <ScrollView 
              style={styles.cycleList}
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            >
              {billingCycles.map((cycle) => (
                <TouchableOpacity
                  key={cycle.value}
                  style={[
                    styles.cycleItem,
                    { backgroundColor: isDark ? '#1a1a1a' : '#f9fafb', borderRadius: getRadius(120, 'small') },
                    formData.billingCycle === cycle.value && { backgroundColor: theme.tint + '10', borderColor: theme.tint, borderWidth: 1 }
                  ]}
                  onPress={() => handleBillingCycleSelect(cycle.value as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY')}
                >
                  <View style={styles.cycleInfo}>
                    <View style={[styles.cycleIcon, { backgroundColor: theme.tint + '20' }]}>
                      <Ionicons name={cycle.icon as any} size={20} color={theme.tint} />
                    </View>
                    <Text style={[styles.cycleName, { color: theme.text }]}>{cycle.label}</Text>
                  </View>
                  {formData.billingCycle === cycle.value && (
                    <Ionicons name="checkmark-circle" size={24} color={theme.tint} />
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

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderBottomWidth: 1,
  },
  closeBtn: { width: 44, padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  scroll: { flex: 1, padding: 20 },
  previewContainer: { alignItems: 'center', marginBottom: 32 },
  imageWrapper: { width: 96, height: 96, overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, borderWidth: 2 },
  previewImage: { width: 96, height: 96 },
  iconWrapper: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, borderWidth: 2 },
  cameraBadge: { position: 'absolute', bottom: -2, right: -2, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 4, elevation: 4 },
  previewHint: { fontSize: 12, fontWeight: '600', color: '#94a3b8', marginTop: 12 },
  section: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  brandGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  brandItem: { width: '18%', alignItems: 'center' },
  brandIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 4, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  brandName: { fontSize: 10, fontWeight: '600', color: '#94a3b8', textAlign: 'center' },
  inputSection: { marginBottom: 20 },
  input: { paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, borderWidth: 1 },
  multilineInput: { minHeight: 100, paddingTop: 12 },
  row: { flexDirection: 'row', gap: 12 },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1 },
  pickerText: { flex: 1, fontSize: 15 },
  footer: { padding: 20, borderTopWidth: 1 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheetContent: { padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: '800' },
  cycleList: { marginTop: 12 },
  cycleItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, marginBottom: 8 },
  cycleInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  cycleIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  cycleName: { fontSize: 16, fontWeight: '700' },
});
