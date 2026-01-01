import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { parseTransactionText } from '@/lib/ai-parser';
import { addTransaction, getCategories } from '@/lib/storage';

interface QuickAddModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function QuickAddModal({ visible, onClose, onSuccess }: QuickAddModalProps) {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!text.trim()) {
      setError('Masukkan deskripsi transaksi');
      return;
    }

    console.log('🚀 [QuickAdd] Starting transaction submission...');
    console.log('📝 [QuickAdd] Input text:', text.trim());

    // Dismiss keyboard
    Keyboard.dismiss();

    setIsProcessing(true);
    setError('');

    try {
      // Parse transaction text using local AI parser
      console.log('🔍 [QuickAdd] Parsing transaction text...');
      const parsed = parseTransactionText(text.trim());
      console.log('✅ [QuickAdd] Parsed result:', JSON.stringify(parsed, null, 2));
      
      if (!parsed) {
        console.log('❌ [QuickAdd] Parsing failed - no result');
        setError('Tidak dapat memproses transaksi. Pastikan ada nominal yang jelas.');
        setIsProcessing(false);
        return;
      }

      // Get categories to map categoryId
      console.log('📂 [QuickAdd] Fetching categories...');
      const categories = await getCategories();
      console.log('📂 [QuickAdd] Available categories:', categories.length);
      
      const category = categories.find(c => 
        c.name.toLowerCase().includes(parsed.categoryId) || 
        c.id === parsed.categoryId
      );
      console.log('🏷️ [QuickAdd] Matched category:', category?.name || 'Not found');

      // If category not found by name, find by type
      const finalCategoryId = category?.id || 
        categories.find(c => c.type === parsed.type)?.id || 
        (parsed.type === 'INCOME' ? '1' : '12'); // Default to first income/expense category
      
      console.log('🏷️ [QuickAdd] Final category ID:', finalCategoryId);

      // Prepare transaction data
      const transactionData = {
        amount: parsed.amount,
        type: parsed.type,
        date: new Date().toISOString(),
        categoryId: finalCategoryId,
        notes: parsed.notes,
      };
      console.log('💾 [QuickAdd] Transaction data to save:', JSON.stringify(transactionData, null, 2));

      // Save to local storage
      console.log('💾 [QuickAdd] Saving to AsyncStorage...');
      const savedTransaction = await addTransaction(transactionData);
      console.log('✅ [QuickAdd] Transaction saved successfully!');
      console.log('✅ [QuickAdd] Saved transaction:', JSON.stringify(savedTransaction, null, 2));

      // Show success message
      Alert.alert(
        'Berhasil!',
        `${parsed.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'} Rp ${parsed.amount.toLocaleString('id-ID')} berhasil ditambahkan`,
        [{ text: 'OK' }]
      );

      console.log('🎉 [QuickAdd] Process completed successfully!');
      setText('');
      onClose();
      if (onSuccess) {
        console.log('🔄 [QuickAdd] Calling onSuccess callback...');
        onSuccess();
      }
    } catch (err) {
      console.error('❌ [QuickAdd] Error adding transaction:', err);
      console.error('❌ [QuickAdd] Error details:', JSON.stringify(err, null, 2));
      setError('Terjadi kesalahan saat menyimpan transaksi');
    } finally {
      setIsProcessing(false);
      console.log('🏁 [QuickAdd] Process finished');
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      Keyboard.dismiss();
      setText('');
      setError('');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleClose}
              disabled={isProcessing}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={28} color="#6b7280" />
            </TouchableOpacity>
            <Text style={styles.title}>Quick Add</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView 
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Deskripsi Transaksi</Text>
              <TextInput
                style={styles.input}
                value={text}
                onChangeText={setText}
                placeholder="Contoh: Beli kopi 25 ribu"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!isProcessing}
                autoFocus
                returnKeyType="done"
                blurOnSubmit={true}
                onSubmitEditing={Keyboard.dismiss}
              />
              <Text style={styles.hint}>
                💡 Tips: Tulis nominal dan deskripsi, contoh "Makan siang 50rb" atau "Gaji 5 juta"
              </Text>
            </View>

            {/* Error */}
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={isProcessing}
            >
              <Text style={styles.cancelButtonText}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitButton,
                (!text.trim() || isProcessing) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!text.trim() || isProcessing}
            >
              {isProcessing ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.submitButtonText}>Memproses...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="add-circle" size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>Tambah Transaksi</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
    width: 40,
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  inputContainer: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    minHeight: 120,
  },
  hint: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 12,
    lineHeight: 18,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#ef4444',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: '#fff',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#a855f7',
  },
  submitButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
