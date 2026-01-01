import { Tabs, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { AddMenuModal } from '@/components/layout/add-menu-modal';
import { AddTransactionModal } from '@/components/transactions/add-transaction-modal';
import { AddSubscriptionModal } from '@/components/subscriptions/add-subscription-modal';
import { QuickAddModal } from '@/components/transactions/quick-add-modal';
import { eventEmitter, EVENTS } from '@/lib/events';

export default function TabLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  const handleTransactionPress = () => {
    setIsMenuOpen(false);
    setIsTransactionModalOpen(true);
  };

  const handleQuickAddPress = () => {
    setIsMenuOpen(false);
    setIsQuickAddModalOpen(true);
  };

  const handleSubscriptionPress = () => {
    setIsMenuOpen(false);
    setIsSubscriptionModalOpen(true);
  };

  const handleSplitBillPress = () => {
    setIsMenuOpen(false);
    router.push('/split-bill/create');
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
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: 8,
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#e5e7eb',
          },
          tabBarItemStyle: {
            paddingVertical: 4,
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
            title: '',
            tabBarIcon: () => null,
            tabBarButton: () => (
              <TouchableOpacity
                className="flex-1 justify-center items-center -mt-2"
                onPress={() => setIsMenuOpen(true)}
                activeOpacity={0.8}
              >
                <View className="w-14 h-14 rounded-full bg-blue-500 justify-center items-center">
                  <Ionicons name="add" size={28} color="#fff" />
                </View>
              </TouchableOpacity>
            ),
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
        onQuickAddPress={handleQuickAddPress}
        onSubscriptionPress={handleSubscriptionPress}
        onSplitBillPress={handleSplitBillPress}
      />

      {/* Transaction Modal */}
      <AddTransactionModal
        visible={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSuccess={handleTransactionSuccess}
      />

      {/* Quick Add Modal */}
      <QuickAddModal
        visible={isQuickAddModalOpen}
        onClose={() => setIsQuickAddModalOpen(false)}
        onSuccess={handleQuickAddSuccess}
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
