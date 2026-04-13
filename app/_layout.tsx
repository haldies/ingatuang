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
import { parseTransactionText } from '@/lib/ai/ai-parser';
import { storage } from '@/lib/storage/storage-adapter';
import { Colors } from '@/constants/theme';

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
        const { updateGlobalCurrency, updateGlobalCompact } = require('@/lib/utils/format');
        
        await initI18n();
        const currency = await storage.getCurrency();
        const compact = await storage.getCompactCurrency();
        updateGlobalCurrency(currency);
        updateGlobalCompact(compact);

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

  const theme = Colors[colorScheme ?? 'light'];

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            gestureEnabled: true,
            contentStyle: { backgroundColor: theme.background },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} backgroundColor={theme.background} translucent={false} />
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
