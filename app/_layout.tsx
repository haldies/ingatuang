import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../global.css';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useState } from 'react';
import { AIConsentDialog } from '@/components/transactions/ai-consent-dialog';
import { hasShownAIConsent, saveAIConsent } from '@/lib/ai/ai-consent';
import * as Linking from 'expo-linking';
import { parseTransactionText } from '@/lib/ai/ai-parser';
import { storage } from '@/lib/storage/storage-adapter';
import { Alert } from 'react-native';
import { useShortcutSync } from '@/lib/hooks/use-shortcut-sync.ios';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [showConsent, setShowConsent] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize Internationalization & Configuration
    const loadConfig = async () => {
      try {
        const { initI18n } = require('@/lib/utils/i18n');
        const { storage } = require('@/lib/storage/storage-adapter');
        const { updateGlobalCurrency } = require('@/lib/utils/format');
        
        await initI18n();
        const currency = await storage.getCurrency();
        updateGlobalCurrency(currency);

        const apiUrl = process.env.EXPO_PUBLIC_API_URL || '';
        const apiKey = process.env.EXPO_PUBLIC_API_KEY || '';
        
        if (apiUrl && apiKey) {
          const { setWidgetAPIConfig } = require('@/lib/utils/widget');
          setWidgetAPIConfig(apiUrl, apiKey);
        }
      } catch (err) {
        console.error('Root initialization error:', err);
      } finally {
        setIsReady(true);
        SplashScreen.hideAsync();
      }
    };
    loadConfig();

    const checkConsent = async () => {
      const hasShown = await hasShownAIConsent();
      if (!hasShown) {
        setShowConsent(true);
      }
    };
    checkConsent();
  }, []);

  // Sync Siri transactions on launch/resume
  useShortcutSync();

  // Handler Deep Link (Safe Shortcut)
  // Cara ini 100% aman dan tidak akan merusak build iOS karena tidak pakai native extension.
  const url = Linking.useURL();
  useEffect(() => {
    if (url) {
      const { hostname, path, queryParams } = Linking.parse(url);
      
      // Deteksi URL: ingatuang://add?text=... atau ingatuang://add/text=...
      if ((hostname === 'add' || path === 'add') && queryParams?.text) {
        const textToParse = decodeURIComponent(queryParams.text as string);
        const parsed = parseTransactionText(textToParse);

        if (parsed) {
          storage.addTransaction({
            ...parsed,
            date: new Date().toISOString(),
            walletId: 'default',
          }).then(() => {
            Alert.alert(
              'Catat Berhasil! ✅',
              `Transaksi "${parsed.notes}" senilai Rp${parsed.amount.toLocaleString()} sudah disimpan.`
            );
          });
        }
      }
    }
  }, [url]);

  const handleConsentAccept = async () => {
    await saveAIConsent(true);
    setShowConsent(false);
  };

  const handleConsentDecline = async () => {
    await saveAIConsent(false);
    setShowConsent(false);
  };

  // Block rendering until i18n and configs are fully loaded
  if (!isReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            gestureEnabled: true,
            contentStyle: { backgroundColor: '#ffffff' },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        </Stack>
        <StatusBar style="dark" backgroundColor="#ffffff" translucent={false} />
        {showConsent && (
          <AIConsentDialog
            visible={showConsent}
            onAccept={handleConsentAccept}
            onDecline={handleConsentDecline}
          />
        )}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
