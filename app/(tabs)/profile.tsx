import { View, Text, TouchableOpacity, Alert, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { seedSampleData, clearAllData } from '@/lib/storage';
import { router, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { getCurrentUser, logout, type User } from '@/lib/auth';

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);

  const loadUser = useCallback(async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  }, []);

  // Reload user when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [loadUser])
  );

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Apakah Anda yakin ingin keluar?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            setUser(null);
            Alert.alert('Berhasil', 'Anda telah logout. Data lokal tetap tersimpan.');
          },
        },
      ]
    );
  };
  const handleSeedData = async () => {
    try {
      await seedSampleData();
      Alert.alert('Berhasil', 'Sample data berhasil ditambahkan!');
      router.push('/(tabs)');
    } catch (err) {
      Alert.alert('Error', 'Gagal menambahkan sample data');
      console.error('Error seeding data:', err);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Hapus Semua Data',
      'Apakah Anda yakin ingin menghapus semua data?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData();
              Alert.alert('Berhasil', 'Semua data berhasil dihapus!');
              router.push('/(tabs)');
            } catch (err) {
              Alert.alert('Error', 'Gagal menghapus data');
              console.error('Error clearing data:', err);
            }
          },
        },
      ]
    );
  };

  const handleComingSoon = (feature: string) => {
    Alert.alert('Segera Hadir', `Fitur ${feature} akan segera tersedia`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profil</Text>
        </View>

        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color="#3b82f6" />
          </View>
          <View style={styles.userInfo}>
            {user ? (
              <>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </>
            ) : (
              <>
                <Text style={styles.userName}>Mode Offline</Text>
                <Text style={styles.userEmail}>Login untuk sync data</Text>
              </>
            )}
          </View>
          {!user && (
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.push('/login')}
            >
              <Ionicons name="log-in-outline" size={20} color="#3b82f6" />
            </TouchableOpacity>
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {/* Account */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              if (user) {
                router.push('/account');
              } else {
                router.push('/login');
              }
            }}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="person-outline" size={20} color="#3b82f6" />
            </View>
            <Text style={styles.menuTitle}>Account</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          {/* API Keys */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              if (user) {
                router.push('/api-keys');
              } else {
                router.push('/login');
              }
            }}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="key-outline" size={20} color="#3b82f6" />
            </View>
            <Text style={styles.menuTitle}>API Keys</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          {/* MCP Connector */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleComingSoon('MCP Connector')}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="git-network-outline" size={20} color="#3b82f6" />
            </View>
            <Text style={styles.menuTitle}>MCP Connector</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          {/* Export Data */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/export')}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="document-text-outline" size={20} color="#3b82f6" />
            </View>
            <Text style={styles.menuTitle}>Export Data</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          {/* Privacy & Security */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleComingSoon('Privacy & Security')}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#3b82f6" />
            </View>
            <Text style={styles.menuTitle}>Privacy & Security</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          {/* Upgrade */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleComingSoon('Upgrade')}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="card-outline" size={20} color="#3b82f6" />
            </View>
            <Text style={styles.menuTitle}>Upgrade</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          {/* Help */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleComingSoon('Help')}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="help-circle-outline" size={20} color="#3b82f6" />
            </View>
            <Text style={styles.menuTitle}>Help</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Development Tools Section */}
        <View style={styles.devSection}>
          <Text style={styles.sectionTitle}>DEVELOPMENT TOOLS</Text>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={handleSeedData}>
              <View style={[styles.menuIcon, { backgroundColor: '#dbeafe' }]}>
                <Ionicons name="add-circle" size={20} color="#3b82f6" />
              </View>
              <Text style={styles.menuTitle}>Tambah Sample Data</Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleClearData}>
              <View style={[styles.menuIcon, { backgroundColor: '#fee2e2' }]}>
                <Ionicons name="trash" size={20} color="#ef4444" />
              </View>
              <Text style={styles.menuTitle}>Hapus Semua Data</Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        {user && (
          <View style={styles.logoutContainer}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Ingat Uang Mobile v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: '#6b7280',
  },
  loginButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 12,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  devSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  logoutContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fff',
    gap: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  versionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  versionText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#9ca3af',
  },
});
