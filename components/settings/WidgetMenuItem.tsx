import { TouchableOpacity, View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function WidgetMenuItem() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  
  return (
    <TouchableOpacity 
      style={[styles.menuItem, { borderBottomColor: isDark ? '#171717' : '#f8fafc' }]} 
      onPress={() => router.push('/(settings)/widgets' as any)}
    >
      <Feather name="layout" size={18} color={isDark ? '#94a3b8' : '#374151'} />
      <Text style={[styles.menuTitle, { color: theme.text }]}>Widgets</Text>
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
