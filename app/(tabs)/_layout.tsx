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

export default function TabLayout() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  
  const buttonScale = useRef(new Animated.Value(1)).current;
  const buttonOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isMenuOpen) {
      Animated.parallel([
        Animated.spring(buttonScale, {
          toValue: 3,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(buttonOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(buttonScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(buttonOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isMenuOpen]);

  const handleTransactionPress = () => {
    setIsMenuOpen(false);
    setIsTransactionModalOpen(true);
  };

  const handleQuickAddPress = () => {
    setIsMenuOpen(false);
    setIsQuickAddModalOpen(true);
  };

  const handleBudgetingPress = () => {
    setIsMenuOpen(false);
    setIsSubscriptionModalOpen(true);
  };

  const handleSplitBillPress = () => {
    setIsMenuOpen(false);
    router.push('/split-bill');
  };

  const handleTransactionSuccess = () => {
    setIsTransactionModalOpen(false);
    eventEmitter.emit(EVENTS.TRANSACTION_ADDED);
  };

  const handleQuickAddSuccess = () => {
    setIsQuickAddModalOpen(false);
    eventEmitter.emit(EVENTS.TRANSACTION_ADDED);
  };

  const handleSubscriptionSuccess = () => {
    setIsSubscriptionModalOpen(false);
    eventEmitter.emit(EVENTS.SUBSCRIPTION_ADDED);
  };

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#3b82f6',
          tabBarInactiveTintColor: '#6b7280',
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarShowLabel: true,
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#f1f5f9',
            paddingTop: 10,
            paddingBottom: Platform.OS === 'ios' ? (insets.bottom > 0 ? insets.bottom + 4 : 14) : 14,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarItemStyle: {
            paddingVertical: 4,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
            marginTop: 0,
            marginBottom: 4,
          },
          tabBarIconStyle: {
            marginTop: 4,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: t('home'),
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: t('stats'),
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'pie-chart' : 'pie-chart-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: '',
            tabBarIcon: () => null,
            tabBarButton: (props) => (
              <View style={{ flex: 1, alignItems: 'center' }}>
                <TouchableOpacity
                  onPress={() => setIsMenuOpen(true)}
                  activeOpacity={0.9}
                  style={{
                    top: -32,
                    width: 62,
                    height: 62,
                    borderRadius: 31,
                    backgroundColor: '#3b82f6',
                    borderWidth: 5,
                    borderColor: '#fff',
                    justifyContent: 'center',
                    alignItems: 'center',
                    elevation: 0,
                  }}
                >
                  <Animated.View 
                    style={{
                      transform: [{ scale: buttonScale }],
                      opacity: buttonOpacity,
                    }}
                  >
                    <Ionicons name="add" size={32} color="#fff" />
                  </Animated.View>
                </TouchableOpacity>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="budgeting"
          options={{
            title: t('budgeting'),
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('setting'),
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'settings' : 'settings-outline'} size={24} color={color} />
            ),
          }}
        />
        
        {/* Strictly hiding subscriptions as requested */}
        <Tabs.Screen name="subscriptions" options={{ href: null }} />
      </Tabs>

      {/* Modals remains unchanged */}
      {isMenuOpen && (
        <AddMenuModal
          visible={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          onTransactionPress={handleTransactionPress}
          onQuickAddPress={handleQuickAddPress}
          onSubscriptionPress={handleBudgetingPress}
          onSplitBillPress={handleSplitBillPress}
        />
      )}

      {isTransactionModalOpen && (
        <AddTransactionModal
          visible={isTransactionModalOpen}
          onClose={() => setIsTransactionModalOpen(false)}
          onSuccess={handleTransactionSuccess}
        />
      )}

      {isQuickAddModalOpen && (
        <QuickAddModal
          visible={isQuickAddModalOpen}
          onClose={() => setIsQuickAddModalOpen(false)}
          onSuccess={handleQuickAddSuccess}
        />
      )}

      {isSubscriptionModalOpen && (
        <AddSubscriptionModal
          visible={isSubscriptionModalOpen}
          onClose={() => setIsSubscriptionModalOpen(false)}
          onSuccess={handleSubscriptionSuccess}
        />
      )}
    </>
  );
}
