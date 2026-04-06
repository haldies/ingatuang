import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../global.css';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Initialize Internationalization & Currency
    const loadConfig = async () => {
      const { initI18n } = require('@/lib/utils/i18n');
      const { storage } = require('@/lib/storage/storage-adapter');
      const { updateGlobalCurrency } = require('@/lib/utils/format');
      
      await initI18n();
      const currency = await storage.getCurrency();
      updateGlobalCurrency(currency);
    };
    loadConfig();

    // Set API config for widget
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || '';
    const apiKey = process.env.EXPO_PUBLIC_API_KEY || '';
    
    if (apiUrl && apiKey) {
      const { setWidgetAPIConfig } = require('@/lib/utils/widget');
      setWidgetAPIConfig(apiUrl, apiKey);
    }
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'none',
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen 
            name="modal" 
            options={{ 
              presentation: 'modal',
              title: 'Modal',
              animation: 'none',
            }} 
          />
          <Stack.Screen name="export" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
