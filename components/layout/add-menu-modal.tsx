import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AddMenuModalProps {
  visible: boolean;
  onClose: () => void;
  onTransactionPress: () => void;
  onQuickAddPress: () => void;
  onSubscriptionPress: () => void;
  onSplitBillPress: () => void;
}

export function AddMenuModal({
  visible,
  onClose,
  onTransactionPress,
  onQuickAddPress,
  onSubscriptionPress,
  onSplitBillPress,
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

          {/* Quick Add AI */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={onQuickAddPress}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#f3e8ff' }]}>
              <Ionicons name="sparkles" size={20} color="#a855f7" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Quick Add (AI)</Text>
              <Text style={styles.menuSubtitle}>Tulis dengan bahasa natural</Text>
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

          {/* Split Bill */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={onSplitBillPress}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#d1fae5' }]}>
              <Ionicons name="git-branch" size={20} color="#10b981" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>Split Bill</Text>
              <Text style={styles.menuSubtitle}>Bagi tagihan dengan teman</Text>
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
    paddingBottom: 100, // Naik lebih tinggi dari tab bar
  },
  menuContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 20, // Tambah margin bottom
    borderRadius: 28, // Lebih rounded
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18, // Lebih rounded
    gap: 14,
    marginBottom: 6,
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 18, // Lebih rounded, match dengan menuItem
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 3,
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
});
