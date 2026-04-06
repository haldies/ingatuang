import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { BlurView } from 'expo-blur';

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
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const blurOpacity = useRef(new Animated.Value(0)).current;
  
  // Animasi untuk setiap item
  const item1Anim = useRef(new Animated.Value(0)).current;
  const item2Anim = useRef(new Animated.Value(0)).current;
  const item3Anim = useRef(new Animated.Value(0)).current;
  const item4Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset semua animasi
      item1Anim.setValue(0);
      item2Anim.setValue(0);
      item3Anim.setValue(0);
      item4Anim.setValue(0);
      
      // Fade in overlay dan blur
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(blurOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Item muncul satu per satu dengan delay
      const staggerDelay = 80; // Delay antar item
      
      Animated.stagger(staggerDelay, [
        Animated.spring(item1Anim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 8,
        }),
        Animated.spring(item2Anim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 8,
        }),
        Animated.spring(item3Anim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 8,
        }),
        Animated.spring(item4Anim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 8,
        }),
      ]).start();
    } else {
      // Animasi keluar - semua sekaligus
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(blurOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(item1Anim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(item2Anim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(item3Anim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(item4Anim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getItemStyle = (animValue: Animated.Value) => {
    const translateY = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [100, 0],
    });
    
    const scale = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    });

    return {
      opacity: animValue,
      transform: [
        { translateY },
        { scale },
      ],
    };
  };

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: blurOpacity }]}>
          <BlurView 
            intensity={100} 
            tint="light" 
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <TouchableOpacity 
          style={styles.overlayTouchable} 
          activeOpacity={1} 
          onPress={onClose}
        >
          <Animated.View style={styles.menuContainer}>
            {/* Catat Transaksi */}
            <Animated.View style={getItemStyle(item1Anim)}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={onTransactionPress}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="receipt-outline" size={20} color="#374151" />
                </View>
                <Text style={styles.menuTitle}>Input Manual</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Quick Add AI */}
            <Animated.View style={getItemStyle(item2Anim)}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={onQuickAddPress}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="sparkles-outline" size={20} color="#374151" />
                </View>
                <Text style={styles.menuTitle}>Quick Add</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Langganan */}
            <Animated.View style={getItemStyle(item3Anim)}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={onSubscriptionPress}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="calendar-outline" size={20} color="#374151" />
                </View>
                <Text style={styles.menuTitle}>Langganan</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Split Bill */}
            <Animated.View style={getItemStyle(item4Anim)}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={onSplitBillPress}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="git-branch-outline" size={20} color="#374151" />
                </View>
                <Text style={styles.menuTitle}>Split Bill</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  overlayTouchable: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 100,
  },
  menuContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 18,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    gap: 10,
    marginBottom: 2,
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
});
