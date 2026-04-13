import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function WidgetMenuItem() {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  
  return (
    <TouchableOpacity 
      style={[styles.menuItem, { borderBottomColor: theme.border }]} 
      onPress={() => router.push('/(settings)/widgets' as any)}
    >
      <Feather name="layers" size={18} color={isDark ? theme.textSecondary : '#374151'} />
      <Text style={[styles.menuTitle, { color: theme.text }]}>{t('settings.widgets.title')}</Text>
      <View style={{ flex: 1 }} />
      <Feather name="chevron-right" size={18} color="#9ca3af" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
  menuSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
});
