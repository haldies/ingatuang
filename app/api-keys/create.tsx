import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiPost } from '@/lib/api';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
}

export default function CreateApiKeyScreen() {
  const router = useRouter();
  const [keyName, setKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!keyName.trim()) {
      Alert.alert('Error', 'Nama API key harus diisi');
      return;
    }

    setCreating(true);
    try {
      const result = await apiPost<ApiKey>('/api/api-keys', {
        name: keyName.trim(),
      });

      if (result.success && result.data) {
        setCreatedKey(result.data.key);
      } else {
        Alert.alert('Error', result.error || 'Gagal membuat API key');
      }
    } catch (error) {
      Alert.alert('Error', 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    Clipboard.setString(text);
    Alert.alert('Berhasil', 'Disalin ke clipboard');
  };

  const handleDone = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {createdKey ? 'API Key Dibuat' : 'Buat API Key'}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            {createdKey ? (
              // Success State
              <View style={styles.successContainer}>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark-circle" size={64} color="#16a34a" />
                </View>

                <Text style={styles.successTitle}>API Key Berhasil Dibuat!</Text>
                <Text style={styles.successSubtitle}>
                  Simpan key ini dengan aman. Key hanya ditampilkan sekali.
                </Text>

                <View style={styles.alertBox}>
                  <Ionicons name="alert-circle" size={20} color="#16a34a" />
                  <Text style={styles.alertText}>
                    Pastikan Anda menyimpan key ini sebelum menutup halaman
                  </Text>
                </View>

                <View style={styles.keyContainer}>
                  <Text style={styles.label}>API Key</Text>
                  <View style={styles.keyDisplay}>
                    <Text style={styles.keyText} selectable>
                      {createdKey}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() => copyToClipboard(createdKey)}
                  >
                    <Ionicons name="copy-outline" size={20} color="#3b82f6" />
                    <Text style={styles.copyButtonText}>Salin ke Clipboard</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={handleDone}
                >
                  <Text style={styles.doneButtonText}>Selesai</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Create Form
              <View style={styles.formContainer}>
                <View style={styles.iconContainer}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="key" size={32} color="#3b82f6" />
                  </View>
                </View>

                <Text style={styles.formTitle}>Buat API Key Baru</Text>
                <Text style={styles.formSubtitle}>
                  API key digunakan untuk mengakses data Anda dari aplikasi lain
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nama API Key</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Contoh: Mobile App, MCP Server"
                    value={keyName}
                    onChangeText={setKeyName}
                    autoFocus
                    editable={!creating}
                  />
                  <Text style={styles.hint}>
                    Beri nama yang mudah diingat untuk API key ini
                  </Text>
                </View>

                <View style={styles.infoBox}>
                  <Ionicons name="information-circle" size={20} color="#3b82f6" />
                  <Text style={styles.infoText}>
                    API key akan ditampilkan hanya sekali setelah dibuat
                  </Text>
                </View>

                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => router.back()}
                    disabled={creating}
                  >
                    <Text style={styles.cancelButtonText}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.createButton, creating && styles.createButtonDisabled]}
                    onPress={handleCreate}
                    disabled={creating}
                  >
                    <Text style={styles.createButtonText}>
                      {creating ? 'Membuat...' : 'Buat API Key'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    padding: 16,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  hint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 6,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  createButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  successContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  successIcon: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#dcfce7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    color: '#166534',
  },
  keyContainer: {
    marginBottom: 24,
  },
  keyDisplay: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  keyText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#111827',
    lineHeight: 18,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
  },
  copyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3b82f6',
  },
  doneButton: {
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
