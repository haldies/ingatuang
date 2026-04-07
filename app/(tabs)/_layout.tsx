import { Tabs, useRouter } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, TouchableOpacity, Animated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { HapticTab } from '@/components/haptic-tab';
import { eventEmitter, EVENTS } from '@/lib/utils/events';

import { AddMenuModal } from '@/components/layout/add-menu-modal';
import { AddTransactionModal } from '@/components/transactions/add-transaction-modal';
import { AddSubscriptionModal } from '@/components/subscriptions/add-subscription-modal';
import { QuickAddModal } from '@/components/transactions/quick-add-modal';
import { Colors } from '@/constants/theme';
import { AppState } from 'react-native';

export default function TabLayout() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [quickAddText, setQuickAddText] = useState('');
  

  
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') eventEmitter.emit(EVENTS.APP_RESUMED);
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);
  

  
  const buttonScale = useRef(new Animated.Value(1)).current;
  const buttonOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isMenuOpen) {
      Animated.parallel([
        Animated.spring(buttonScale, { toValue: 3, useNativeDriver: true, tension: 50, friction: 7 }),
        Animated.timing(buttonOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true, tension: 50, friction: 7 }),
        Animated.timing(buttonOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [isMenuOpen]);

  const handleTransactionPress = () => { 
    setIsMenuOpen(false); 
    setTimeout(() => setIsTransactionModalOpen(true), 300);
  };
  const handleQuickAddPress = () => { 
    setIsMenuOpen(false); 
    setTimeout(() => setIsQuickAddModalOpen(true), 300);
  };
  const handleBudgetingPress = () => { 
    setIsMenuOpen(false); 
    setTimeout(() => setIsSubscriptionModalOpen(true), 300);
  };
  const handleSplitBillPress = () => { 
    setIsMenuOpen(false); 
    setTimeout(() => router.push('/split-bill'), 300);
  };

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.light.tint,
          tabBarInactiveTintColor: '#64748b',
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarShowLabel: true,
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#f1f5f9',
            paddingTop: 10,
            paddingBottom: Platform.select({ ios: insets.bottom > 0 ? insets.bottom + 8 : 24, default: 20 }),
            height: Platform.select({ ios: insets.bottom > 0 ? 88 + insets.bottom / 2 : 72, default: 72 }),
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginBottom: 4 },
        }}>
        <Tabs.Screen name="index" options={{ title: t('home'), tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} /> }} />
        <Tabs.Screen name="explore" options={{ title: t('stats'), tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'pie-chart' : 'pie-chart-outline'} size={24} color={color} /> }} />
        <Tabs.Screen
          name="add"
          options={{
            title: '',
            tabBarIcon: () => null,
            tabBarButton: () => (
              <View style={{ flex: 1, alignItems: 'center' }}>
                <TouchableOpacity
                  onPress={() => setIsMenuOpen(true)}
                  activeOpacity={0.9}
                  style={{
                    top: -28,
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    backgroundColor: Colors.light.tint,
                    borderWidth: 4,
                    borderColor: '#fff',
                    justifyContent: 'center',
                    alignItems: 'center',
                    elevation: 10,
                    shadowColor: Colors.light.tint,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                  }}
                >
                  <Animated.View style={{ transform: [{ scale: buttonScale }], opacity: buttonOpacity }}>
                    <Ionicons name="add" size={32} color="#fff" />
                  </Animated.View>
                </TouchableOpacity>
              </View>
            ),
          }}
        />
        <Tabs.Screen name="budgeting" options={{ title: t('budgeting'), tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={24} color={color} /> }} />
        <Tabs.Screen name="profile" options={{ title: t('setting'), tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'settings' : 'settings-outline'} size={24} color={color} /> }} />
      </Tabs>

      <AddMenuModal visible={isMenuOpen} onClose={() => setIsMenuOpen(false)} onTransactionPress={handleTransactionPress} onQuickAddPress={handleQuickAddPress} onSubscriptionPress={handleBudgetingPress} onSplitBillPress={handleSplitBillPress} />
      <AddTransactionModal visible={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} onSuccess={() => { setIsTransactionModalOpen(false); eventEmitter.emit(EVENTS.TRANSACTION_ADDED); }} />
      <QuickAddModal visible={isQuickAddModalOpen} onClose={() => { setIsQuickAddModalOpen(false); setQuickAddText(''); }} onSuccess={() => { setIsQuickAddModalOpen(false); eventEmitter.emit(EVENTS.TRANSACTION_ADDED); }} initialText={quickAddText} />
      <AddSubscriptionModal visible={isSubscriptionModalOpen} onClose={() => setIsSubscriptionModalOpen(false)} onSuccess={() => { setIsSubscriptionModalOpen(false); eventEmitter.emit(EVENTS.SUBSCRIPTION_ADDED); }} />
    </>
  );
}
