import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ShortcutMenuItem() {
  const router = useRouter();
  
  return (
    <TouchableOpacity 
      style={styles.menuItem} 
      onPress={() => router.push('/(settings)/shortcuts')}
    >
      <Feather name="layout" size={18} color="#374151" />
      <View style={{ flex: 1 }}>
        <Text style={styles.menuTitle}>Widget Settings</Text>
        <Text style={styles.menuSubtitle}>Kelola Widget Home Screen</Text>
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
