import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Platform,
  Alert,
  Linking,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Header } from '@/components/ui/header';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { Colors, getRadius } from '@/constants/theme';
import { storage } from '@/lib/storage/storage-adapter';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiClient } from '@/lib/api/api-client';

export default function ApiShortcutsScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const [apiKey, setApiKey] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const key = await storage.getApiKey();
    const url = await storage.getApiBaseUrl();
    if (key) setApiKey(key);
    if (url) setApiUrl(url);
  };

  const handleSaveSettings = async () => {
    try {
      if (apiKey) {
        await storage.saveApiKey(apiKey);
      }
      if (apiUrl) {
        await storage.saveApiBaseUrl(apiUrl);
      }
      Alert.alert(t('common.success'), t('settings.api.save_success'));
    } catch (error) {
      Alert.alert(t('common.failed'), 'Failed to save settings');
    }
  };

  const handleTestConnection = async () => {
    if (!apiKey) {
      Alert.alert(t('common.failed'), 'Please enter an API Key first');
      return;
    }

    setIsTesting(true);
    setIsConnected(null);

    // Temporarily save to test with the current inputs
    try {
      await storage.saveApiKey(apiKey);
      if (apiUrl) await storage.saveApiBaseUrl(apiUrl);
      
      const success = await apiClient.testConnection();
      setIsConnected(success);
      
      if (success) {
        Alert.alert('Connected!', 'Communication with the server is working properly.');
      } else {
        Alert.alert('Connection Failed', 'Could not reach the server. Please check your API Key and URL.');
      }
    } catch (error) {
      setIsConnected(false);
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsTesting(false);
    }
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

  const handleOpenWebDashboard = () => {
    Linking.openURL('https://ingatuang.vercel.app/profile').catch(err => {
      Alert.alert('Error', 'Could not open URL');
    });
  };

  return (
    <ScreenWrapper backgroundColor={theme.background}>
      <Header title={t('settings.api.header')} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
          {/* CONNECTION STATUS */}
          <View style={[
            styles.statusBanner, 
            { 
              backgroundColor: isConnected === true ? '#10b981' : isConnected === false ? '#ef4444' : theme.card,
              borderRadius: getRadius(100, 'medium')
            }
          ]}>
            <Feather 
              name={isConnected === true ? "check-circle" : isConnected === false ? "x-circle" : "cloud-off"} 
              size={20} 
              color={isConnected === null ? theme.textSecondary : "#fff"} 
            />
            <Text style={[
              styles.statusText, 
              { color: isConnected === null ? theme.text : "#fff" }
            ]}>
              {isConnected === true ? t('settings.api.status_connected') : isConnected === false ? t('settings.api.status_failed') : t('settings.api.status_disconnected')}
            </Text>
          </View>

          {/* API CONFIG SECTION */}
          <View style={styles.section}>
            <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>{t('settings.api.config_title')}</Text>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>{t('settings.api.server_url')}</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: theme.card, 
                    borderColor: theme.border, 
                    color: theme.text,
                    borderRadius: getRadius(56, 'small')
                  }
                ]}
                value={apiUrl}
                onChangeText={setApiUrl}
                placeholder="https://ingatuang.vercel.app/api/v1/mobile"
                placeholderTextColor={theme.border}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>{t('settings.api.api_key')}</Text>
              <View style={styles.apiKeyInputContainer}>
                <TextInput
                  style={[
                    styles.input, 
                    { 
                      flex: 1,
                      backgroundColor: theme.card, 
                      borderColor: theme.border, 
                      color: theme.text,
                      borderRadius: getRadius(56, 'small')
                    }
                  ]}
                  value={apiKey}
                  onChangeText={setApiKey}
                  placeholder="Masukkan API Key dari web"
                  placeholderTextColor={theme.border}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                  style={[styles.miniBtn, { backgroundColor: theme.card, borderColor: theme.border }]} 
                  onPress={handleCopyKey}
                >
                  <Feather name="copy" size={16} color={theme.text} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={handleOpenWebDashboard} style={{ marginTop: 8 }}>
                <Text style={{ color: theme.tint, fontSize: 12, fontWeight: '600' }}>
                  {t('settings.api.get_key_web')}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[
                  styles.testBtn, 
                  { 
                    borderColor: theme.tint, 
                    borderWidth: 1.5,
                    borderRadius: getRadius(56, 'small') 
                  }
                ]} 
                onPress={handleTestConnection}
                disabled={isTesting}
              >
                {isTesting ? (
                  <ActivityIndicator size="small" color={theme.tint} />
                ) : (
                  <>
                    <Feather name="zap" size={16} color={theme.tint} style={{ marginRight: 8 }} />
                    <Text style={[styles.testBtnText, { color: theme.tint }]}>{t('settings.api.test_connection')}</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.saveBtn, 
                  { 
                    backgroundColor: theme.tint,
                    borderRadius: getRadius(56, 'small') 
                  }
                ]} 
                onPress={handleSaveSettings}
              >
                <Text style={styles.saveBtnText}>{t('settings.api.save_settings')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* IOS SHORTCUT SECTION */}
          <View style={[styles.section, { marginTop: 32 }]}>
            <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>PINTASAN SIRI (SHORTCUTS)</Text>
            <TouchableOpacity 
              onPress={handleDownloadShortcut}
              style={[
                styles.shortcutCard, 
                { 
                  backgroundColor: '#5856D6',
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
              {t('settings.api.api_usage_info')}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 20, paddingBottom: 60 },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: { 
    fontSize: 12, 
    fontWeight: '800', 
    marginBottom: 16, 
    letterSpacing: 1, 
    textTransform: 'uppercase' 
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  apiKeyInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  miniBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  testBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  saveBtn: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  shortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
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
  footer: { marginTop: 40, alignItems: 'center' },
  footerText: { fontSize: 12, textAlign: 'center', lineHeight: 18, paddingHorizontal: 20 },
});
