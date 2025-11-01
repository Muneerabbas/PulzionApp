import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/context/ThemeContext";
import { useT } from "../../src/utils/tMiddleware";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';

const Profile = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { colors, theme, toggleTheme } = useTheme();
  const { T, fb, fr, color, bg, flex, ai, mv, fs } = useT();
  const [subscribed, setSubscribed] = useState(false);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/auth");
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
        {/* Header */}
        <Text
          style={T(fb(20), color(colors.text), ai("center"), mv(20), fs(22))}
        >
          Settings
        </Text>

        {/* Profile Section */}
        <View style={styles.profileContainer}>
          <Image
            source={
              user?.photo
                ? { uri: user.photo }
                : require("../../assets/images/default-avatar.png")
            }
            style={styles.avatar}
          />
          <Text style={[styles.username, { color: colors.text }]}>
            {user?.username || "Jason Todd"}
          </Text>
          <Text style={[styles.email, { color: colors.muted }]}>
            {user?.email || "therealjason@gmail.com"}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          style={{ marginTop: 6, marginBottom: 10 }}
          onPress={() => setSubscribed((s) => !s)}
        >
          <LinearGradient
            colors={subscribed ? ["#22c55e", "#16a34a"] : ["#8b5cf6", "#6366f1", "#22c55e"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.subscribeBtn}
          >
            <Ionicons
              name={subscribed ? "checkmark-circle-outline" : "mail-open-outline"}
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.subscribeText}>{subscribed ? "Subscribed" : "Subscribe"}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Activity Section */}
        <Text style={[styles.sectionHeader, { color: colors.text }]}>
          Your Activity
        </Text>

        <TouchableOpacity
          style={[styles.optionCard, { backgroundColor: colors.tabbarbg }]}
        >
          <MaterialCommunityIcons
            name={theme === "dark" ? "bookmark-outline" : "bookmark-outline"}
            size={22}
            color={colors.text}
            style={{ marginRight: 10 }}
          />
          <Text style={[styles.optionText, { color: colors.text }]}>
            BookMarks
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionCard, { backgroundColor: colors.tabbarbg }]}
        >
          <Ionicons
            name={theme === "dark" ? "heart" : "heart-outline"}
            size={22}
            color={colors.text}
            style={{ marginRight: 10 }}
          />
          <Text style={[styles.optionText, { color: colors.text }]}>
            Liked Articles
          </Text>
        </TouchableOpacity>

        <Text style={[styles.sectionHeader, { color: colors.text }]}>
          General
        </Text>

        <TouchableOpacity
          style={[styles.optionCard, { backgroundColor: colors.tabbarbg }]}
        >
          <Ionicons
            name={theme === "dark" ? "person-circle" : "person-circle-outline"}
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
            {
              backgroundColor: colors.tabbarbg,
              justifyContent: "space-between",
            },
          ]}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons
              name={theme === "dark" ? "moon" : "moon-outline"}
              size={22}
              color={colors.text}
              style={{ marginRight: 10 }}
            />
            <Text style={[styles.optionText, { color: colors.text }]}>
              Dark Theme
            </Text>
          </View>
          <Switch
            value={theme === "dark"}
            onValueChange={toggleTheme}
            trackColor={{ false: "#d3d3d3", true: "#007AFF" }}
            thumbColor={theme === "dark" ? "#fff" : "#f4f3f4"}
          />
        </View>

        <TouchableOpacity
          style={[styles.optionCard, { backgroundColor: colors.tabbarbg }]}
        >
          <Ionicons
            name={theme=="dark" ? "help-circle" : "help-circle-outline"}
            size={22}
            color={colors.text}
            style={{ marginRight: 10 }}
          />
          <Text style={[styles.optionText, { color: colors.text }]}>
            Help & Support
          </Text>
        </TouchableOpacity>

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
    alignItems: "center",
    marginBottom: 25,
  
   
  },
  avatar: {
    height: 90,
    width: 90,
    borderRadius: 45,
    resizeMode: "cover",
    borderColor: "#222",
    borderWidth: 1,
    marginBottom: 12,
  },
  username: {
    fontSize: 20,
    fontFamily: "MonaSans-Bold",
  },
  email: {
    fontSize: 14,
    fontFamily: "MonaSans-Regular",
  },
  sectionHeader: {
    fontSize: 16,
    fontFamily: "MonaSans-Bold",
    marginBottom: 10,
    marginTop: 10,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  optionText: {
    fontSize: 15,
    fontFamily: "MonaSans-Medium",
  },
  subscribeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    // shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    // elevation for Android
    elevation: 4,
  },
  subscribeText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'MonaSans-Bold',
    letterSpacing: 0.3,
  },
  logoutButton: {
    backgroundColor: "#FF3B30",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "MonaSans-Bold",
  },
  footer: {
    textAlign: "center",
    marginBottom: 70,
    marginTop:50,
    fontSize: 13,
    fontFamily: "MonaSans-Regular",
  },
});

export default Profile;
