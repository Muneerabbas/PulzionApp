import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../src/context/ThemeContext';
import { useT } from '../../src/utils/tMiddleware';
export default function TabLayout() {
  const { colors } = useTheme();
  const { T, Tx, color, fb,fm,fr,mv } = useT();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.secondary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.tabbarbg ,
          borderTopRightRadius:25,
          borderTopLeftRadius:25,
          height:70,
    elevation:0,
           borderTopWidth: 0,
        },
         tabBarItemStyle: {
      marginVertical: 5,
    },
  
      }}
    >
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

        <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'search' : 'search-outline'} size={20} color={color} />
          ),
          tabBarLabelStyle: Tx(fr(10)),
          tabBarLabelPosition: 'below-icon', 
        }}
      />
<Tabs.Screen
        name="trending"
        options={{
          title: 'Trending',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'flame' : 'flame-outline'} size={20} color={color} />
          ),
          tabBarLabelStyle: T(fr(10)),
          tabBarLabelPosition: 'below-icon', 
        }}
      />
      <Tabs.Screen
        name="bookmark"
        options={{
          title: 'Bookmark',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'bookmark' : 'bookmark-outline'} size={20} color={color} />
          ),
          tabBarLabelStyle: T(fr(10)),
          tabBarLabelPosition: 'below-icon', 
        }}
      />

      
       <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={20} color={color} />
          ),
          tabBarLabelStyle: Tx(fr(10)),  
          tabBarLabelPosition: 'below-icon', 
        }}
      />
          
    </Tabs>
  );
}
