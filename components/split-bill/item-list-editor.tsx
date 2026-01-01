import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SplitBillItem } from '@/lib/storage';

interface ItemListEditorProps {
  initialItems: Array<{ name: string; price: number }>;
  initialTax?: number;
  initialService?: number;
  onContinue: (
    items: SplitBillItem[],
    taxPercentage: number,
    servicePercentage: number
  ) => void;
  onBack?: () => void;
}

export function ItemListEditor({
  initialItems,
  initialTax = 0,
  initialService = 0,
  onContinue,
  onBack,
}: ItemListEditorProps) {
  const [items, setItems] = useState<SplitBillItem[]>(
    initialItems.map((item, index) => ({
      id: `item-${index}`,
      name: item.name,
      price: item.price,
      quantity: 1,
    }))
  );
  const [taxPercentage, setTaxPercentage] = useState<number>(initialTax);
  const [servicePercentage, setServicePercentage] = useState<number>(initialService);
  const [isEditMode, setIsEditMode] = useState(false);

  const handleUpdateName = (id: string, name: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name } : item))
    );
  };

  const handleUpdatePrice = (id: string, price: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, price } : item))
    );
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  };

  const handleDeleteItem = (id: string) => {
    if (items.length === 1) {
      Alert.alert('Error', 'Minimal harus ada 1 item');
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddItem = () => {
    const newItem: SplitBillItem = {
      id: `item-${Date.now()}`,
      name: '',
      price: 0,
      quantity: 1,
    };
    setItems((prev) => [...prev, newItem]);
    setIsEditMode(true);
  };

  const handleContinue = () => {
    const invalidItems = items.filter(
      (item) => !item.name.trim() || item.price <= 0
    );

    if (invalidItems.length > 0) {
      Alert.alert('Error', 'Pastikan semua item memiliki nama dan harga yang valid');
      return;
    }

    onContinue(items, taxPercentage, servicePercentage);
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxAmount = (subtotal * taxPercentage) / 100;
  const serviceAmount = (subtotal * servicePercentage) / 100;
  const total = subtotal + taxAmount + serviceAmount;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
        )}
        <View style={styles.headerContent}>
          <Text style={styles.title}>Edit Items</Text>
          <Text style={styles.subtitle}>Review dan edit items yang diekstrak</Text>
        </View>
        <TouchableOpacity
          onPress={() => setIsEditMode(!isEditMode)}
          style={styles.editButton}
        >
          <Ionicons
            name={isEditMode ? 'checkmark' : 'pencil'}
            size={20}
            color="#3b82f6"
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Items List */}
        <View style={styles.itemsCard}>
          {items.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                Tidak ada items. Klik "Tambah Item" untuk menambah.
              </Text>
            </View>
          ) : (
            items.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.itemRow,
                  index < items.length - 1 && styles.itemRowBorder,
                ]}
              >
                {isEditMode ? (
                  <View style={styles.itemEditContainer}>
                    <TextInput
                      value={item.name}
                      onChangeText={(text) => handleUpdateName(item.id, text)}
                      placeholder="Nama item"
                      placeholderTextColor="#9ca3af"
                      style={styles.itemNameInput}
                    />
                    <View style={styles.itemEditRow}>
                      <View style={styles.itemEditField}>
                        <Text style={styles.itemEditLabel}>Qty</Text>
                        <TextInput
                          value={item.quantity.toString()}
                          onChangeText={(text) =>
                            handleUpdateQuantity(item.id, parseInt(text) || 1)
                          }
                          placeholder="1"
                          keyboardType="numeric"
                          placeholderTextColor="#9ca3af"
                          style={styles.itemEditInput}
                        />
                      </View>
                      <View style={[styles.itemEditField, styles.itemEditFieldLarge]}>
                        <Text style={styles.itemEditLabel}>Harga (Rp)</Text>
                        <TextInput
                          value={item.price > 0 ? item.price.toString() : ''}
                          onChangeText={(text) =>
                            handleUpdatePrice(item.id, parseFloat(text) || 0)
                          }
                          placeholder="0"
                          keyboardType="numeric"
                          placeholderTextColor="#9ca3af"
                          style={styles.itemEditInput}
                        />
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDeleteItem(item.id)}
                        style={styles.deleteButton}
                      >
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.itemViewContainer}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemDetail}>
                      {item.quantity} × Rp {item.price.toLocaleString('id-ID')} = Rp{' '}
                      {(item.price * item.quantity).toLocaleString('id-ID')}
                    </Text>
                  </View>
                )}
              </View>
            ))
          )}

          {isEditMode && (
            <TouchableOpacity style={styles.addItemButton} onPress={handleAddItem}>
              <Ionicons name="add-circle-outline" size={20} color="#3b82f6" />
              <Text style={styles.addItemText}>Tambah Item</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tax and Service */}
        {(isEditMode || taxPercentage > 0 || servicePercentage > 0) && (
          <View style={styles.chargesCard}>
            <Text style={styles.chargesTitle}>Biaya Tambahan</Text>
            {isEditMode ? (
              <View style={styles.chargesEditContainer}>
                <View style={styles.chargeField}>
                  <Text style={styles.chargeLabel}>Pajak (%)</Text>
                  <TextInput
                    value={taxPercentage > 0 ? taxPercentage.toString() : ''}
                    onChangeText={(text) => setTaxPercentage(parseFloat(text) || 0)}
                    placeholder="0"
                    keyboardType="numeric"
                    placeholderTextColor="#9ca3af"
                    style={styles.chargeInput}
                  />
                </View>
                <View style={styles.chargeField}>
                  <Text style={styles.chargeLabel}>Service (%)</Text>
                  <TextInput
                    value={servicePercentage > 0 ? servicePercentage.toString() : ''}
                    onChangeText={(text) => setServicePercentage(parseFloat(text) || 0)}
                    placeholder="0"
                    keyboardType="numeric"
                    placeholderTextColor="#9ca3af"
                    style={styles.chargeInput}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.chargesViewContainer}>
                {taxPercentage > 0 && (
                  <View style={styles.chargeRow}>
                    <Text style={styles.chargeViewLabel}>Pajak</Text>
                    <Text style={styles.chargeViewValue}>{taxPercentage}%</Text>
                  </View>
                )}
                {servicePercentage > 0 && (
                  <View style={styles.chargeRow}>
                    <Text style={styles.chargeViewLabel}>Service</Text>
                    <Text style={styles.chargeViewValue}>{servicePercentage}%</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>
              Rp {subtotal.toLocaleString('id-ID')}
            </Text>
          </View>
          {taxPercentage > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Pajak ({taxPercentage}%)</Text>
              <Text style={styles.summaryValue}>
                Rp {taxAmount.toLocaleString('id-ID')}
              </Text>
            </View>
          )}
          {servicePercentage > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service ({servicePercentage}%)</Text>
              <Text style={styles.summaryValue}>
                Rp {serviceAmount.toLocaleString('id-ID')}
              </Text>
            </View>
          )}
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalValue}>
              Rp {total.toLocaleString('id-ID')}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, items.length === 0 && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={items.length === 0}
        >
          <Text style={styles.continueButtonText}>Lanjut ke Split</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  itemsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  itemRow: {
    padding: 16,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemEditContainer: {
    gap: 12,
  },
  itemNameInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  itemEditRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  itemEditField: {
    flex: 1,
  },
  itemEditFieldLarge: {
    flex: 2,
  },
  itemEditLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
  },
  itemEditInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#111827',
  },
  deleteButton: {
    padding: 8,
  },
  itemViewContainer: {
    gap: 4,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  itemDetail: {
    fontSize: 11,
    color: '#6b7280',
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  addItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  chargesCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  chargesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
  },
  chargesEditContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  chargeField: {
    flex: 1,
  },
  chargeLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 6,
  },
  chargeInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#111827',
  },
  chargesViewContainer: {
    gap: 6,
  },
  chargeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chargeViewLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  chargeViewValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 80,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  summaryTotalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  summaryTotalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
