import { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, Platform, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

export default function ProfileScreen() {
  const { t } = useTranslation();
  
  // Sheet State
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetType, setSheetType] = useState<'language' | 'currency' | null>(null);
  const [currentCurrency, setCurrentCurrency] = useState('IDR');

  // Alert State (still used for critical errors/confirmations)
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
      showAlert({
        title: 'Error',
        message: 'Gagal menambahkan sample data',
        type: 'error',
      });
      console.error('Error seeding data:', err);
    }
  };

  const handleClearData = () => {
    showAlert({
      title: 'Hapus Semua Data',
      message: 'Apakah Anda yakin ingin menghapus semua data? Ini akan menghapus:\n\n• Semua transaksi\n• Semua kategori\n• Semua subscription\n• Semua split bills\n• Preferensi AI consent\n\nData tidak dapat dikembalikan!',
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
              showAlert({
                title: 'Berhasil',
                message: 'Semua data berhasil dihapus! Dialog AI consent akan muncul lagi saat Anda menggunakan Quick Add.',
                type: 'success',
                buttons: [{ text: 'OK', onPress: () => router.push('/(tabs)') }],
              });
            } catch (err) {
              showAlert({
                title: 'Error',
                message: 'Gagal menghapus data',
                type: 'error',
              });
              console.error('Error clearing data:', err);
            }
          },
        },
      ],
    });
  };

  const handleReportBug = () => {
    Linking.openURL('mailto:support@ingatuang.com?subject=Bug Report - IngatUang Mobile&body=Deskripsi Bug:%0D%0A%0D%0ALangkah untuk Reproduksi:%0D%0A1. %0D%0A2. %0D%0A3. %0D%0A%0D%0AHasil yang Diharapkan:%0D%0A%0D%0AHasil Aktual:%0D%0A');
  };

  const handleGiveFeedback = () => {
    Linking.openURL('mailto:feedback@ingatuang.com?subject=Feedback - IngatUang Mobile&body=Feedback:%0D%0A%0D%0A');
  };

  const handleRateApp = async () => {
    const playStoreUrl = 'market://details?id=com.ingatuang.app';
    const playStoreWebUrl = 'https://play.google.com/store/apps/details?id=com.ingatuang.app';
    const appStoreUrl = 'itms-apps://itunes.apple.com/app/id64748b';
    const appStoreWebUrl = 'https://apps.apple.com/app/id64748b';

    const url = Platform.OS === 'ios' ? appStoreUrl : playStoreUrl;
    const webUrl = Platform.OS === 'ios' ? appStoreWebUrl : playStoreWebUrl;
    
    try {
      if (await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      showAlert({
        title: 'Error',
        message: `Tidak dapat membuka ${Platform.OS === 'ios' ? 'App Store' : 'Play Store'}`,
        type: 'error',
      });
    }
  };

  const handleTestNotification = async () => {
    try {
      const result = await sendLocalNotification(
        'Test Notifikasi',
        'Ini adalah test notifikasi dari Ingat Uang!',
        { test: true, timestamp: Date.now() }
      );
      showAlert({
        title: 'Test Notifikasi',
        message: result 
          ? `Notifikasi berhasil dikirim! ID: ${result}\n\nCek notification tray di HP kamu.`
          : 'Notifikasi gagal dikirim.',
        type: result ? 'success' : 'error',
      });
    } catch (error) {
      showAlert({
        title: 'Error',
        message: `Gagal mengirim notifikasi: ${error}`,
        type: 'error',
      });
    }
  };

  const handleResetAIConsent = async () => {
    showAlert({
      title: 'Reset AI Consent Dialog',
      message: 'Dialog AI consent akan muncul lagi saat Anda menggunakan Quick Add. Ini berguna untuk testing.',
      type: 'info',
      buttons: [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Reset',
          style: 'default',
          onPress: async () => {
            try {
              await resetAIConsent();
              showAlert({
                title: 'Berhasil',
                message: 'AI consent telah direset!',
                type: 'success',
              });
            } catch (error) {
              showAlert({ title: 'Error', message: 'Gagal mereset AI consent', type: 'error' });
            }
          },
        },
      ],
    });
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
    { code: 'IDR', name: 'Indoneisan Rupiah', symbol: 'Rp' },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: '$' },
    { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
    { code: 'THB', name: 'Thai Baht', symbol: '฿' },
    { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
    { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
    { code: 'AUD', name: 'Australian Dollar', symbol: '$' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: '$' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'HKD', name: 'Hong Kong Dollar', symbol: '$' },
    { code: 'TWD', name: 'Taiwan Dollar', symbol: '$' },
    { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('settings.header')}</Text>
        </View>

        <TouchableOpacity style={styles.premiumBanner} onPress={() => router.push('/premium')} activeOpacity={0.9}>
          <View style={styles.premiumContent}>
            <View style={styles.premiumTextContainer}>
              <View style={styles.proBadge}><Text style={styles.proBadgeText}>PRO</Text></View>
              <Text style={styles.premiumTitle}>IngatUang PRO</Text>
              <Text style={styles.premiumSubtitle}>Buka semua fitur eksklusif & sinkronisasi awan</Text>
            </View>
            <View style={styles.upgradeBtn}><Feather name="chevron-right" size={20} color="#fff" /></View>
          </View>
        </TouchableOpacity>

        <View style={styles.menuContainer}>
          {/* Language Selector */}
          <TouchableOpacity style={styles.menuItem} onPress={() => openSheet('language')}>
            <Feather name="globe" size={18} color="#374151" />
            <Text style={styles.menuTitle}>{t('settings.language')}</Text>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{i18n.language === 'id' ? 'ID' : 'EN'}</Text>
              <Feather name="chevron-right" size={14} color="#9ca3af" />
            </View>
          </TouchableOpacity>

          {/* Currency Selector */}
          <TouchableOpacity style={styles.menuItem} onPress={() => openSheet('currency')}>
            <Feather name="dollar-sign" size={18} color="#374151" />
            <Text style={styles.menuTitle}>{t('settings.currency')}</Text>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{currentCurrency}</Text>
              <Feather name="chevron-right" size={14} color="#9ca3af" />
            </View>
          </TouchableOpacity>

          {/* Widget Settings (Android Only) */}
          {Platform.OS === 'android' && (
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/widget-settings')}>
              <Feather name="layout" size={18} color="#374151" />
              <Text style={styles.menuTitle}>{t('settings.widget_settings') || 'Widget Settings'}</Text>
              <Feather name="chevron-right" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/categories')}>
            <Feather name="grid" size={18} color="#374151" />
            <Text style={styles.menuTitle}>{t('settings.categories')}</Text>
            <Feather name="chevron-right" size={18} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/export')}>
            <Feather name="download" size={18} color="#374151" />
            <Text style={styles.menuTitle}>{t('settings.export_data')}</Text>
            <Feather name="chevron-right" size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <View style={styles.devSection}>
          <Text style={styles.sectionTitle}>{t('settings.dev_tools')}</Text>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={handleTestNotification}>
              <Feather name="bell" size={18} color="#374151" />
              <Text style={styles.menuTitle}>{t('settings.test_notification')}</Text>
              <Feather name="chevron-right" size={18} color="#9ca3af" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleSeedData}>
              <Feather name="database" size={18} color="#374151" />
              <Text style={styles.menuTitle}>{t('settings.add_sample')}</Text>
              <Feather name="chevron-right" size={18} color="#9ca3af" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleClearData}>
              <Feather name="trash-2" size={18} color="#ef4444" />
              <Text style={[styles.menuTitle, { color: '#ef4444' }]}>{t('settings.clear_data')}</Text>
              <Feather name="chevron-right" size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>{t('settings.version')}</Text>
        </View>
      </ScrollView>

      {/* Modern Bottom Sheet */}
      <Modal visible={sheetVisible} transparent animationType="fade" onRequestClose={() => setSheetVisible(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setSheetVisible(false)}>
          <View style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>
                {sheetType === 'language' ? t('settings.select_language') : t('settings.select_currency')}
              </Text>
            </View>

            <ScrollView bounces={false} style={styles.sheetList}>
              {sheetType === 'language' ? (
                languages.map((lang) => (
                  <TouchableOpacity 
                    key={lang.code} 
                    style={styles.sheetItem} 
                    onPress={() => handleSelectLanguage(lang.code)}
                  >
                    <Text style={styles.sheetEmoji}>{lang.flag}</Text>
                    <Text style={[styles.sheetItemText, i18n.language === lang.code && styles.sheetItemActive]}>
                      {lang.name}
                    </Text>
                    {i18n.language === lang.code && <Ionicons name="checkmark-circle" size={20} color="#0f172a" />}
                  </TouchableOpacity>
                ))
              ) : (
                currencies.map((curr) => (
                  <TouchableOpacity 
                    key={curr.code} 
                    style={styles.sheetItem} 
                    onPress={() => handleSelectCurrency(curr.code)}
                  >
                    <View style={styles.currencyIcon}><Text style={styles.currencySymbol}>{curr.symbol}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sheetItemText, currentCurrency === curr.code && styles.sheetItemActive]}>
                        {curr.code}
                      </Text>
                      <Text style={styles.currencyName}>{curr.name}</Text>
                    </View>
                    {currentCurrency === curr.code && <Ionicons name="checkmark-circle" size={20} color="#0f172a" />}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  premiumBanner: {
    backgroundColor: '#111827',
    margin: 20,
    borderRadius: 24,
    padding: 24,
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  premiumTextContainer: {
    flex: 1,
  },
  proBadge: {
    backgroundColor: '#3b82f6',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  proBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  premiumTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 4,
  },
  premiumSubtitle: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 20,
  },
  upgradeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    borderBottomColor: '#f8fafc',
    gap: 16,
  },
  menuTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  devSection: {
    marginVertical: 24,
    paddingTop: 24,
    borderTopWidth: 8,
    borderTopColor: '#f8fafc',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#94a3b8',
    letterSpacing: 1.5,
    paddingHorizontal: 20,
    marginBottom: 16,
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
  // Sheet Styles
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
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
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  sheetList: {
    paddingHorizontal: 20,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    gap: 16,
  },
  sheetEmoji: {
    fontSize: 24,
  },
  sheetItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  sheetItemActive: {
    color: '#0f172a',
    fontWeight: '800',
  },
  currencyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  currencyName: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
});
