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
import {
  addTransaction,
  updateTransaction,
  getCategories,
  type Transaction,
  type Category,
} from '@/lib/storage';
import { formatCurrency } from '@/lib/format';

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
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    type: 'EXPENSE' as 'EXPENSE' | 'INCOME',
    categoryId: '',
    amount: '',
    date: new Date(),
    notes: '',
  });

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      const cats = await getCategories();
      setCategories(cats);
    };
    if (visible) {
      loadCategories();
    }
  }, [visible]);

  // Load transaction data when editing
  useEffect(() => {
    if (transaction && visible) {
      setFormData({
        type: transaction.type,
        categoryId: transaction.categoryId,
        amount: transaction.amount.toString(),
        date: new Date(transaction.date),
        notes: transaction.notes || '',
      });
    } else if (!transaction && visible) {
      // Reset form
      setFormData({
        type: 'EXPENSE',
        categoryId: '',
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
        await updateTransaction(transaction.id, {
          type: formData.type,
          categoryId: formData.categoryId,
          amount: parseFloat(formData.amount),
          date: formData.date.toISOString(),
          notes: formData.notes || undefined,
        });
      } else {
        // Create
        await addTransaction({
          type: formData.type,
          categoryId: formData.categoryId,
          amount: parseFloat(formData.amount),
          date: formData.date.toISOString(),
          notes: formData.notes || undefined,
        });
      }

      // Reset form
      setFormData({
        type: 'EXPENSE',
        categoryId: '',
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

  // Format date for display
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {transaction ? 'Edit Transaksi' : 'Tambah Transaksi'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            {/* Type */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Tipe</Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formData.type === 'INCOME' && styles.typeButtonIncome,
                  ]}
                  onPress={() => setFormData({ ...formData, type: 'INCOME', categoryId: '' })}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      formData.type === 'INCOME' && styles.typeButtonTextActive,
                    ]}
                  >
                    Pemasukan
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formData.type === 'EXPENSE' && styles.typeButtonExpense,
                  ]}
                  onPress={() => setFormData({ ...formData, type: 'EXPENSE', categoryId: '' })}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      formData.type === 'EXPENSE' && styles.typeButtonTextActive,
                    ]}
                  >
                    Pengeluaran
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Category */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Kategori</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
              >
                {filteredCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      formData.categoryId === cat.id && styles.categoryChipActive,
                      formData.categoryId === cat.id && {
                        backgroundColor: cat.color + '20',
                        borderColor: cat.color,
                      },
                    ]}
                    onPress={() => setFormData({ ...formData, categoryId: cat.id })}
                  >
                    <Text style={styles.categoryIcon}>{cat.icon}</Text>
                    <Text
                      style={[
                        styles.categoryName,
                        formData.categoryId === cat.id && styles.categoryNameActive,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Amount & Date */}
            <View style={styles.row}>
              <View style={[styles.formGroup, styles.flex1]}>
                <Text style={styles.label}>Jumlah</Text>
                <TextInput
                  style={styles.input}
                  value={formData.amount}
                  onChangeText={(text) => setFormData({ ...formData, amount: text })}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor="#9ca3af"
                />
              </View>
              <View style={[styles.formGroup, styles.flex1]}>
                <Text style={styles.label}>Tanggal</Text>
                <TextInput
                  style={styles.input}
                  value={formatDate(formData.date)}
                  onChangeText={(text) => {
                    const date = new Date(text);
                    if (!isNaN(date.getTime())) {
                      setFormData({ ...formData, date });
                    }
                  }}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            {/* Notes */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Catatan (Opsional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
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
                {loading ? 'Menyimpan...' : transaction ? 'Perbarui' : 'Simpan'}
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
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  typeButtonIncome: {
    backgroundColor: '#10b981',
  },
  typeButtonExpense: {
    backgroundColor: '#ef4444',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  categoryScroll: {
    flexGrow: 0,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    marginRight: 8,
    gap: 6,
  },
  categoryChipActive: {
    borderWidth: 2,
  },
  categoryIcon: {
    fontSize: 18,
  },
  categoryName: {
    fontSize: 14,
    color: '#6b7280',
  },
  categoryNameActive: {
    fontWeight: '600',
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
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
