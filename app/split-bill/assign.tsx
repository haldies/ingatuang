import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { addSplitBill, type SplitBillItem, type SplitBillPerson, type SplitBillAssignment } from '@/lib/storage';

export default function AssignPersonsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [title] = useState(params.title as string);
  const [items, setItems] = useState<SplitBillItem[]>([]);
  const [taxPercentage] = useState(parseFloat(params.taxPercentage as string) || 0);
  const [servicePercentage] = useState(parseFloat(params.servicePercentage as string) || 0);
  
  const [persons, setPersons] = useState<SplitBillPerson[]>([
    { id: '1', name: 'Person 1' },
  ]);
  const [selectedPersonId, setSelectedPersonId] = useState<string>('1');
  const [assignments, setAssignments] = useState<Map<string, string[]>>(new Map());
  const [saving, setSaving] = useState(false);
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');

  useEffect(() => {
    if (params.items) {
      const parsedItems = JSON.parse(params.items as string);
      setItems(parsedItems);
      
      // Check if persons and assignments are provided (from new flow)
      if (params.persons && params.assignments) {
        const parsedPersons = JSON.parse(params.persons as string);
        const parsedAssignments = JSON.parse(params.assignments as string);
        
        setPersons(parsedPersons);
        
        // Convert assignments array to Map
        const assignmentsMap = new Map<string, string[]>();
        parsedPersons.forEach((person: SplitBillPerson) => {
          const personAssignments = parsedAssignments
            .filter((a: any) => a.personId === person.id)
            .map((a: any) => a.itemId);
          assignmentsMap.set(person.id, personAssignments);
        });
        setAssignments(assignmentsMap);
        
        if (parsedPersons.length > 0) {
          setSelectedPersonId(parsedPersons[0].id);
        }
      } else {
        // Old flow - initialize with empty assignments
        const initialAssignments = new Map<string, string[]>();
        initialAssignments.set('1', []);
        setAssignments(initialAssignments);
      }
    }
  }, [params.items, params.persons, params.assignments]);

  const addPerson = () => {
    if (!newPersonName.trim()) {
      Alert.alert('Error', 'Mohon isi nama orang');
      return;
    }

    const newPerson: SplitBillPerson = {
      id: Date.now().toString(),
      name: newPersonName.trim(),
    };
    setPersons([...persons, newPerson]);
    setSelectedPersonId(newPerson.id);
    setNewPersonName('');
    setShowAddPersonModal(false);
  };

  const updatePersonName = (id: string, name: string) => {
    setPersons(persons.map(p => p.id === id ? { ...p, name } : p));
  };

  const removePerson = (id: string) => {
    if (persons.length === 1) {
      Alert.alert('Error', 'Minimal harus ada 1 orang');
      return;
    }
    
    // Remove person from assignments
    const newAssignments = new Map(assignments);
    newAssignments.forEach((personIds, itemId) => {
      newAssignments.set(itemId, personIds.filter(pid => pid !== id));
    });
    setAssignments(newAssignments);
    
    const remainingPersons = persons.filter(p => p.id !== id);
    setPersons(remainingPersons);
    
    if (selectedPersonId === id) {
      setSelectedPersonId(remainingPersons[0].id);
    }
  };

  const toggleItemAssignment = (itemId: string) => {
    if (!selectedPersonId) {
      Alert.alert('Error', 'Pilih orang terlebih dahulu');
      return;
    }

    const newAssignments = new Map(assignments);
    const currentAssignments = newAssignments.get(itemId) || [];
    
    if (currentAssignments.includes(selectedPersonId)) {
      // Remove assignment
      newAssignments.set(itemId, currentAssignments.filter(id => id !== selectedPersonId));
    } else {
      // Add assignment
      newAssignments.set(itemId, [...currentAssignments, selectedPersonId]);
    }
    
    setAssignments(newAssignments);
  };

  const toggleAssignment = (itemId: string, personId: string) => {
    const newAssignments = new Map(assignments);
    const currentAssignments = newAssignments.get(itemId) || [];
    
    if (currentAssignments.includes(personId)) {
      // Remove assignment
      newAssignments.set(itemId, currentAssignments.filter(id => id !== personId));
    } else {
      // Add assignment
      newAssignments.set(itemId, [...currentAssignments, personId]);
    }
    
    setAssignments(newAssignments);
  };

  const getItemAssignedTo = (itemId: string): string[] => {
    const assignedPersons: string[] = [];
    const itemAssignments = assignments.get(itemId) || [];
    
    itemAssignments.forEach(personId => {
      const person = persons.find(p => p.id === personId);
      if (person) assignedPersons.push(person.name);
    });
    
    return assignedPersons;
  };

  const handleSave = async () => {
    // Validate person names
    const hasEmptyName = persons.some(p => !p.name.trim());
    if (hasEmptyName) {
      Alert.alert('Error', 'Semua orang harus memiliki nama');
      return;
    }

    setSaving(true);

    try {
      // Calculate totals
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const taxAmount = (subtotal * taxPercentage) / 100;
      const serviceAmount = (subtotal * servicePercentage) / 100;
      const total = subtotal + taxAmount + serviceAmount;

      // Convert assignments Map to array
      const assignmentsArray: SplitBillAssignment[] = [];
      assignments.forEach((personIds, itemId) => {
        personIds.forEach(personId => {
          assignmentsArray.push({ itemId, personId });
        });
      });

      // Save split bill
      await addSplitBill({
        title,
        items,
        persons,
        assignments: assignmentsArray,
        taxPercentage,
        servicePercentage,
        subtotal,
        total,
      });

      Alert.alert('Berhasil', 'Split bill berhasil dibuat!', [
        {
          text: 'OK',
          onPress: () => router.replace('/split-bill'),
        },
      ]);
    } catch (error) {
      console.error('Error saving split bill:', error);
      Alert.alert('Error', 'Gagal menyimpan split bill');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assign Persons</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressStep}>
          <View style={[styles.progressDot, styles.progressDotComplete]}>
            <Ionicons name="checkmark" size={16} color="#fff" />
          </View>
          <Text style={styles.progressLabel}>Items</Text>
        </View>
        <View style={[styles.progressLine, styles.progressLineComplete]} />
        <View style={styles.progressStep}>
          <View style={[styles.progressDot, styles.progressDotActive]}>
            <Text style={styles.progressDotText}>2</Text>
          </View>
          <Text style={styles.progressLabel}>Assign</Text>
        </View>
        <View style={styles.progressLine} />
        <View style={styles.progressStep}>
          <View style={styles.progressDot}>
            <Text style={styles.progressDotTextInactive}>3</Text>
          </View>
          <Text style={styles.progressLabelInactive}>Summary</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Persons */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Orang</Text>
            <TouchableOpacity onPress={addPerson} style={styles.addButton}>
              <Ionicons name="add-circle" size={20} color="#3b82f6" />
              <Text style={styles.addButtonText}>Tambah Orang</Text>
            </TouchableOpacity>
          </View>

          {persons.map((person, index) => (
            <View key={person.id} style={styles.personCard}>
              <View style={styles.personHeader}>
                <Text style={styles.personNumber}>Orang {index + 1}</Text>
                {persons.length > 2 && (
                  <TouchableOpacity onPress={() => removePerson(person.id)}>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                style={styles.input}
                value={person.name}
                onChangeText={(text) => updatePersonName(person.id, text)}
                placeholder="Nama orang"
                placeholderTextColor="#9ca3af"
              />
            </View>
          ))}
        </View>

        {/* Assignment Matrix */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Assign Items ke Orang</Text>
          <Text style={styles.sectionHint}>Tap untuk toggle assignment</Text>

          {items.map((item) => (
            <View key={item.id} style={styles.itemAssignCard}>
              <View style={styles.itemAssignHeader}>
                <Text style={styles.itemAssignName}>{item.name}</Text>
                <Text style={styles.itemAssignPrice}>
                  Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                </Text>
              </View>

              <View style={styles.personChips}>
                {persons.map((person) => {
                  const isAssigned = assignments.get(item.id)?.includes(person.id) || false;
                  return (
                    <TouchableOpacity
                      key={person.id}
                      style={[
                        styles.personChip,
                        isAssigned && styles.personChipActive,
                      ]}
                      onPress={() => toggleAssignment(item.id, person.id)}
                    >
                      <Text
                        style={[
                          styles.personChipText,
                          isAssigned && styles.personChipTextActive,
                        ]}
                      >
                        {person.name || `Orang ${persons.indexOf(person) + 1}`}
                      </Text>
                      {isAssigned && (
                        <Ionicons name="checkmark-circle" size={16} color="#fff" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <Text style={styles.saveButtonText}>Menyimpan...</Text>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Simpan Split Bill</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 32,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#fff',
  },
  progressStep: {
    alignItems: 'center',
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressDotActive: {
    backgroundColor: '#3b82f6',
  },
  progressDotComplete: {
    backgroundColor: '#10b981',
  },
  progressDotText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  progressDotTextInactive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#111827',
  },
  progressLabelInactive: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9ca3af',
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },
  progressLineComplete: {
    backgroundColor: '#10b981',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  personCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  personHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  personNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  itemAssignCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  itemAssignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemAssignName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  itemAssignPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  personChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  personChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  personChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  personChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  personChipTextActive: {
    color: '#fff',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
