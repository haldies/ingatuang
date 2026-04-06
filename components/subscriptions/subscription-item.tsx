import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '@/lib/utils/format';
import type { Subscription } from '@/lib/storage/storage-adapter';

interface SubscriptionItemProps {
  subscription: Subscription;
  onEdit: (subscription: Subscription) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
}

export function SubscriptionItem({
  subscription,
  onEdit,
  onToggleActive,
  onDelete,
}: SubscriptionItemProps) {
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [slideAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));
  const getBillingCycleText = (cycle: string) => {
    const map: Record<string, string> = {
      DAILY: 'Harian',
      WEEKLY: 'Mingguan',
      MONTHLY: 'Bulanan',
      YEARLY: 'Tahunan',
    };
    return map[cycle] || cycle;
  };

  const getDaysUntilRenewal = (nextBillingDate: string) => {
    const today = new Date();
    const next = new Date(nextBillingDate);
    const diff = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const daysUntil = getDaysUntilRenewal(subscription.nextBillingDate);
  const isUpcoming = daysUntil <= 7 && daysUntil >= 0;

  const handleMorePress = () => {
    setShowActionMenu(true);
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 1,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeActionMenu = () => {
    // Animate out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowActionMenu(false);
    });
  };

  const handleEdit = () => {
    closeActionMenu();
    setTimeout(() => onEdit(subscription), 300);
  };

  const handleToggle = () => {
    closeActionMenu();
    setTimeout(() => onToggleActive(subscription.id, subscription.isActive), 300);
  };

  const handleDeletePress = () => {
    closeActionMenu();
    setTimeout(() => setShowDeleteConfirm(true), 300);
  };

  const handleDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    onDelete(subscription.id);
  };

  const slideTranslateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{subscription.name}</Text>
          {isUpcoming && subscription.isActive && (
            <Text style={styles.upcomingBadge}>
              {daysUntil === 0 ? 'Hari ini' : `${daysUntil} hari lagi`}
            </Text>
          )}
        </View>

        {subscription.description && (
          <Text style={styles.description} numberOfLines={1}>
            {subscription.description}
          </Text>
        )}

        <View style={styles.details}>
          <Text style={styles.amount}>{formatCurrency(subscription.amount)}</Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.cycle}>{getBillingCycleText(subscription.billingCycle)}</Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.date}>{formatDate(subscription.nextBillingDate)}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        {!subscription.isActive && (
          <Text style={styles.inactiveLabel}>Nonaktif</Text>
        )}
        <TouchableOpacity onPress={handleMorePress} style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Action Menu Modal */}
      <Modal
        visible={showActionMenu}
        transparent
        animationType="none"
        onRequestClose={closeActionMenu}
        statusBarTranslucent
      >
        <View style={{ flex: 1, paddingTop: 40 }}>
          <Pressable style={styles.modalOverlay} onPress={closeActionMenu}>
            <Animated.View 
              style={[
                styles.actionMenu,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideTranslateY }],
                }
              ]}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
                <View style={styles.actionMenuHeader}>
                  <Text style={styles.actionMenuTitle}>{subscription.name}</Text>
                  <Text style={styles.actionMenuSubtitle}>Pilih aksi</Text>
                </View>

                <TouchableOpacity style={styles.actionMenuItem} onPress={handleEdit}>
                  <View style={[styles.actionMenuIcon, { backgroundColor: '#eff6ff' }]}>
                    <Ionicons name="create-outline" size={18} color="#3b82f6" />
                  </View>
                  <Text style={styles.actionMenuText}>Edit</Text>
                  <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionMenuItem} onPress={handleToggle}>
                  <View style={[styles.actionMenuIcon, { backgroundColor: subscription.isActive ? '#fef3c7' : '#dcfce7' }]}>
                    <Ionicons 
                      name={subscription.isActive ? 'pause-circle-outline' : 'play-circle-outline'} 
                      size={18} 
                      color={subscription.isActive ? '#f59e0b' : '#22c55e'} 
                    />
                  </View>
                  <Text style={styles.actionMenuText}>
                    {subscription.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionMenuItem} onPress={handleDeletePress}>
                  <View style={[styles.actionMenuIcon, { backgroundColor: '#fee2e2' }]}>
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </View>
                  <Text style={[styles.actionMenuText, { color: '#ef4444' }]}>Hapus</Text>
                  <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.actionMenuCancel} 
                  onPress={closeActionMenu}
                >
                  <Text style={styles.actionMenuCancelText}>Batal</Text>
                </TouchableOpacity>
              </Pressable>
            </Animated.View>
          </Pressable>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
        statusBarTranslucent
      >
        <View style={{ flex: 1, paddingTop: 40 }}>
          <Pressable style={styles.modalOverlay} onPress={() => setShowDeleteConfirm(false)}>
            <Pressable style={styles.confirmDialog} onPress={(e) => e.stopPropagation()}>
              <View style={styles.confirmIcon}>
                <Ionicons name="warning" size={48} color="#f59e0b" />
              </View>

              <Text style={styles.confirmTitle}>Hapus Langganan</Text>
              <Text style={styles.confirmMessage}>
                Yakin ingin menghapus langganan "{subscription.name}"?
              </Text>

              <View style={styles.confirmButtons}>
                <TouchableOpacity
                  style={styles.confirmButtonCancel}
                  onPress={() => setShowDeleteConfirm(false)}
                >
                  <Text style={styles.confirmButtonCancelText}>Batal</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmButtonDelete}
                  onPress={handleDeleteConfirm}
                >
                  <Text style={styles.confirmButtonDeleteText}>Hapus</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  upcomingBadge: {
    fontSize: 12,
    fontWeight: '500',
    color: '#f59e0b',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  separator: {
    fontSize: 14,
    color: '#9ca3af',
  },
  cycle: {
    fontSize: 14,
    color: '#6b7280',
  },
  date: {
    fontSize: 12,
    color: '#9ca3af',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inactiveLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  moreButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: 40,
  },
  actionMenu: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionMenuHeader: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  actionMenuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  actionMenuSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  actionMenuIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionMenuText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  actionMenuCancel: {
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  actionMenuCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  confirmDialog: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 'auto',
    marginTop: 'auto',
  },
  confirmIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmButtonCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  confirmButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  confirmButtonDelete: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
  },
  confirmButtonDeleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
