import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../src/context/ThemeContext';
import { useT } from '../../src/utils/tMiddleware';

export default function TabLayout() {
  const { colors } = useTheme();
  const { T, Tx, fr } = useT();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.secondary,
        tabBarInactiveTintColor: colors.muted,
        // 👇 Transparent floating tab bar
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: colors.tabbarbg, 
          borderRadius: 30,
          marginHorizontal: 5,
          paddingHorizontal:10,
          marginBottom: 10,
          height: 70,
          borderTopWidth: 0,
          elevation: 0,
          shadowColor: 'transparent',
        },
        tabBarBackground: () => null, 
        tabBarItemStyle: {
          marginVertical: 5,
        },
      }}
    >
      {/* 🏠 Home */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={20}
              color={color}
            />
          ),
          tabBarLabelStyle: Tx(fr(10)),
          tabBarLabelPosition: 'below-icon',
        }}
      />

      {/* 🔍 Explore */}
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'search' : 'search-outline'}
              size={20}
              color={color}
            />
          ),
          tabBarLabelStyle: Tx(fr(10)),
          tabBarLabelPosition: 'below-icon',
        }}
      />

      {/* 🔥 Trending */}
      <Tabs.Screen
        name="trending"
        options={{
          title: 'Trending',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'flame' : 'flame-outline'}
              size={20}
              color={color}
            />
          ),
          tabBarLabelStyle: Tx(fr(10)),
          tabBarLabelPosition: 'below-icon',
        }}
      />

      {/* 🔖 Bookmark */}
      <Tabs.Screen
        name="bookmark"
        options={{
          title: 'Bookmark',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={color}
            />
          ),
          tabBarLabelStyle: Tx(fr(10)),
          tabBarLabelPosition: 'below-icon',
        }}
      />

      {/* 👤 Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={20}
              color={color}
            />
          ),
          tabBarLabelStyle: Tx(fr(10)),
          tabBarLabelPosition: 'below-icon',
        }}
      />
    </Tabs>
  );
}
