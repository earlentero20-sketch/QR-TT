import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';

import { COLORS } from '@/constants/colors';
import { useAuth } from '@/lib/auth';
import { getProfile, isTeacherRole, normalizeRole } from '@/lib/profiles';

export default function TabsLayout() {
  const { user, loading } = useAuth();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setRole(null);
      return;
    }

    getProfile(user.id).then((profile) => {
      setRole(normalizeRole(profile?.role));
    });
  }, [user?.id]);

  if (loading || !user || role === null) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopWidth: 0,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={24} />
          ),
        }}
      />
      {role !== 'teacher' && (
        <Tabs.Screen
          name="scan"
          options={{
            title: 'Scan',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'scan' : 'scan-outline'} color={color} size={24} />
            ),
          }}
        />
      )}
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'time' : 'time-outline'} color={color} size={24} />
          ),
        }}
      />
      {isTeacherRole(role) && (
        <Tabs.Screen
          name="teacher"
          options={{
            title: 'Teacher',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'clipboard' : 'clipboard-outline'} color={color} size={24} />
            ),
          }}
        />
      )}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} color={color} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}