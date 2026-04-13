import { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Linking, 
  Platform, 
  Modal, 
  Pressable,
  useColorScheme as useNativeColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { storage } from '@/lib/storage/storage-adapter';
import { router } from 'expo-router';
import { sendLocalNotification } from '@/lib/utils/notifications';
import { CustomAlert } from '@/components/ui/custom-alert';
import { resetAIConsent } from '@/lib/ai/ai-consent';
import { useTranslation } from 'react-i18next';
import i18n, { LANGUAGE_KEY } from '@/lib/utils/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateGlobalCurrency } from '@/lib/utils/format';
import { Header } from '@/components/ui/header';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import WidgetMenuItem from '@/components/settings/WidgetMenuItem';
import { Colors, getRadius } from '@/constants/theme';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const colorScheme = useNativeColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  
  // Sheet State
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetType, setSheetType] = useState<'language' | 'currency' | null>(null);
  const [currentCurrency, setCurrentCurrency] = useState('IDR');

  // Alert State
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

  useEffect(() => {
    const loadCurrency = async () => {
      const curr = await storage.getCurrency();
      setCurrentCurrency(curr);
    };
    loadCurrency();
  }, []);

  const showAlert = (config: typeof alertConfig) => {
    setAlertConfig(config);
    setAlertVisible(true);
  };

  const handleSeedData = async () => {
    try {
      await storage.seedSampleData();
      showAlert({
        title: 'Berhasil',
        message: 'Sample data berhasil ditambahkan!',
        type: 'success',
        buttons: [{ text: 'OK', onPress: () => router.push('/(tabs)') }],
      });
    } catch (err) {
      showAlert({ title: 'Error', message: 'Gagal menambahkan sample data', type: 'error' });
    }
  };

  const handleClearData = () => {
    showAlert({
      title: 'Hapus Semua Data',
      message: 'Apakah Anda yakin ingin menghapus semua data?\n\nData tidak dapat dikembalikan!',
      type: 'warning',
      buttons: [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await storage.clearAllData();
              await resetAIConsent();
              showAlert({ title: 'Berhasil', message: 'Semua data dihapus!', type: 'success' });
            } catch (err) {
              showAlert({ title: 'Error', message: 'Gagal menghapus data', type: 'error' });
            }
          },
        },
      ],
    });
  };

  const handleTestNotification = async () => {
    try {
      await sendLocalNotification('Test', 'Berhasil!');
      showAlert({ title: 'Sukses', message: 'Notifikasi terkirim', type: 'success' });
    } catch (err) {
      showAlert({ title: 'Error', message: 'Gagal kirim notifikasi', type: 'error' });
    }
  };

  const openSheet = (type: 'language' | 'currency') => {
    setSheetType(type);
    setSheetVisible(true);
  };

  const handleSelectLanguage = async (code: string) => {
    await AsyncStorage.setItem(LANGUAGE_KEY, code);
    await i18n.changeLanguage(code);
    setSheetVisible(false);
  };

  const handleSelectCurrency = async (code: string) => {
    await storage.setCurrency(code);
    updateGlobalCurrency(code);
    setCurrentCurrency(code);
    setSheetVisible(false);
  };

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  ];

  const currencies = [
    { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  ];

  return (
    <ScreenWrapper backgroundColor={theme.background}>
      <Header title={t('settings.header')} hideBack />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* PREMIUM BANNER */}
        <TouchableOpacity 
          style={[
            styles.premiumBanner, 
            { 
              backgroundColor: isDark ? '#171717' : '#0f172a',
              borderColor: isDark ? '#262626' : 'transparent',
              borderWidth: isDark ? 1 : 0,
              borderRadius: getRadius(80) 
            }
          ]} 
          onPress={() => router.push('/premium')} 
          activeOpacity={0.9}
        >
          <View style={styles.premiumTextContainer}>
            <View style={[styles.proBadge, { backgroundColor: theme.tint, borderRadius: getRadius(22) }]}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
            <View>
              <Text style={styles.proTitle}>IngatUang PRO</Text>
            </View>
          </View>
          <View style={[styles.upgradeBtn, { borderRadius: getRadius(40, 'small') }]}>
            <Feather name="chevron-right" size={20} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* MENU GROUP 1: PREFERENCES */}
        <View style={styles.menuContainer}>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: isDark ? '#171717' : '#f8fafc' }]} onPress={() => openSheet('language')}>
            <Feather name="globe" size={18} color={isDark ? '#94a3b8' : '#374151'} />
            <Text style={[styles.menuTitle, { color: theme.text }]}>{t('settings.language')}</Text>
            <View style={styles.badgeContainer}>
              <Text style={[styles.badgeText, { backgroundColor: isDark ? '#171717' : '#f1f5f9' }]}>{i18n.language === 'id' ? 'ID' : 'EN'}</Text>
              <Feather name="chevron-right" size={14} color="#9ca3af" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: isDark ? '#171717' : '#f8fafc' }]} onPress={() => openSheet('currency')}>
            <Feather name="dollar-sign" size={18} color={isDark ? '#94a3b8' : '#374151'} />
            <Text style={[styles.menuTitle, { color: theme.text }]}>{t('settings.currency')}</Text>
            <View style={styles.badgeContainer}>
              <Text style={[styles.badgeText, { backgroundColor: isDark ? '#171717' : '#f1f5f9' }]}>{currentCurrency}</Text>
              <Feather name="chevron-right" size={14} color="#9ca3af" />
            </View>
          </TouchableOpacity>

          <WidgetMenuItem />

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: isDark ? '#171717' : '#f8fafc' }]} onPress={() => router.push('/(settings)/subscriptions')}>
            <Feather name="calendar" size={18} color={isDark ? '#94a3b8' : '#374151'} />
            <Text style={[styles.menuTitle, { color: theme.text, flex: 1 }]}>Kelola Langganan</Text>
            <Feather name="chevron-right" size={18} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: isDark ? '#171717' : '#f8fafc' }]} onPress={() => router.push('/(settings)/privacy-security')}>
            <Feather name="lock" size={18} color={isDark ? '#94a3b8' : '#374151'} />
            <Text style={[styles.menuTitle, { color: theme.text, flex: 1 }]}>Privasi & Keamanan</Text>
            <Feather name="chevron-right" size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* MENU GROUP 2: DEV TOOLS */}
        <View style={[styles.devSection, { borderTopColor: isDark ? '#171717' : '#f8fafc' }]}>
          <Text style={styles.sectionTitle}>{t('settings.dev_tools')}</Text>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={[styles.menuItem, { borderBottomColor: isDark ? '#171717' : '#f8fafc' }]} onPress={handleTestNotification}>
              <Feather name="bell" size={18} color={isDark ? '#94a3b8' : '#374151'} />
              <Text style={[styles.menuTitle, { color: theme.text, flex: 1 }]}>{t('settings.test_notification')}</Text>
              <Feather name="chevron-right" size={18} color="#9ca3af" />
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.menuItem, { borderBottomColor: isDark ? '#171717' : '#f8fafc' }]} onPress={handleSeedData}>
              <Feather name="database" size={18} color={isDark ? '#94a3b8' : '#374151'} />
              <Text style={[styles.menuTitle, { color: theme.text, flex: 1 }]}>{t('settings.add_sample')}</Text>
              <Feather name="chevron-right" size={18} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, { borderBottomColor: isDark ? '#171717' : '#f8fafc' }]} onPress={handleClearData}>
              <Feather name="trash-2" size={18} color="#ef4444" />
              <Text style={[styles.menuTitle, { color: '#ef4444', flex: 1 }]}>{t('settings.clear_data')}</Text>
              <Feather name="chevron-right" size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>{t('settings.version')} 1.0.0</Text>
        </View>
      </ScrollView>

      {/* MODERN BOTTOM SHEET MODAL */}
      <Modal 
        visible={sheetVisible} 
        transparent 
        animationType="fade" 
        onRequestClose={() => setSheetVisible(false)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setSheetVisible(false)}>
          <View style={[styles.sheetContent, { backgroundColor: theme.background, borderTopLeftRadius: getRadius(320, 'large'), borderTopRightRadius: getRadius(320, 'large') }]}>
            <View style={styles.sheetHeader}>
              <View style={[styles.sheetHandle, { backgroundColor: isDark ? '#262626' : '#e2e8f0' }]} />
              <Text style={[styles.sheetTitle, { color: theme.text }]}>
                {sheetType === 'language' ? t('settings.select_language') : t('settings.select_currency')}
              </Text>
            </View>

            <ScrollView bounces={false} style={styles.sheetList}>
              {sheetType === 'language' ? (
                languages.map((lang) => (
                  <TouchableOpacity 
                    key={lang.code} 
                    style={[styles.sheetItem, { borderBottomColor: isDark ? '#171717' : '#f8fafc' }]} 
                    onPress={() => handleSelectLanguage(lang.code)}
                  >
                    <Text style={styles.sheetEmoji}>{lang.flag}</Text>
                    <Text style={[styles.sheetItemText, { color: theme.text }, i18n.language === lang.code && styles.sheetItemActive]}>
                      {lang.name}
                    </Text>
                    {i18n.language === lang.code && <Ionicons name="checkmark-circle" size={20} color={theme.tint} />}
                  </TouchableOpacity>
                ))
              ) : (
                currencies.map((curr) => (
                  <TouchableOpacity 
                    key={curr.code} 
                    style={[styles.sheetItem, { borderBottomColor: isDark ? '#171717' : '#f8fafc' }]} 
                    onPress={() => handleSelectCurrency(curr.code)}
                  >
                    <View style={[styles.currencyIcon, { backgroundColor: isDark ? '#171717' : '#f1f5f9', borderRadius: getRadius(120, 'small') }]}>
                      <Text style={[styles.currencySymbol, { color: theme.text }]}>{curr.symbol}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sheetItemText, { color: theme.text }, currentCurrency === curr.code && styles.sheetItemActive]}>
                        {curr.code}
                      </Text>
                      <Text style={styles.currencyName}>{curr.name}</Text>
                    </View>
                    {currentCurrency === curr.code && <Ionicons name="checkmark-circle" size={20} color={theme.tint} />}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setAlertVisible(false)}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  premiumBanner: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  premiumTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  proBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  proBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  proTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  proSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  upgradeBtn: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContainer: {
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    gap: 16,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  devSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#94a3b8',
    letterSpacing: 1.5,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  versionContainer: {
    padding: 40,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 13,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '80%',
  },
  sheetHeader: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  sheetList: {
    paddingHorizontal: 20,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    gap: 16,
  },
  sheetEmoji: {
    fontSize: 24,
  },
  sheetItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  sheetItemActive: {
    fontWeight: '800',
  },
  currencyIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '800',
  },
  currencyName: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
});
