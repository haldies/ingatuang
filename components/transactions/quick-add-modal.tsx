import React, { useState, useEffect } from 'react';
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
import { Colors } from '@/constants/theme';
import { parseTransactionText } from '@/lib/ai/ai-parser';
import { storage } from '@/lib/storage/storage-adapter';
import { AIConsentDialog } from './ai-consent-dialog';
import { hasShownAIConsent, saveAIConsent } from '@/lib/ai/ai-consent';
import { CustomAlert } from '../ui/custom-alert';

interface QuickAddModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function QuickAddModal({ visible, onClose, onSuccess }: QuickAddModalProps) {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info'
  });

  // Check if we need to show consent dialog
  useEffect(() => {
    const checkConsent = async () => {
      if (visible) {
        const hasShown = await hasShownAIConsent();
        if (!hasShown) {
          setShowConsentDialog(true);
        }
      }
    };
    checkConsent();
  }, [visible]);

  const handleConsentAccept = async () => {
    await saveAIConsent(true);
    setShowConsentDialog(false);
  };

  const handleConsentDecline = async () => {
    await saveAIConsent(false);
    setShowConsentDialog(false);
  };

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
      const categories = await storage.getCategories();
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

      // Get selected wallet
      const selectedWalletId = await storage.getSelectedWalletId();
      const finalWalletId = selectedWalletId === 'all' ? 'default' : selectedWalletId;
      console.log('👛 [QuickAdd] Use wallet ID:', finalWalletId);

      // Prepare transaction data
      const transactionData = {
        amount: parsed.amount,
        type: parsed.type,
        date: new Date().toISOString(),
        categoryId: finalCategoryId,
        walletId: finalWalletId,
        notes: parsed.notes,
      };
      console.log('💾 [QuickAdd] Transaction data to save:', JSON.stringify(transactionData, null, 2));

      // Save to local storage
      console.log('💾 [QuickAdd] Saving to AsyncStorage...');
      const savedTransaction = await storage.addTransaction(transactionData);
      console.log('✅ [QuickAdd] Transaction saved successfully!');
      console.log('✅ [QuickAdd] Saved transaction:', JSON.stringify(savedTransaction, null, 2));

      // Show success message
      setAlertConfig({
        visible: true,
        title: 'Transaksi Berhasil',
        message: `${parsed.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'} senilai Rp ${parsed.amount.toLocaleString('id-ID')} telah ditambahkan`,
        type: 'success'
      });

      console.log('🎉 [QuickAdd] Process completed successfully!');
      setText('');
      // onClose will be called from the alert's button or handleClose
    } catch (err) {
      console.error('❌ [QuickAdd] Error adding transaction:', err);
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
    <>
      <AIConsentDialog
        visible={showConsentDialog}
        onAccept={handleConsentAccept}
        onDecline={handleConsentDecline}
      />
      
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={() => {
          setAlertConfig(prev => ({ ...prev, visible: false }));
          if (alertConfig.type === 'success') {
            onClose();
            if (onSuccess) onSuccess();
          }
        }}
      />
      <Modal
        visible={visible && !showConsentDialog}
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
                Tulis nominal dan deskripsi, contoh "Makan siang 50rb" atau "Gaji 5 juta"
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
                <Text style={styles.submitButtonText}>Tambah Transaksi</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
    </>
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
    gap: 12,
    backgroundColor: '#fff1f2',
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#e11d48',
    fontWeight: '500',
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
    backgroundColor: Colors.light.tint,
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
