import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated, Platform } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { BlurView } from 'expo-blur';
import { Colors } from '@/constants/theme';

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
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const opacityAnim = useRef(new Animated.Value(0)).current;
  const blurOpacity = useRef(new Animated.Value(0)).current;
  
  // Animasi untuk setiap item
  const item1Anim = useRef(new Animated.Value(0)).current;
  const item2Anim = useRef(new Animated.Value(0)).current;
  const item3Anim = useRef(new Animated.Value(0)).current;
  const item4Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      item1Anim.setValue(0);
      item2Anim.setValue(0);
      item3Anim.setValue(0);
      item4Anim.setValue(0);
      
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

      const staggerDelay = 80;
      
      Animated.stagger(staggerDelay, [
        Animated.spring(item1Anim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
        Animated.spring(item2Anim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
        Animated.spring(item3Anim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
        Animated.spring(item4Anim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(blurOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(item1Anim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(item2Anim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(item3Anim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(item4Anim, { toValue: 0, duration: 150, useNativeDriver: true }),
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
            intensity={isDark ? 50 : 100} 
            tint={isDark ? "dark" : "light"} 
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <TouchableOpacity 
          style={styles.overlayTouchable} 
          activeOpacity={1} 
          onPress={onClose}
        >
          <Animated.View style={[styles.menuContainer, { backgroundColor: theme.background }]}>
            {/* Input Manual */}
            <Animated.View style={getItemStyle(item1Anim)}>
              <TouchableOpacity style={styles.menuItem} onPress={onTransactionPress} activeOpacity={0.7}>
                <View style={[styles.iconContainer, { backgroundColor: theme.card }]}>
                  <Ionicons name="receipt-outline" size={20} color={isDark ? theme.text : '#374151'} />
                </View>
                <Text style={[styles.menuTitle, { color: theme.text }]}>Input Manual</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Quick Add */}
            <Animated.View style={getItemStyle(item2Anim)}>
              <TouchableOpacity style={styles.menuItem} onPress={onQuickAddPress} activeOpacity={0.7}>
                <View style={[styles.iconContainer, { backgroundColor: theme.card }]}>
                  <Ionicons name="sparkles-outline" size={20} color={isDark ? theme.text : '#374151'} />
                </View>
                <Text style={[styles.menuTitle, { color: theme.text }]}>Quick Add</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Langganan */}
            <Animated.View style={getItemStyle(item3Anim)}>
              <TouchableOpacity style={styles.menuItem} onPress={onSubscriptionPress} activeOpacity={0.7}>
                <View style={[styles.iconContainer, { backgroundColor: theme.card }]}>
                  <Ionicons name="calendar-outline" size={20} color={isDark ? theme.text : '#374151'} />
                </View>
                <Text style={[styles.menuTitle, { color: theme.text }]}>Langganan</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Split Bill */}
            <Animated.View style={getItemStyle(item4Anim)}>
              <TouchableOpacity style={styles.menuItem} onPress={onSplitBillPress} activeOpacity={0.7}>
                <View style={[styles.iconContainer, { backgroundColor: theme.card }]}>
                  <Ionicons name="git-branch-outline" size={20} color={isDark ? theme.text : '#374151'} />
                </View>
                <Text style={[styles.menuTitle, { color: theme.text }]}>Split Bill</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  overlayTouchable: { flex: 1, justifyContent: 'flex-end', paddingBottom: 100 },
  menuContainer: {
    marginHorizontal: 24,
    marginBottom: 20,
    borderRadius: 18,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
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
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
});
