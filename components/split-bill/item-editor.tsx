import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SplitBillItem, SplitBillPerson } from '@/lib/storage';

interface ItemEditorProps {
  initialItems: SplitBillItem[];
  onContinue: (
    items: SplitBillItem[],
    persons: SplitBillPerson[],
    assignments: Map<string, string[]>
  ) => void;
  onBack?: () => void;
}

export function ItemEditor({ initialItems, onContinue, onBack }: ItemEditorProps) {
  const [items] = useState<SplitBillItem[]>(initialItems);

  // Person assignment states
  const [persons, setPersons] = useState<SplitBillPerson[]>([
    { id: 'person-1', name: 'Person 1' },
  ]);
  const [selectedPersonId, setSelectedPersonId] = useState<string>('person-1');
  const [newPersonName, setNewPersonName] = useState<string>('');
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);
  const [assignments, setAssignments] = useState<Map<string, string[]>>(() => {
    const initialMap = new Map<string, string[]>();
    initialMap.set('person-1', []);
    return initialMap;
  });

  const handleToggleItem = (id: string) => {
    if (!selectedPersonId) {
      Alert.alert('Error', 'Pilih orang terlebih dahulu');
      return;
    }

    setAssignments((prev) => {
      const newAssignments = new Map(prev);
      const personItems = newAssignments.get(selectedPersonId) || [];

      if (personItems.includes(id)) {
        // Remove item from person
        newAssignments.set(
          selectedPersonId,
          personItems.filter((itemId) => itemId !== id)
        );
      } else {
        // Add item to person
        newAssignments.set(selectedPersonId, [...personItems, id]);
      }

      return newAssignments;
    });
  };

  const handleAddPerson = () => {
    if (!newPersonName.trim()) {
      Alert.alert('Error', 'Mohon isi nama orang');
      return;
    }

    const newPerson: SplitBillPerson = {
      id: `person-${Date.now()}`,
      name: newPersonName.trim(),
    };

    setPersons((prev) => [...prev, newPerson]);
    setAssignments((prev) => {
      const newAssignments = new Map(prev);
      newAssignments.set(newPerson.id, []);
      return newAssignments;
    });
    setSelectedPersonId(newPerson.id);
    setNewPersonName('');
    setShowAddPersonModal(false);
  };

  const handleRemovePerson = (personId: string) => {
    if (persons.length === 1) {
      Alert.alert('Error', 'Minimal harus ada 1 orang');
      return;
    }

    const remainingPersons = persons.filter((p) => p.id !== personId);
    setPersons(remainingPersons);
    setAssignments((prev) => {
      const newAssignments = new Map(prev);
      newAssignments.delete(personId);
      return newAssignments;
    });

    if (selectedPersonId === personId) {
      setSelectedPersonId(remainingPersons[0].id);
    }
  };

  const handleContinue = () => {
    // Check if all items are assigned
    const assignedItemIds = new Set<string>();

    assignments.forEach((itemIds) => {
      itemIds.forEach((id) => assignedItemIds.add(id));
    });

    const unassignedItems = items.filter((item) => !assignedItemIds.has(item.id));

    if (unassignedItems.length > 0) {
      Alert.alert(
        'Items Belum Di-assign',
        `Mohon assign semua items. ${unassignedItems.length} item(s) belum di-assign.`
      );
      return;
    }

    onContinue(items, persons, assignments);
  };

  const personItems = assignments.get(selectedPersonId) || [];

  const getItemAssignedTo = (itemId: string): string[] => {
    const assignedPersons: string[] = [];
    assignments.forEach((itemIds, personId) => {
      if (itemIds.includes(itemId)) {
        const person = persons.find((p) => p.id === personId);
        if (person) assignedPersons.push(person.name);
      }
    });
    return assignedPersons;
  };

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
          <Text style={styles.title}>Split Bill</Text>
          <Text style={styles.subtitle}>Assign items ke setiap orang</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Assign People Section */}
        <View style={styles.personsCard}>
          <Text style={styles.personsTitle}>Assign People</Text>

          {/* Person List with horizontal scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.personsScroll}
            contentContainerStyle={styles.personsScrollContent}
          >
            {persons.map((person) => (
              <View key={person.id} style={styles.personChipContainer}>
                <TouchableOpacity
                  style={[
                    styles.personChip,
                    selectedPersonId === person.id && styles.personChipActive,
                  ]}
                  onPress={() => setSelectedPersonId(person.id)}
                >
                  {selectedPersonId === person.id && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                  <Text
                    style={[
                      styles.personChipText,
                      selectedPersonId === person.id && styles.personChipTextActive,
                    ]}
                  >
                    {person.name}
                  </Text>
                </TouchableOpacity>
                {persons.length > 1 && (
                  <TouchableOpacity
                    onPress={() => handleRemovePerson(person.id)}
                    style={styles.personRemoveButton}
                  >
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color={selectedPersonId === person.id ? '#fff' : '#6b7280'}
                    />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {/* Add Person Button */}
            <TouchableOpacity
              style={styles.addPersonChip}
              onPress={() => setShowAddPersonModal(true)}
            >
              <Ionicons name="add" size={14} color="#3b82f6" />
              <Text style={styles.addPersonText}>Add</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Items List */}
        <View style={styles.itemsCard}>
          {items.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Tidak ada items.</Text>
            </View>
          ) : (
            items.map((item, index) => {
              const assignedTo = getItemAssignedTo(item.id);
              const isSelected = personItems.includes(item.id);

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.itemRow,
                    isSelected && styles.itemRowSelected,
                    index < items.length - 1 && styles.itemRowBorder,
                  ]}
                  onPress={() => handleToggleItem(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>
                      @ Rp {item.price.toLocaleString('id-ID')}
                    </Text>
                  </View>

                  <View style={styles.itemRight}>
                    <View style={styles.itemQuantity}>
                      <Text style={styles.itemQuantityText}>×{item.quantity}</Text>
                    </View>

                    <View style={styles.itemTotal}>
                      <Text style={styles.itemTotalText}>
                        Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                      </Text>
                    </View>

                    <View style={styles.itemAssigned}>
                      {assignedTo.length > 0 ? (
                        <Text style={styles.itemAssignedText} numberOfLines={1}>
                          {assignedTo.join(', ')}
                        </Text>
                      ) : (
                        <Text style={styles.itemAssignedEmpty}>-</Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, items.length === 0 && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={items.length === 0}
        >
          <Text style={styles.continueButtonText}>Buat Split Bill</Text>
        </TouchableOpacity>
      </View>

      {/* Add Person Modal */}
      <Modal
        visible={showAddPersonModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddPersonModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tambah Orang</Text>
              <TouchableOpacity onPress={() => setShowAddPersonModal(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Masukkan nama orang untuk ditambahkan ke split bill.
            </Text>

            <TextInput
              value={newPersonName}
              onChangeText={setNewPersonName}
              placeholder="Nama orang"
              placeholderTextColor="#9ca3af"
              style={styles.modalInput}
              autoFocus
              onSubmitEditing={handleAddPerson}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowAddPersonModal(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonPrimary} onPress={handleAddPerson}>
                <Text style={styles.modalButtonPrimaryText}>Tambah</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  content: {
    flex: 1,
    padding: 16,
  },
  personsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  personsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 10,
  },
  personsScroll: {
    marginHorizontal: -12,
  },
  personsScrollContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  personChipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  personChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  personChipActive: {
    backgroundColor: '#3b82f6',
  },
  personChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  personChipTextActive: {
    color: '#fff',
  },
  personRemoveButton: {
    marginLeft: -8,
  },
  addPersonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  addPersonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3b82f6',
  },
  itemsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 80,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#6b7280',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  itemRowSelected: {
    backgroundColor: '#eff6ff',
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  itemPrice: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemQuantity: {
    width: 32,
    alignItems: 'center',
  },
  itemQuantityText: {
    fontSize: 12,
    color: '#6b7280',
  },
  itemTotal: {
    width: 80,
    alignItems: 'flex-end',
  },
  itemTotalText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  itemAssigned: {
    width: 96,
    alignItems: 'flex-end',
  },
  itemAssignedText: {
    fontSize: 11,
    color: '#6b7280',
  },
  itemAssignedEmpty: {
    fontSize: 11,
    color: '#d1d5db',
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
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  modalButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  modalButtonPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  modalButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
