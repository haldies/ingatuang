import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { Header } from '@/components/ui/header';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { getAIConsent, saveAIConsent } from '@/lib/ai/ai-consent';
import { CustomAlert } from '@/components/ui/custom-alert';
import { useFocusEffect } from 'expo-router';

export default function PrivacySecurityScreen() {
  const [aiConsentEnabled, setAiConsentEnabled] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>;
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

  const loadAIConsent = useCallback(async () => {
    const consent = await getAIConsent();
    setAiConsentEnabled(consent?.hasAccepted ?? false);
  }, []);

  useEffect(() => {
    loadAIConsent();
  }, [loadAIConsent]);

  useFocusEffect(
    useCallback(() => {
      loadAIConsent();
    }, [loadAIConsent])
  );

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
    }
  };

  return (
    <ScreenWrapper backgroundColor="#f9fafb">
      <Header title="Privacy & Security" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* DATA PRIVACY */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATA PRIVACY</Text>
          <View style={styles.card}>
            <View style={styles.infoItem}>
              <Text style={styles.infoTitle}>Data Lokal</Text>
              <Text style={styles.infoDescription}>
                Semua data transaksi Anda disimpan secara lokal di perangkat Anda.
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoTitle}>Tidak Ada Cloud</Text>
              <Text style={styles.infoDescription}>
                Data Anda tidak dikirim ke server atau cloud manapun.
              </Text>
            </View>
          </View>
        </View>

        {/* AI & MACHINE LEARNING */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI & MACHINE LEARNING</Text>
          <View style={styles.card}>
            <View style={styles.settingItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>AI Training Data</Text>
                <Text style={styles.infoDescription}>
                  Izinkan penggunaan data anonim untuk meningkatkan akurasi AI.
                </Text>
              </View>
              <Switch
                value={aiConsentEnabled}
                onValueChange={handleToggleAIConsent}
                trackColor={{ false: '#d1d5db', true: '#c084fc' }}
                thumbColor={aiConsentEnabled ? '#a855f7' : '#f3f4f6'}
              />
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxText}>
                Data yang digunakan untuk training AI akan dianonimkan dan tidak mengandung informasi pribadi Anda.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Kami berkomitmen untuk melindungi privasi dan keamanan data Anda.
          </Text>
        </View>
      </ScrollView>

      <CustomAlert visible={alertVisible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} buttons={alertConfig.buttons} onClose={() => setAlertVisible(false)} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 11, fontWeight: '600', color: '#6b7280', letterSpacing: 0.5, paddingHorizontal: 20, marginBottom: 8 },
  card: { backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 16, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  infoItem: { padding: 16 },
  infoTitle: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 4 },
  infoDescription: { fontSize: 13, color: '#6b7280', lineHeight: 18 },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginHorizontal: 16 },
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  infoBox: { padding: 16, backgroundColor: '#f9fafb' },
  infoBoxText: { fontSize: 12, color: '#6b7280', lineHeight: 18 },
  footer: { padding: 40, alignItems: 'center' },
  footerText: { fontSize: 13, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
});
