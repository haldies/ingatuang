import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Platform, 
  Modal, 
  Switch,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Alert
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { storage } from '@/lib/storage/storage-adapter';
import { eventEmitter, EVENTS } from '@/lib/utils/events';
import { router } from 'expo-router';
import { CustomAlert } from '@/components/ui/custom-alert';
import { resetAIConsent } from '@/lib/ai/ai-consent';
import { useTranslation } from 'react-i18next';
import i18n, { LANGUAGE_KEY } from '@/lib/utils/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateGlobalCurrency, updateGlobalCompact } from '@/lib/utils/format';
import { Header } from '@/components/ui/header';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import WidgetMenuItem from '@/components/settings/WidgetMenuItem';
import { Colors, getRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiClient } from '@/lib/api/api-client';
import { syncAll, getLastSyncAt } from '@/lib/sync/sync-service';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  
  // User State
  const [user, setUser] = useState<any>(null);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  // Sheet State
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetType, setSheetType] = useState<'language' | 'currency' | 'theme' | null>(null);
  const [currentCurrency, setCurrentCurrency] = useState('IDR');
  const [currentTheme, setCurrentTheme] = useState<'system' | 'light' | 'dark'>('system');
  const [isCompact, setIsCompact] = useState(false);

  // Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    buttons?: {
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }[];
  }>({
    title: '',
    message: '',
    type: 'info',
    buttons: [{ text: 'OK', style: 'default' }],
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const [curr, compact, themeMode, userData, lastSync] = await Promise.all([
      storage.getCurrency(),
      storage.getCompactCurrency(),
      storage.getTheme(),
      storage.getUserInfo(),
      getLastSyncAt(),
    ]);
    setCurrentCurrency(curr);
    setIsCompact(compact);
    setCurrentTheme(themeMode);
    setUser(userData);
    setLastSyncAt(lastSync);
  };

  const formatLastSync = (isoDate: string | null): string => {
    if (!isoDate) return 'Belum pernah sync';
    const d = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);
    if (diffMin < 1) return 'Baru saja';
    if (diffMin < 60) return `${diffMin} menit lalu`;
    if (diffHour < 24) return `${diffHour} jam lalu`;
    return `${diffDay} hari lalu`;
  };

  const handleSync = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    const token = await storage.getApiKey();
    if (!token) {
      showAlert({
        title: 'Perlu login ulang',
        message: 'Sesi akun perlu diperbarui.',
        type: 'warning',
      });
      return;
    }

    setIsSyncing(true);
    try {
      const result = await syncAll(token);
      setLastSyncAt(result.syncedAt);

      const hasErrors = result.errors.length > 0;
      showAlert({
        title: hasErrors ? 'Sync selesai' : 'Sync berhasil',
        message: hasErrors
          ? 'Sebagian data belum tersinkron. Coba lagi nanti.'
          : 'Data terbaru sudah tersimpan.',
        type: hasErrors ? 'warning' : 'success',
      });

      eventEmitter.emit(EVENTS.THEME_CHANGED);
    } catch {
      showAlert({
        title: 'Sync gagal',
        message: 'Coba lagi sebentar lagi.',
        type: 'error',
      });
    } finally {
      setIsSyncing(false);
    }
  };
  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setLoginModalVisible(true);
  };

  const handleAuth = async () => {
    if (authMode === 'register' && !name.trim()) {
      Alert.alert('Nama wajib diisi', 'Masukkan nama Anda untuk membuat akun.');
      return;
    }

    if (!email || !password) {
      Alert.alert('Error', 'Email dan password harus diisi');
      return;
    }

    setIsLoggingIn(true);
    try {
      const response = authMode === 'register'
        ? await apiClient.register(name.trim(), email, password)
        : await apiClient.login(email, password);
      
      await storage.saveApiKey(response.token);
      await storage.saveUserInfo(response.user);
      
      setUser(response.user);
      setLoginModalVisible(false);
      setName('');
      setEmail('');
      setPassword('');
      
      showAlert({
        title: authMode === 'register' ? 'Akun dibuat' : t('settings.auth.login_success', 'Berhasil Masuk'),
        message: `Halo, ${response.user.name}.`,
        type: 'success'
      });
    } catch (error) {
      Alert.alert(
        authMode === 'register' ? 'Gagal Daftar' : 'Gagal Masuk',
        error instanceof Error ? error.message : t('settings.auth.login_error', 'Email atau password salah')
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    showAlert({
      title: t('settings.auth.logout', 'Keluar Akun'),
      message: 'Apakah Anda yakin ingin keluar?',
      type: 'warning',
      buttons: [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.auth.logout'),
          style: 'destructive',
          onPress: async () => {
            await Promise.all([
              storage.deleteUserInfo(),
            ]);
            setUser(null);
            showAlert({ title: 'Selesai', message: 'Anda telah keluar akun', type: 'info' });
          }
        }
      ]
    });
  };

  const showAlert = (config: typeof alertConfig) => {
    setAlertConfig(config);
    setAlertVisible(true);
  };

  const handleClearData = () => {
    showAlert({
      title: 'Hapus data?',
      message: 'Semua data lokal akan dihapus.',
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
            } catch {
              showAlert({ title: 'Error', message: 'Gagal menghapus data', type: 'error' });
            }
          },
        },
      ],
    });
  };

  const themeOptions = [
    { id: 'system', name: t('settings.theme_system', 'Otomatis'), icon: 'monitor' },
    { id: 'light', name: t('settings.theme_light', 'Terang'), icon: 'sun' },
    { id: 'dark', name: t('settings.theme_dark', 'Gelap'), icon: 'moon' },
  ];

  const handleSelectTheme = async (mode: 'system' | 'light' | 'dark') => {
    try {
      await storage.setTheme(mode);
      setCurrentTheme(mode);
      setSheetVisible(false);
      eventEmitter.emit(EVENTS.THEME_CHANGED);
    } catch {
      showAlert({ title: 'Error', message: 'Gagal mengubah tema', type: 'error' });
    }
  };

  const openSheet = (type: 'language' | 'currency' | 'theme') => {
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

  const handleToggleCompact = async (value: boolean) => {
    await storage.setCompactCurrency(value);
    updateGlobalCompact(value);
    setIsCompact(value);
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
        <Text style={[styles.sectionTitle, styles.firstSectionTitle, { color: theme.textSecondary }]}>Akun</Text>
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: theme.border }]}
            onPress={user ? handleLogout : () => openAuthModal('login')}
          >
            <View style={[styles.accountAvatar, { backgroundColor: theme.tint + '18' }]}>
              <Text style={[styles.accountAvatarText, { color: theme.tint }]}>
                {user?.name?.charAt(0) || 'U'}
              </Text>
            </View>
            <View style={styles.menuTextBlock}>
              <Text style={[styles.menuTitle, { color: theme.text }]}>
                {user ? user.name : 'Masuk'}
              </Text>
              <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                {user ? user.email : 'Sync dan backup data'}
              </Text>
            </View>
            <Feather name={user ? 'log-out' : 'chevron-right'} size={18} color={user ? '#ef4444' : theme.textSecondary} />
          </TouchableOpacity>

          {!user && (
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: theme.border }]}
              onPress={() => openAuthModal('register')}
            >
              <Feather name="user-plus" size={18} color={theme.textSecondary} />
              <Text style={[styles.menuTitle, { color: theme.text, flex: 1 }]}>Daftar akun</Text>
              <Feather name="chevron-right" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: theme.border, opacity: isSyncing ? 0.7 : 1 }]}
            onPress={handleSync}
            disabled={isSyncing}
          >
            <Feather name="refresh-cw" size={18} color={theme.textSecondary} />
            <View style={styles.menuTextBlock}>
              <Text style={[styles.menuTitle, { color: theme.text }]}>Sync</Text>
              <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>
                {isSyncing ? 'Sedang sync...' : formatLastSync(lastSyncAt)}
              </Text>
            </View>
            {isSyncing ? (
              <ActivityIndicator size="small" color={theme.tint} />
            ) : (
              <Feather name="chevron-right" size={18} color={theme.textSecondary} />
            )}
          </TouchableOpacity>
        </View>

        {/* PREMIUM BANNER - REPOSITIONED */}
        <TouchableOpacity 
            style={[
              styles.premiumBanner, 
              { 
                backgroundColor: theme.card,
                borderColor: theme.border,
                borderWidth: 1,
                borderRadius: getRadius(80) 
              }
            ]} 
          onPress={() => router.push('/premium')} 
          activeOpacity={0.9}
        >
          <View style={styles.premiumTextContainer}>
            <View style={[styles.proBadge, { backgroundColor: '#F59E0B', borderRadius: getRadius(22) }]}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
            <View>
              <Text style={[styles.proTitle, { color: theme.text }]}>IngatUang PRO</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </TouchableOpacity>

        {/* MENU GROUP 1: PREFERENCES */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Preferensi</Text>
        <View style={styles.menuContainer}>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]} onPress={() => openSheet('language')}>
            <Feather name="globe" size={18} color={theme.textSecondary} />
            <Text style={[styles.menuTitle, { color: theme.text }]}>{t('settings.language')}</Text>
            <View style={styles.badgeContainer}>
              <Text style={[styles.badgeText, { backgroundColor: theme.card, color: theme.textSecondary }]}>{i18n.language === 'id' ? 'ID' : 'EN'}</Text>
              <Feather name="chevron-right" size={14} color={theme.textSecondary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]} onPress={() => openSheet('currency')}>
            <Feather name="dollar-sign" size={18} color={theme.textSecondary} />
            <Text style={[styles.menuTitle, { color: theme.text }]}>{t('settings.currency')}</Text>
            <View style={styles.badgeContainer}>
              <Text style={[styles.badgeText, { backgroundColor: theme.card, color: theme.textSecondary }]}>{currentCurrency}</Text>
              <Feather name="chevron-right" size={14} color={theme.textSecondary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]} onPress={() => openSheet('theme')}>
            <Feather name={currentTheme === 'dark' ? 'moon' : currentTheme === 'light' ? 'sun' : 'monitor'} size={18} color={theme.textSecondary} />
            <Text style={[styles.menuTitle, { color: theme.text }]}>{t('settings.theme', 'Tema Aplikasi')}</Text>
            <View style={styles.badgeContainer}>
              <Text style={[styles.badgeText, { backgroundColor: theme.card, color: theme.textSecondary }]}>
                {currentTheme === 'system' ? t('settings.theme_system', 'Otomatis') : 
                 currentTheme === 'dark' ? t('settings.theme_dark', 'Gelap') : 
                 t('settings.theme_light', 'Terang')}
              </Text>
              <Feather name="chevron-right" size={14} color={theme.textSecondary} />
            </View>
          </TouchableOpacity>

          <View style={[styles.menuItem, { borderBottomColor: theme.border }]}>
            <Feather name="minimize-2" size={18} color={theme.textSecondary} />
            <Text style={[styles.menuTitle, { color: theme.text, flex: 1 }]}>{t('settings.compact_format')}</Text>
            <Switch 
              value={isCompact} 
              onValueChange={handleToggleCompact}
              trackColor={{ false: theme.border, true: theme.tint + '50' }}
              thumbColor={isCompact ? theme.tint : (isDark ? '#404040' : '#f3f4f6')}
            />
          </View>

          {Platform.OS === 'android' && <WidgetMenuItem />}

          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: theme.border }]} 
            onPress={() => router.push('/(settings)/api-shortcuts')}
          >
            <Feather name="zap" size={18} color={theme.textSecondary} />
            <Text style={[styles.menuTitle, { color: theme.text, flex: 1 }]}>Shortcut</Text>
            <Feather name="chevron-right" size={18} color={theme.textSecondary} />
          </TouchableOpacity>

        </View>

        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Data</Text>
        <View style={styles.menuContainer}>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]} onPress={() => router.push('/categories')}>
            <Feather name="grid" size={18} color={theme.textSecondary} />
            <Text style={[styles.menuTitle, { color: theme.text, flex: 1 }]}>Kategori</Text>
            <Feather name="chevron-right" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]} onPress={() => router.push('/(settings)/privacy-security')}>
            <Feather name="lock" size={18} color={theme.textSecondary} />
            <Text style={[styles.menuTitle, { color: theme.text, flex: 1 }]}>Privasi & Keamanan</Text>
            <Feather name="chevron-right" size={18} color={theme.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]} onPress={handleClearData}>
            <Feather name="trash-2" size={18} color="#ef4444" />
            <Text style={[styles.menuTitle, { color: '#ef4444', flex: 1 }]}>{t('settings.clear_data')}</Text>
            <Feather name="chevron-right" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: theme.textSecondary }]}>v1.0.0</Text>
        </View>
      </ScrollView>

      {/* LOGIN MODAL */}
      <Modal
        visible={loginModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setLoginModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.modalBackdrop}
        >
          <Pressable style={styles.modalDismiss} onPress={() => setLoginModalVisible(false)} />
          <View style={[styles.loginModal, { backgroundColor: theme.background, borderTopLeftRadius: getRadius(160, 'large'), borderTopRightRadius: getRadius(160, 'large') }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {authMode === 'register' ? 'Daftar akun' : t('settings.auth.login_title')}
              </Text>
              <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                {authMode === 'register' ? 'Buat akun untuk sync dan backup data.' : t('settings.auth.login_desc')}
              </Text>
            </View>

            <View style={styles.loginForm}>
              {authMode === 'register' && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Nama</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text, borderRadius: getRadius(56, 'small') }]}
                    value={name}
                    onChangeText={setName}
                    placeholder="Nama Anda"
                    placeholderTextColor={theme.border}
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>{t('settings.auth.email')}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text, borderRadius: getRadius(56, 'small') }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="email@example.com"
                  placeholderTextColor={theme.border}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>{t('settings.auth.password')}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text, borderRadius: getRadius(56, 'small') }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={theme.border}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity 
                style={[styles.loginBtn, { backgroundColor: theme.tint, borderRadius: getRadius(56, 'small') }]}
                onPress={handleAuth}
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginBtnText}>
                    {authMode === 'register' ? 'Daftar' : t('settings.auth.login_btn')}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setAuthMode(authMode === 'register' ? 'login' : 'register')}
                style={styles.authSwitch}
              >
                <Text style={[styles.authSwitchText, { color: theme.tint }]}>
                  {authMode === 'register' ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => setLoginModalVisible(false)} style={styles.cancelLink}>
                <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
              <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
              <Text style={[styles.sheetTitle, { color: theme.text }]}>
                {sheetType === 'language' ? t('settings.select_language') : 
                 sheetType === 'currency' ? t('settings.select_currency') : 
                 t('settings.select_theme', 'Pilih Tema')}
              </Text>
            </View>

            <View style={styles.sheetList}>
              {sheetType === 'language' ? (
                languages.map((lang) => (
                  <TouchableOpacity 
                    key={lang.code} 
                    style={[styles.sheetItem, { borderBottomColor: theme.border }]} 
                    onPress={() => handleSelectLanguage(lang.code)}
                  >
                    <Text style={styles.sheetEmoji}>{lang.flag}</Text>
                    <Text style={[styles.sheetItemText, { color: theme.text }, i18n.language === lang.code && styles.sheetItemActive]}>
                      {lang.name}
                    </Text>
                    {i18n.language === lang.code && <Ionicons name="checkmark-circle" size={20} color={theme.tint} />}
                  </TouchableOpacity>
                ))
              ) : sheetType === 'currency' ? (
                currencies.map((curr) => (
                  <TouchableOpacity 
                    key={curr.code} 
                    style={[styles.sheetItem, { borderBottomColor: theme.border }]} 
                    onPress={() => handleSelectCurrency(curr.code)}
                  >
                    <View style={[styles.currencyIcon, { backgroundColor: theme.card, borderRadius: getRadius(120, 'small') }]}>
                      <Text style={[styles.currencySymbol, { color: theme.text }]}>{curr.symbol}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sheetItemText, { color: theme.text }, currentCurrency === curr.code && styles.sheetItemActive]}>
                         {curr.code}
                      </Text>
                      <Text style={[styles.currencyName, { color: theme.textSecondary }]}>{curr.name}</Text>
                    </View>
                    {currentCurrency === curr.code && <Ionicons name="checkmark-circle" size={20} color={theme.tint} />}
                  </TouchableOpacity>
                ))
              ) : (
                themeOptions.map((opt) => (
                  <TouchableOpacity 
                    key={opt.id} 
                    style={[styles.sheetItem, { borderBottomColor: theme.border }]} 
                    onPress={() => handleSelectTheme(opt.id as any)}
                  >
                    <View style={[styles.currencyIcon, { backgroundColor: theme.card, borderRadius: getRadius(120, 'small') }]}>
                      <Feather name={opt.icon as any} size={18} color={theme.text} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sheetItemText, { color: theme.text }, currentTheme === opt.id && styles.sheetItemActive]}>
                         {opt.name}
                      </Text>
                    </View>
                    {currentTheme === opt.id && <Ionicons name="checkmark-circle" size={20} color={theme.tint} />}
                  </TouchableOpacity>
                ))
              )}
            </View>
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
  accountAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountAvatarText: {
    fontSize: 14,
    fontWeight: '800',
  },
  premiumBanner: {
    marginHorizontal: 20,
    marginTop: 12,
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
  menuTextBlock: {
    flex: 1,
  },
  menuSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
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
    letterSpacing: 1.5,
    paddingHorizontal: 20,
    marginBottom: 8,
    marginTop: 22,
  },
  firstSectionTitle: {
    marginTop: 20,
  },
  versionContainer: {
    padding: 40,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalDismiss: {
    flex: 1,
  },
  loginModal: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '90%',
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  loginForm: {
    paddingHorizontal: 24,
    paddingBottom: 20,
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
  loginBtn: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  authSwitch: {
    alignItems: 'center',
    marginTop: 16,
    padding: 8,
  },
  authSwitchText: {
    fontSize: 13,
    fontWeight: '700',
  },
  cancelLink: {
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
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
    paddingBottom: 12,
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
    marginTop: 2,
  },
});
