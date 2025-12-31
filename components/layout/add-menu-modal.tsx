import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AddMenuModalProps {
  visible: boolean;
  onClose: () => void;
  onTransactionPress: () => void;
  onSubscriptionPress: () => void;
}

export function AddMenuModal({
  visible,
  onClose,
  onTransactionPress,
  onSubscriptionPress,
}: AddMenuModalProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.menuContainer}>
          {/* Catat Transaksi */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={onTransactionPress}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="receipt" size={20} color="#3b82f6" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Catat Transaksi</Text>
              <Text style={styles.menuSubtitle}>Input manual lengkap</Text>
            </View>
          </TouchableOpacity>

          {/* Quick Add (Coming Soon) */}
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemDisabled]}
            activeOpacity={0.7}
            disabled
          >
            <View style={[styles.iconContainer, { backgroundColor: '#f3e8ff' }]}>
              <Ionicons name="sparkles" size={20} color="#a855f7" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Quick Add (AI)</Text>
              <Text style={styles.menuSubtitle}>Segera hadir</Text>
            </View>
          </TouchableOpacity>

          {/* Langganan */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={onSubscriptionPress}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#fed7aa' }]}>
              <Ionicons name="calendar" size={20} color="#f97316" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Langganan</Text>
              <Text style={styles.menuSubtitle}>Kelola langganan bulanan</Text>
            </View>
          </TouchableOpacity>

          {/* Split Bill (Coming Soon) */}
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemDisabled]}
            activeOpacity={0.7}
            disabled
          >
            <View style={[styles.iconContainer, { backgroundColor: '#d1fae5' }]}>
              <Ionicons name="git-branch" size={20} color="#10b981" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Split Bill</Text>
              <Text style={styles.menuSubtitle}>Segera hadir</Text>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    paddingBottom: 80, // Space for tab bar
  },
  menuContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
});
