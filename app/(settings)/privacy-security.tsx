import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { getAIConsent, saveAIConsent } from '@/lib/ai/ai-consent';
import { CustomAlert } from '@/components/ui/custom-alert';
import { useCallback } from 'react';

export default function PrivacySecurityScreen() {
  const [aiConsentEnabled, setAiConsentEnabled] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    buttons?: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>;
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

  // Load AI consent status
  useEffect(() => {
    loadAIConsent();
  }, []);

  // Reload consent when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadAIConsent();
    }, [])
  );

  const loadAIConsent = async () => {
    console.log('🔍 [Privacy] Loading AI consent...');
    const consent = await getAIConsent();
    console.log('🔍 [Privacy] Consent data:', consent);
    setAiConsentEnabled(consent?.hasAccepted ?? false);
    console.log('🔍 [Privacy] Toggle set to:', consent?.hasAccepted ?? false);
  };

  const handleToggleAIConsent = async (value: boolean) => {
    try {
      await saveAIConsent(value);
      setAiConsentEnabled(value);
      showAlert({
        title: 'Berhasil',
        message: value 
          ? 'Anda telah menyetujui penggunaan data untuk peningkatan AI'
          : 'Anda telah menolak penggunaan data untuk peningkatan AI',
        type: 'success',
      });
    } catch (error) {
      console.error('Error toggling AI consent:', error);
      showAlert({
        title: 'Error',
        message: 'Gagal mengubah pengaturan',
        type: 'error',
      });
    }
  };

  const handleComingSoon = (feature: string) => {
    showAlert({
      title: 'Segera Hadir',
      message: `Fitur ${feature} akan segera tersedia`,
      type: 'info',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy & Security</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Data Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATA PRIVACY</Text>
          <View style={styles.card}>
            <View style={styles.infoItem}>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Data Lokal</Text>
                <Text style={styles.infoDescription}>
                  Semua data transaksi Anda disimpan secara lokal di perangkat Anda
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoItem}>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Tidak Ada Sinkronisasi Cloud</Text>
                <Text style={styles.infoDescription}>
                  Data Anda tidak dikirim ke server atau cloud manapun
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoItem}>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Privasi Terjamin</Text>
                <Text style={styles.infoDescription}>
                  Hanya Anda yang memiliki akses ke data keuangan Anda
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* AI & Machine Learning Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI & MACHINE LEARNING</Text>
          <View style={styles.card}>
            {/* AI Training Consent */}
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>AI Training Data</Text>
                  <Text style={styles.settingDescription}>
                    Izinkan penggunaan data anonim untuk meningkatkan akurasi AI
                  </Text>
                </View>
              </View>
              <Switch
                value={aiConsentEnabled}
                onValueChange={handleToggleAIConsent}
                trackColor={{ false: '#d1d5db', true: '#c084fc' }}
                thumbColor={aiConsentEnabled ? '#a855f7' : '#f3f4f6'}
              />
            </View>

            <View style={styles.divider} />

            {/* AI Info */}
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxText}>
                Data yang digunakan untuk training AI akan dianonimkan dan tidak mengandung informasi pribadi Anda. Fitur ini membantu meningkatkan deteksi kategori dan parsing transaksi.
              </Text>
            </View>
          </View>
        </View>

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Kami berkomitmen untuk melindungi privasi dan keamanan data Anda
          </Text>
        </View>
      </ScrollView>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setAlertVisible(false)}
      />
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    gap: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
    marginRight: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  infoBoxText: {
    flex: 1,
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 18,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 24,
    marginTop: 16,
  },
  footerText: {
    flex: 1,
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
});
