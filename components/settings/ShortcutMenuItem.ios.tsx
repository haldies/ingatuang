import { TouchableOpacity, View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function ShortcutMenuItem() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  
  return (
    <TouchableOpacity 
      style={[styles.menuItem, { borderBottomColor: isDark ? '#171717' : '#f8fafc' }]} 
      onPress={() => router.push('/(settings)/shortcuts')}
    >
      <Ionicons name="mic-outline" size={18} color={theme.tint} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuTitle, { color: theme.text }]}>Apple Shortcuts & Siri</Text>
        <Text style={styles.menuSubtitle}>Kelola integrasi Siri dan Pintasan Apple</Text>
      </View>
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
