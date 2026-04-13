import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Platform,
  Alert,
  Linking
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Header } from '@/components/ui/header';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { Colors, getRadius } from '@/constants/theme';
import { storage } from '@/lib/storage/storage-adapter';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ApiShortcutsScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    const key = await storage.getApiKey();
    setApiKey(key);
  };

  const handleGenerateKey = async () => {
    const newKey = await storage.generateApiKey();
    setApiKey(newKey);
    Alert.alert(t('common.success'), t('settings.widgets.generate_api'));
  };

  const handleCopyKey = async () => {
    if (apiKey) {
      await Clipboard.setStringAsync(apiKey);
      Alert.alert(t('common.success'), t('settings.widgets.copy_key'));
    }
  };

  const handleDownloadShortcut = () => {
    const shortcutUrl = 'https://www.icloud.com/shortcuts/placeholder_id';
    Linking.openURL(shortcutUrl).catch(err => {
      Alert.alert('Error', 'Could not open URL');
    });
  };

  return (
    <ScreenWrapper backgroundColor={theme.background}>
      <Header title="API & Shortcuts" />

      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        {/* API KEY SECTION */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>{t('settings.widgets.generate_api')}</Text>
          <View 
            style={[
              styles.apiCard, 
              { 
                backgroundColor: theme.card,
                borderColor: theme.border,
                borderRadius: getRadius(100, 'medium') 
              }
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.apiLabel, { color: theme.textSecondary }]}>{t('settings.widgets.api_key_desc')}</Text>
              {apiKey ? (
                <Text style={[styles.apiKeyText, { color: theme.text }]} numberOfLines={1}>{apiKey}</Text>
              ) : (
                <Text style={[styles.apiKeyPlaceholder, { color: theme.border }]}>********************************</Text>
              )}
            </View>
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: theme.tint, borderRadius: getRadius(50, 'small') }]} 
              onPress={apiKey ? handleCopyKey : handleGenerateKey}
            >
              <Feather name={apiKey ? "copy" : "refresh-cw"} size={18} color="#fff" />
            </TouchableOpacity>
          </View>
          {apiKey && (
            <TouchableOpacity style={{ marginTop: 12, alignSelf: 'flex-end' }} onPress={handleGenerateKey}>
              <Text style={{ color: theme.tint, fontSize: 13, fontWeight: '600' }}>{t('settings.widgets.generate_api')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* IOS SHORTCUT SECTION */}
        <View style={[styles.section, { marginTop: 32 }]}>
          <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>PINTASAN SIRI (SHORTCUTS)</Text>
          <TouchableOpacity 
            onPress={handleDownloadShortcut}
            style={[
              styles.card, 
              { 
                backgroundColor: '#5856D6',
                borderColor: '#5856D6',
                borderRadius: getRadius(100, 'medium') 
              }
            ]}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: getRadius(48, 'small') }]}>
              <Feather name="download" size={20} color="#fff" />
            </View>
            <View style={styles.textDetails}>
              <Text style={[styles.title, { color: '#fff' }]}>{t('settings.widgets.download_shortcut')}</Text>
              <Text style={[styles.commandText, { color: 'rgba(255,255,255,0.8)' }]}>{t('settings.widgets.shortcut_desc')}</Text>
            </View>
            <Feather name="external-link" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            {t('settings.local_data_notice')}
          </Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 20, paddingBottom: 60 },
  section: {},
  sectionHeader: { fontSize: 12, fontWeight: '800', marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
  },
  apiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
    gap: 12,
  },
  iconBox: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textDetails: { flex: 1, marginLeft: 16 },
  title: { fontSize: 16, fontWeight: '700' },
  commandText: { fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  apiLabel: { fontSize: 11, marginBottom: 8 },
  apiKeyText: { fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  apiKeyPlaceholder: { fontSize: 14, letterSpacing: 2 },
  actionBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  footer: { marginTop: 40, alignItems: 'center' },
  footerText: { fontSize: 12, textAlign: 'center' },
});
