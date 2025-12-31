import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Clipboard,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentUser } from '@/lib/auth';
import { apiGet, apiDelete } from '@/lib/api';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  lastUsed: string | null;
  createdAt: string;
  expiresAt: string | null;
}

export default function ApiKeysScreen() {
  const router = useRouter();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const loadApiKeys = useCallback(async () => {
    const user = await getCurrentUser();
    
    if (!user) {
      setShouldRedirect(true);
      setLoading(false);
      return;
    }

    setShouldRedirect(false);
    setLoading(true);
    try {
      const result = await apiGet<ApiKey[]>('/api/api-keys');
      
      if (result.success && result.data) {
        setApiKeys(result.data);
      } else {
        Alert.alert('Error', result.error || 'Gagal memuat API keys');
      }
    } catch (error) {
      Alert.alert('Error', 'Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadApiKeys();
    }, [loadApiKeys])
  );

  // Handle redirect after component is mounted
  useEffect(() => {
    if (shouldRedirect && !loading) {
      Alert.alert('Error', 'Anda harus login terlebih dahulu', [
        { text: 'OK', onPress: () => router.replace('/login') },
      ]);
    }
  }, [shouldRedirect, loading, router]);

  const handleDeleteApiKey = (id: string, name: string) => {
    Alert.alert(
      'Hapus API Key',
      `Yakin ingin menghapus "${name}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await apiDelete(`/api/api-keys/${id}`);
              if (result.success) {
                setApiKeys(apiKeys.filter((key) => key.id !== id));
                Alert.alert('Berhasil', 'API key berhasil dihapus');
              } else {
                Alert.alert('Error', result.error || 'Gagal menghapus API key');
              }
            } catch (error) {
              Alert.alert('Error', 'Terjadi kesalahan. Silakan coba lagi.');
            }
          },
        },
      ]
    );
  };

  const copyToClipboard = async (text: string) => {
    Clipboard.setString(text);
    Alert.alert('Berhasil', 'Disalin ke clipboard');
  };

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  const maskKey = (key: string) => {
    return `${key.substring(0, 8)}${'•'.repeat(12)}${key.substring(key.length - 4)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
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
            <Text style={styles.headerTitle}>API Keys</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/api-keys/create')}
            >
              <Ionicons name="add" size={24} color="#3b82f6" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
            </View>
          ) : apiKeys.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="key-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyText}>Belum ada API key</Text>
              <Text style={styles.emptySubtext}>
                Buat API key untuk mengakses data Anda
              </Text>
            </View>
          ) : (
            <View style={styles.keysList}>
              {apiKeys.map((apiKey) => (
                <View key={apiKey.id} style={styles.keyCard}>
                  <View style={styles.keyHeader}>
                    <View style={styles.keyInfo}>
                      <Text style={styles.keyName}>{apiKey.name}</Text>
                      <Text style={styles.keyDate}>
                        {formatDate(apiKey.createdAt)}
                        {apiKey.lastUsed && ` • ${formatDate(apiKey.lastUsed)}`}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteApiKey(apiKey.id, apiKey.name)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.keyValueContainer}>
                    <View style={styles.keyValue}>
                      <Text style={styles.keyValueText} numberOfLines={1}>
                        {visibleKeys.has(apiKey.id)
                          ? apiKey.key
                          : maskKey(apiKey.key)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => toggleKeyVisibility(apiKey.id)}
                    >
                      <Ionicons
                        name={visibleKeys.has(apiKey.id) ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#6b7280"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => copyToClipboard(apiKey.key)}
                    >
                      <Ionicons name="copy-outline" size={20} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
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
  addButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
  keysList: {
    gap: 12,
  },
  keyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  keyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  keyInfo: {
    flex: 1,
  },
  keyName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  keyDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  deleteButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#fee2e2',
  },
  keyValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  keyValue: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  keyValueText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#111827',
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
});
