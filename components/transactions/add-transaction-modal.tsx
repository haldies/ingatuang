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
  useColorScheme as useNativeColorScheme,
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
import { Colors, getRadius } from '@/constants/theme';

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
  onSuccess?: () => void;
}

import { CustomAlert } from '@/components/ui/custom-alert';

export function AddTransactionModal({
  visible,
  onClose,
  transaction,
  onSuccess,
}: AddTransactionModalProps) {
  const colorScheme = useNativeColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  
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

  // Alert state
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

    setLoading(true);

    try {
      const isNew = !transaction || transaction.id.startsWith('temp-');
      
      if (!isNew && transaction) {
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

  const handleDelete = async () => {
    if (!transaction) return;

    showAlert({
      title: 'Hapus Transaksi',
      message: 'Apakah Anda yakin ingin menghapus transaksi ini?',
      type: 'warning',
      buttons: [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await storage.deleteTransaction(transaction.id);
              onClose();
              if (onSuccess) onSuccess();
            } catch (error) {
              console.error('Error deleting transaction:', error);
              alert('Gagal menghapus transaksi');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    });
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
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colorScheme === 'dark' ? '#262626' : '#f1f5f9' }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={28} color={colorScheme === 'dark' ? '#a3a3a3' : '#6b7280'} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              {transaction && !transaction.id.startsWith('temp-') ? 'Edit Transaksi' : 'Tambah Transaksi'}
            </Text>
            <View style={styles.headerRightPlaceholder}>
                {transaction && !transaction.id.startsWith('temp-') && (
                  <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={24} color="#ef4444" />
                  </TouchableOpacity>
                )}
            </View>
          </View>

          <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Type Selector */}
            <View style={styles.section}>
              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    { borderRadius: getRadius(54) },
                    formData.type === 'INCOME' ? { backgroundColor: '#22c55e' } : { backgroundColor: colorScheme === 'dark' ? '#262626' : '#f3f4f6' }
                  ]}
                  onPress={() => setFormData({ ...formData, type: 'INCOME', categoryId: '' })}
                >
                  <Ionicons 
                    name="arrow-down-circle" 
                    size={20} 
                    color={formData.type === 'INCOME' ? '#fff' : '#6b7280'} 
                  />
                  <Text style={[
                    styles.typeBtnText,
                    formData.type === 'INCOME' ? { color: '#fff' } : { color: '#6b7280' }
                  ]}>
                    Pemasukan
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    { borderRadius: getRadius(54) },
                    formData.type === 'EXPENSE' ? { backgroundColor: '#ef4444' } : { backgroundColor: colorScheme === 'dark' ? '#262626' : '#f3f4f6' }
                  ]}
                  onPress={() => setFormData({ ...formData, type: 'EXPENSE', categoryId: '' })}
                >
                  <Ionicons 
                    name="arrow-up-circle" 
                    size={20} 
                    color={formData.type === 'EXPENSE' ? '#fff' : '#6b7280'} 
                  />
                  <Text style={[
                    styles.typeBtnText,
                    formData.type === 'EXPENSE' ? { color: '#fff' } : { color: '#6b7280' }
                  ]}>
                    Pengeluaran
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Category & Wallet Pickers */}
            <View style={[styles.section, styles.flexRow, { gap: 12 }]}>
              <View style={styles.flex1}>
                <Text style={[styles.label, { color: theme.text }]}>Kategori</Text>
                <TouchableOpacity
                  style={[
                    styles.pickerBtn,
                    { 
                      backgroundColor: colorScheme === 'dark' ? '#171717' : '#f9fafb',
                      borderColor: colorScheme === 'dark' ? '#262626' : '#e5e7eb',
                      borderRadius: getRadius(50)
                    }
                  ]}
                  onPress={() => setShowCategoryPicker(true)}
                >
                  {selectedCategory ? (
                    <>
                      <Text style={styles.pickerEmoji}>{selectedCategory.icon}</Text>
                      <Text style={[styles.pickerText, { color: theme.text }]} numberOfLines={1}>{selectedCategory.name}</Text>
                    </>
                  ) : (
                    <Text style={styles.pickerPlaceholder}>Pilih</Text>
                  )}
                  <Ionicons name="chevron-down" size={16} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.flex1}>
                <Text style={[styles.label, { color: theme.text }]}>Dompet</Text>
                <TouchableOpacity
                  style={[
                    styles.pickerBtn,
                    { 
                      backgroundColor: colorScheme === 'dark' ? '#171717' : '#f9fafb',
                      borderColor: colorScheme === 'dark' ? '#262626' : '#e5e7eb',
                      borderRadius: getRadius(50)
                    }
                  ]}
                  onPress={() => setShowWalletPicker(true)}
                >
                  {wallets.find(w => w.id === formData.walletId) ? (
                    <>
                      <Ionicons name={wallets.find(w => w.id === formData.walletId)?.icon as any || 'wallet'} size={18} color={colorScheme === 'dark' ? '#d4d4d4' : '#374151'} />
                      <Text style={[styles.pickerText, { color: theme.text }]} numberOfLines={1}>
                        {wallets.find(w => w.id === formData.walletId)?.name}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.pickerPlaceholder}>Pilih</Text>
                  )}
                  <Ionicons name="chevron-down" size={16} color="#6b7280" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Amount & Date */}
            <View style={[styles.section, styles.flexRow, { gap: 12 }]}>
              <View style={styles.flex1}>
                <Text style={[styles.label, { color: theme.text }]}>Jumlah</Text>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: colorScheme === 'dark' ? '#171717' : '#f9fafb',
                      borderColor: colorScheme === 'dark' ? '#262626' : '#e5e7eb',
                      color: theme.text,
                      borderRadius: getRadius(50)
                    }
                  ]}
                  value={formData.amount}
                  onChangeText={(text) => setFormData({ ...formData, amount: text })}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor="#9ca3af"
                />
              </View>
              <View style={styles.flex1}>
                <Text style={[styles.label, { color: theme.text }]}>Tanggal</Text>
                <TouchableOpacity
                  style={[
                    styles.pickerBtn,
                    { 
                      backgroundColor: colorScheme === 'dark' ? '#171717' : '#f9fafb',
                      borderColor: colorScheme === 'dark' ? '#262626' : '#e5e7eb',
                      borderRadius: getRadius(50)
                    }
                  ]}
                  onPress={() => setShowCalendar(true)}
                >
                  <Ionicons name="calendar-outline" size={18} color="#6b7280" />
                  <Text style={[styles.pickerText, { color: theme.text }]}>
                    {formatDate(formData.date)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Notes */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.text }]}>Catatan</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { 
                    backgroundColor: colorScheme === 'dark' ? '#171717' : '#f9fafb',
                    borderColor: colorScheme === 'dark' ? '#262626' : '#e5e7eb',
                    color: theme.text,
                    borderRadius: getRadius(100, 'medium')
                  }
                ]}
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

          {/* Footer Submit Button */}
          <View style={[styles.footer, { borderTopColor: colorScheme === 'dark' ? '#262626' : '#f1f5f9' }]}>
            <TouchableOpacity
              style={[
                styles.submitBtn,
                { 
                  backgroundColor: theme.tint,
                  borderRadius: getRadius(56),
                  opacity: loading ? 0.5 : 1
                }
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitBtnText}>
                {loading ? 'Menyimpan...' : (transaction && !transaction.id.startsWith('temp-') ? 'Perbarui' : 'Simpan')}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Calendar Picker Modal */}
        {showCalendar && (
          <View style={styles.overlay} pointerEvents="box-none">
            <Pressable style={styles.overlayBg} onPress={() => setShowCalendar(false)} />
            <View style={[styles.overlayContent, { backgroundColor: theme.background, borderRadius: getRadius(200, 'large') }]}>
              <View style={styles.overlayHeader}>
                <Text style={[styles.overlayTitle, { color: theme.text }]}>Pilih Tanggal</Text>
                <TouchableOpacity onPress={() => setShowCalendar(false)}>
                  <Ionicons name="close" size={28} color="#6b7280" />
                </TouchableOpacity>
              </View>
              <Calendar
                onDayPress={handleDateSelect}
                markedDates={{
                  [formData.date.toISOString().split('T')[0]]: {
                    selected: true,
                    selectedColor: theme.tint,
                  },
                }}
                theme={{
                  calendarBackground: theme.background,
                  textSectionTitleColor: '#6b7280',
                  selectedDayBackgroundColor: theme.tint,
                  selectedDayTextColor: '#ffffff',
                  todayTextColor: theme.tint,
                  dayTextColor: theme.text,
                  textDisabledColor: '#d9e1e8',
                  dotColor: theme.tint,
                  selectedDotColor: '#ffffff',
                  arrowColor: theme.tint,
                  disabledArrowColor: '#d9e1e8',
                  monthTextColor: theme.text,
                  indicatorColor: theme.tint,
                  textDayFontSize: 16,
                  textMonthFontSize: 18,
                  textDayHeaderFontSize: 14,
                  textDayFontWeight: '400',
                  textMonthFontWeight: '700',
                  textDayHeaderFontWeight: '500',
                }}
              />
            </View>
          </View>
        )}

        {/* Wallet Picker Modal */}
        {showWalletPicker && (
          <View style={styles.overlay} pointerEvents="box-none">
            <Pressable style={styles.overlayBg} onPress={() => setShowWalletPicker(false)} />
            <View style={[styles.overlayContent, { backgroundColor: theme.background, borderRadius: getRadius(200, 'large'), maxHeight: '70%' }]}>
              <View style={[styles.overlayHeader, { borderBottomColor: colorScheme === 'dark' ? '#262626' : '#f1f5f9' }]}>
                <Text style={[styles.overlayTitle, { color: theme.text }]}>Pilih Dompet</Text>
                <TouchableOpacity onPress={() => setShowWalletPicker(false)}>
                  <Ionicons name="close" size={28} color="#6b7280" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.pickerList} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                {wallets.map((wallet) => (
                  <TouchableOpacity
                    key={wallet.id}
                    style={[
                      styles.pickerItem,
                      { borderRadius: getRadius(50) },
                      formData.walletId === wallet.id 
                        ? { backgroundColor: theme.tint + '15', borderColor: theme.tint, borderWidth: 1 } 
                        : { backgroundColor: colorScheme === 'dark' ? '#171717' : '#f9fafb' }
                    ]}
                    onPress={() => {
                      setFormData({ ...formData, walletId: wallet.id });
                      setShowWalletPicker(false);
                    }}
                  >
                    <View style={styles.pickerItemLeft}>
                      <View style={[styles.pickerIconContainer, { backgroundColor: colorScheme === 'dark' ? '#262626' : '#e5e7eb' }]}>
                        <Ionicons name={wallet.icon as any} size={20} color={wallet.color} />
                      </View>
                      <Text style={[styles.pickerItemText, { color: theme.text }]}>{wallet.name}</Text>
                    </View>
                    {formData.walletId === wallet.id && (
                      <Ionicons name="checkmark-circle" size={24} color={theme.tint} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Category Picker Modal */}
        {showCategoryPicker && (
          <View style={styles.overlay} pointerEvents="box-none">
            <Pressable style={styles.overlayBg} onPress={() => setShowCategoryPicker(false)} />
            <View style={[styles.overlayContent, { backgroundColor: theme.background, borderRadius: getRadius(200, 'large'), maxHeight: '70%' }]}>
              <View style={[styles.overlayHeader, { borderBottomColor: colorScheme === 'dark' ? '#262626' : '#f1f5f9' }]}>
                <Text style={[styles.overlayTitle, { color: theme.text }]}>Pilih Kategori</Text>
                <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                  <Ionicons name="close" size={28} color="#6b7280" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.pickerList} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                {filteredCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.pickerItem,
                      { borderRadius: getRadius(50) },
                      formData.categoryId === cat.id 
                        ? { backgroundColor: theme.tint + '15', borderColor: theme.tint, borderWidth: 1 } 
                        : { backgroundColor: colorScheme === 'dark' ? '#171717' : '#f9fafb' }
                    ]}
                    onPress={() => handleCategorySelect(cat.id)}
                  >
                    <View style={styles.pickerItemLeft}>
                      <View 
                        style={[styles.pickerIconContainer, { backgroundColor: cat.color + '25' }]}
                      >
                        <Text style={styles.pickerEmoji}>{cat.icon}</Text>
                      </View>
                      <Text style={[styles.pickerItemText, { color: theme.text }]}>{cat.name}</Text>
                    </View>
                    {formData.categoryId === cat.id && (
                      <Ionicons name="checkmark-circle" size={24} color={theme.tint} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        <CustomAlert
          visible={alertVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          buttons={alertConfig.buttons}
          onClose={() => setAlertVisible(false)}
        />
      </Animated.View>
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
    paddingVertical: 16, 
    borderBottomWidth: 1 
  },
  closeBtn: { padding: 4, width: 40 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  headerRightPlaceholder: { width: 40, alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { padding: 4 },
  container: { flex: 1, padding: 20 },
  section: { marginBottom: 20 },
  typeRow: { flexDirection: 'row', gap: 12 },
  typeBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    paddingVertical: 14 
  },
  typeBtnText: { fontSize: 15, fontWeight: '600' },
  flexRow: { flexDirection: 'row' },
  flex1: { flex: 1 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  pickerBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    borderWidth: 1, 
    paddingHorizontal: 16, 
    paddingVertical: 12 
  },
  pickerEmoji: { fontSize: 20 },
  pickerText: { flex: 1, fontSize: 15 },
  pickerPlaceholder: { flex: 1, fontSize: 15, color: '#9ca3af' },
  input: { 
    borderWidth: 1, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    fontSize: 15 
  },
  textArea: { minHeight: 100, paddingTop: 12 },
  footer: { 
    flexDirection: 'row', 
    paddingHorizontal: 20, 
    paddingTop: 16, 
    paddingBottom: 24, 
    borderTopWidth: 1 
  },
  submitBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 16 
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  overlay: { 
    ...StyleSheet.absoluteFillObject, 
    zIndex: 50, 
    justifyContent: 'flex-end' 
  },
  overlayBg: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.5)' 
  },
  overlayContent: { 
    padding: 20, 
    paddingBottom: 40 
  },
  overlayHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 0,
  },
  overlayTitle: { fontSize: 20, fontWeight: '700' },
  pickerList: { paddingVertical: 10 },
  pickerItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingVertical: 14, 
    paddingHorizontal: 16, 
    marginBottom: 8 
  },
  pickerItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  pickerIconContainer: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  pickerItemText: { fontSize: 16, fontWeight: '500' },
});
