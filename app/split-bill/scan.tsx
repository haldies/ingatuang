import { useEffect } from 'react';
import { View, ActivityIndicator, useColorScheme as useNativeColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';

/**
 * Redirects to the main Split Bill index (Coming Soon)
 * This prevents users from accessing old/incomplete scan functionality directly.
 */
export default function SplitBillScanRedirect() {
  const router = useRouter();
  const colorScheme = useNativeColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  
  useEffect(() => {
    router.replace('/split-bill');
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
      <ActivityIndicator size="small" color={theme.tint} />
    </View>
  );
}
