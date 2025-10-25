import { Stack, useRouter, useSegments } from "expo-router";
import { useFonts } from "expo-font";
import { View, ActivityIndicator } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, useTheme } from "../src/context/ThemeContext";
import { AuthProvider, useAuth } from "../src/context/AuthContext";

SplashScreen.preventAutoHideAsync();

function LayoutContent() {
  const { colors } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [introSkipped, setIntroSkipped] = useState(null);
  const [isCheckingIntro, setIsCheckingIntro] = useState(true);

  useEffect(() => {
    checkIntroStatus();
  }, []);

  const checkIntroStatus = async () => {
    try {
      const value = await AsyncStorage.getItem('@intro_skipped');
      setIntroSkipped(value === 'true');
    } catch (error) {
      console.error('Error checking intro status:', error);
      setIntroSkipped(false);
    } finally {
      setIsCheckingIntro(false);
    }
  };

  useEffect(() => {
    if (isLoading || isCheckingIntro || introSkipped === null) return;

    const inAuthGroup = segments[0] === 'auth';
    const inIntroScreen = segments[0] === 'intro';
    const inTabs = segments[0] === '(tabs)';
    const inIndex = segments.length === 0;

    if (!inIndex) return;

    if (isAuthenticated) {
      router.replace('/(tabs)');
      return;
    }

    if (!isAuthenticated) {
      if (introSkipped) {
        router.replace('/auth');
        return;
      }
      
      if (!introSkipped) {
        router.replace('/intro');
        return;
      }
    }
  }, [isAuthenticated, isLoading, segments, introSkipped, isCheckingIntro]);

  if (isLoading || isCheckingIntro) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.primary }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.primary },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="intro" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "MonaSans-Regular": require("../assets/fonts/MonaSans-Regular.ttf"),
    "MonaSans-Medium": require("../assets/fonts/MonaSans-Medium.ttf"),
    "MonaSans-Bold": require("../assets/fonts/MonaSans-Bold.ttf"),
    "MonaSans-SemiBold": require("../assets/fonts/MonaSans-SemiBold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <AuthProvider>
        <LayoutContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
