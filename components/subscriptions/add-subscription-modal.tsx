import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addSubscription, updateSubscription, type Subscription } from '@/lib/storage';

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
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const billingCycles = [
    { value: 'DAILY', label: 'Harian' },
    { value: 'WEEKLY', label: 'Mingguan' },
    { value: 'MONTHLY', label: 'Bulanan' },
    { value: 'YEARLY', label: 'Tahunan' },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {subscription ? 'Edit Langganan' : 'Tambah Langganan'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            {/* Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nama Langganan *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Netflix, Spotify, dll"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Amount & Billing Cycle */}
            <View style={styles.row}>
              <View style={[styles.formGroup, styles.flex1]}>
                <Text style={styles.label}>Harga *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.amount}
                  onChangeText={(text) => setFormData({ ...formData, amount: text })}
                  placeholder="50000"
                  keyboardType="numeric"
                  placeholderTextColor="#9ca3af"
                />
              </View>
              <View style={[styles.formGroup, styles.flex1]}>
                <Text style={styles.label}>Siklus *</Text>
                <View style={styles.pickerContainer}>
                  {billingCycles.map((cycle) => (
                    <TouchableOpacity
                      key={cycle.value}
                      style={[
                        styles.pickerOption,
                        formData.billingCycle === cycle.value && styles.pickerOptionActive,
                      ]}
                      onPress={() =>
                        setFormData({
                          ...formData,
                          billingCycle: cycle.value as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
                        })
                      }
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          formData.billingCycle === cycle.value && styles.pickerOptionTextActive,
                        ]}
                      >
                        {cycle.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Start Date */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Tanggal Mulai *</Text>
              <TextInput
                style={styles.input}
                value={formatDate(formData.startDate)}
                onChangeText={(text) => {
                  const date = new Date(text);
                  if (!isNaN(date.getTime())) {
                    setFormData({ ...formData, startDate: date });
                  }
                }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Deskripsi (Opsional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
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
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Menyimpan...' : subscription ? 'Simpan' : 'Tambah'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  form: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  pickerContainer: {
    gap: 8,
  },
  pickerOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  pickerOptionActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  pickerOptionText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  pickerOptionTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
