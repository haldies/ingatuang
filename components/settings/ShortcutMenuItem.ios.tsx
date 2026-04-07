import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ShortcutMenuItem() {
  const router = useRouter();
  
  return (
    <TouchableOpacity 
      style={styles.menuItem} 
      onPress={() => router.push('/(settings)/shortcuts')}
    >
      <Ionicons name="mic-outline" size={18} color="#3b82f6" />
      <View style={{ flex: 1 }}>
        <Text style={styles.menuTitle}>Apple Shortcuts & Siri</Text>
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
    borderBottomColor: '#f8fafc',
    gap: 16,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
});
