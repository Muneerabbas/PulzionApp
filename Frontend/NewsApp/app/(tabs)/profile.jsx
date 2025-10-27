import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useT } from '../../src/utils/tMiddleware';
import { useRouter } from 'expo-router';

const Profile = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { colors, theme, toggleTheme } = useTheme();
  const { T, fb, fr, color, bg, flex, jc, ai, p, mv, mt, fs } = useT();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/auth');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={T(flex(1), bg(colors.primary))}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { backgroundColor: colors.primary },
        ]}
      >
        <Text
          style={T(fb(20), color(colors.text), ai('center'), mv(20), fs(22))}
        >
          Settings
        </Text>

        <View style={styles.profileContainer}>
          <Image
            source={
              user?.photo
                ? { uri: user.photo }
                : require('../../assets/images/default-avatar.png')
            }
            style={styles.avatar}
          />
          <Text style={[styles.username, { color: colors.text }]}>
            {user?.username || 'Jason Todd'}
          </Text>
          <Text style={[styles.email, { color: colors.muted }]}>
            {user?.email || 'therealjason@gmail.com'}
          </Text>
        </View>

        

        <Text
          style={[
            styles.sectionHeader,
            { color: colors.text, marginTop: 30 },
          ]}
        >
          Your Activity
        </Text>

        <TouchableOpacity
          style={[styles.optionCard, { backgroundColor: colors.card }]}
        >
          <Ionicons
            name="newspaper-outline"
            size={22}
            color={colors.text}
            style={{ marginRight: 10 }}
          />
          <Text style={[styles.optionText, { color: colors.text }]}>
            Published Articles
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionCard, { backgroundColor: colors.card }]}
        >
          <Ionicons
            name="heart-outline"
            size={22}
            color={colors.text}
            style={{ marginRight: 10 }}
          />
          <Text style={[styles.optionText, { color: colors.text }]}>
            Liked Articles
          </Text>
        </TouchableOpacity>

        {/* General Section */}
        <Text style={[styles.sectionHeader, { color: colors.text }]}>
          General
        </Text>

        <TouchableOpacity
          style={[styles.optionCard, { backgroundColor: colors.card }]}
        >
          <Ionicons
            name="person-outline"
            size={22}
            color={colors.text}
            style={{ marginRight: 10 }}
          />
          <Text style={[styles.optionText, { color: colors.text }]}>
            Personal Data
          </Text>
        </TouchableOpacity>

        <View
          style={[
            styles.optionCard,
            { backgroundColor: colors.card, justifyContent: 'space-between' },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons
              name="notifications-outline"
              size={22}
              color={colors.text}
              style={{ marginRight: 10 }}
            />
            <Text style={[styles.optionText, { color: colors.text }]}>
              Dark Theme
            </Text>
          </View>
          <Switch
            value={theme === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: '#d3d3d3', true: '#007AFF' }}
            thumbColor={theme === 'dark' ? '#fff' : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity
          style={[styles.optionCard, { backgroundColor: colors.card }]}
        >
          <Ionicons
            name="settings-outline"
            size={22}
            color={colors.text}
            style={{ marginRight: 10 }}
          />
          <Text style={[styles.optionText, { color: colors.text }]}>
            Settings
          </Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#fff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={[styles.footer, { color: colors.muted }]}>
          Made with 💖 in PICT
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  avatar: {
    maxHeight:90,
    maxWidth:90,

    borderRadius: 45,
    marginBottom: 12,
  },
  username: {
    fontSize: 20,
    fontFamily: 'MonaSans-Bold',
  },
  email: {
    fontSize: 14,
    fontFamily: 'MonaSans-Regular',
  },
  proCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
  },
  proTitle: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'MonaSans-Bold',
  },
  proSubtitle: {
    color: '#fff',
    fontSize: 13,
    opacity: 0.8,
  },
  upgradeBtn: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  upgradeText: {
    color: '#007AFF',
    fontFamily: 'MonaSans-Bold',
  },
  sectionHeader: {
    fontSize: 16,
    fontFamily: 'MonaSans-Bold',
    marginBottom: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  optionText: {
    fontSize: 15,
    fontFamily: 'MonaSans-Medium',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'MonaSans-Bold',
  },
  footer: {
    textAlign: 'center',
    marginTop: 100,
    fontSize: 13,
    fontFamily: 'MonaSans-Regular',
  },
});

export default Profile;
