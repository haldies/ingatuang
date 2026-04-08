import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, useColorScheme as useNativeColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function Index() {
  const router = useRouter();
  const colorScheme = useNativeColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  useEffect(() => {
    // Delay to ensure Root Layout is mounted (standard practice for Expo Router redirects)
    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.tint} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
