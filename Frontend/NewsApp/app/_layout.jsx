import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { Text } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { ThemeProvider } from "../src/context/ThemeContext";
import { T } from "../src/utils/tMiddleware";
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "MonaSans-Regular": require("../assets/fonts/MonaSans-Regular.ttf"),
    "MonaSans-Medium": require("../assets/fonts/MonaSans-Medium.ttf"),
    "MonaSans-Bold": require("../assets/fonts/MonaSans-Bold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
      // Text.defaultProps = Text.defaultProps || {};
      // Text.defaultProps.style = { fontFamily: "MonaSans-Regular" };
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
     
    <Stack
      screenOptions={{
      }}
    >
      {/* <Stack.Screen name="index" options={{ title: "NewsApp" }} /> */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
    </ThemeProvider>
  );
}
