import { Tabs } from 'expo-router';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AddMenuModal } from '@/components/layout/add-menu-modal';
import { AddTransactionModal } from '@/components/transactions/add-transaction-modal';
import { AddSubscriptionModal } from '@/components/subscriptions/add-subscription-modal';
import { eventEmitter, EVENTS } from '@/lib/events';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  const handleTransactionPress = () => {
    setIsMenuOpen(false);
    setIsTransactionModalOpen(true);
  };

  const handleSubscriptionPress = () => {
    setIsMenuOpen(false);
    setIsSubscriptionModalOpen(true);
  };

  const handleTransactionSuccess = () => {
    setIsTransactionModalOpen(false);
    // Emit event to refresh dashboard
    eventEmitter.emit(EVENTS.TRANSACTION_ADDED);
  };

  const handleSubscriptionSuccess = () => {
    setIsSubscriptionModalOpen(false);
    // Emit event to refresh subscriptions
    eventEmitter.emit(EVENTS.SUBSCRIPTION_ADDED);
  };

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#3b82f6', // Blue color for active tab
          tabBarInactiveTintColor: '#6b7280', // Gray color for inactive tab
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            height: Platform.OS === 'ios' ? 64 + insets.bottom : 64,
            paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
            paddingTop: 8,
            backgroundColor: '#ffffff', // White background
            borderTopWidth: 1,
            borderTopColor: '#e5e7eb',
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '500',
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Stats',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'pie-chart' : 'pie-chart-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: 'Tambah',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'add-circle' : 'add-circle-outline'} size={24} color={color} />
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setIsMenuOpen(true);
            },
          }}
        />
        <Tabs.Screen
          name="subscriptions"
          options={{
            title: 'Subs',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
            ),
          }}
        />
      </Tabs>

      {/* Add Menu Modal */}
      <AddMenuModal
        visible={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onTransactionPress={handleTransactionPress}
        onSubscriptionPress={handleSubscriptionPress}
      />

      {/* Transaction Modal */}
      <AddTransactionModal
        visible={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSuccess={handleTransactionSuccess}
      />

      {/* Subscription Modal */}
      <AddSubscriptionModal
        visible={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        onSuccess={handleSubscriptionSuccess}
      />
    </>
  );
}
