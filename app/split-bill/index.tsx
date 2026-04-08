import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme as useNativeColorScheme,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
import { Header } from '@/components/ui/header';
import { Colors, getRadius } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

export default function SplitBillComingSoonScreen() {
  const { t } = useTranslation();
  const colorScheme = useNativeColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  return (
    <ScreenWrapper backgroundColor={theme.background}>
      <Header title="Split Bill" />

      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: isDark ? '#1a1a1a' : '#f8fafc', borderRadius: getRadius(120, 'large') }]}>
          <Feather name="scissors" size={48} color={theme.tint} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Split Bill</Text>
        <View style={[styles.badge, { backgroundColor: theme.tint + '20', borderRadius: getRadius(40, 'small') }]}>
          <Text style={[styles.subtitle, { color: theme.tint }]}>COMING SOON</Text>
        </View>
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          Fitur patungan belanja & makan segera hadir untuk mempermudah hidup Anda.
        </Text>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    marginTop: -40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 12,
    letterSpacing: -1,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2.5,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '600',
  },
});
