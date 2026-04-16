import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#ebebeb',
          borderTopWidth: 1,
          height: 85,
          paddingTop: 8,
          paddingBottom: 28,
        },
        tabBarActiveTintColor: '#E1306C',
        tabBarInactiveTintColor: '#999',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerShown: useClientOnlyValue(false, false),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Deals',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22 }}>🍔</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: 22 }}>{focused ? '❤️' : '🤍'}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
