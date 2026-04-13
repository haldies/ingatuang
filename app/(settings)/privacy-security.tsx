import { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Switch, 
} from 'react-native';
import { Header } from '@/components/ui/header';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { getAIConsent, saveAIConsent } from '@/lib/ai/ai-consent';
import { CustomAlert } from '@/components/ui/custom-alert';
import { useFocusEffect } from 'expo-router';
import { Colors, getRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function PrivacySecurityScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

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
    <ScreenWrapper backgroundColor={theme.background}>
      <Header title="Privacy & Security" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* DATA PRIVACY */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATA PRIVACY</Text>
          <View style={[
            styles.card, 
            { 
              backgroundColor: theme.card,
              borderColor: theme.border,
              borderWidth: 1,
              borderRadius: getRadius(160) 
            }
          ]}>
            <View style={styles.infoItem}>
              <Text style={[styles.infoTitle, { color: theme.text }]}>Data Lokal</Text>
              <Text style={[styles.infoDescription, { color: theme.textSecondary }]}>
                Semua data transaksi Anda disimpan secara lokal di perangkat Anda.
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.infoItem}>
              <Text style={[styles.infoTitle, { color: theme.text }]}>Tidak Ada Cloud</Text>
              <Text style={[styles.infoDescription, { color: theme.textSecondary }]}>
                Data Anda tidak dikirim ke server atau cloud manapun.
              </Text>
            </View>
          </View>
        </View>

        {/* AI & MACHINE LEARNING */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI & MACHINE LEARNING</Text>
          <View style={[
            styles.card, 
            { 
              backgroundColor: theme.card,
              borderColor: theme.border,
              borderWidth: 1,
              borderRadius: getRadius(160) 
            }
          ]}>
            <View style={styles.settingItem}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoTitle, { color: theme.text }]}>AI Training Data</Text>
                <Text style={[styles.infoDescription, { color: theme.textSecondary }]}>
                  Izinkan penggunaan data anonim untuk meningkatkan akurasi AI.
                </Text>
              </View>
              <Switch
                value={aiConsentEnabled}
                onValueChange={handleToggleAIConsent}
                trackColor={{ false: theme.border, true: theme.tint + '80' }}
                thumbColor={aiConsentEnabled ? theme.tint : (isDark ? '#404040' : '#f3f4f6')}
              />
            </View>
            <View style={[styles.infoBox, { backgroundColor: isDark ? theme.background : '#f9fafb' }]}>
              <Text style={[styles.infoBoxText, { color: theme.textSecondary }]}>
                Data yang digunakan untuk training AI akan dianonimkan dan tidak mengandung informasi pribadi Anda.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
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
  sectionTitle: { 
    fontSize: 11, 
    fontWeight: '900', 
    color: '#94a3b8', 
    letterSpacing: 1.5, 
    paddingHorizontal: 20, 
    marginBottom: 8 
  },
  card: { marginHorizontal: 20, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  infoItem: { padding: 16 },
  infoTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  infoDescription: { fontSize: 13, lineHeight: 18 },
  divider: { height: 1, marginHorizontal: 16 },
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  infoBox: { padding: 16 },
  infoBoxText: { fontSize: 12, lineHeight: 18 },
  footer: { padding: 40, alignItems: 'center' },
  footerText: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
