import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import GluestackInitializer from "@/components/GluestackInitializer";
import useColorScheme from "@/hooks/useColorScheme";
import { Stack, useRouter } from "expo-router";
import { useAppStore } from "@/lib/store";

// Initialize CatDoes Watch for error tracking
// Set EXPO_PUBLIC_CATDOES_WATCH_KEY in your environment to enable
import { initCatDoesWatch } from "@/catdoes.watch";
initCatDoesWatch();

SplashScreen.preventAutoHideAsync();

// Must be inside Stack so useRouter works
function CallNavigator() {
  const router = useRouter();
  const callStatus = useAppStore((s) => s.callStatus);
  useEffect(() => {
    if (callStatus === "incoming") router.push("/incoming-call");
    else if (callStatus === "outgoing" || callStatus === "active") router.push("/call");
  }, [callStatus]);
  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  /*
   * IMPORTANT: DO NOT REMOVE GluestackInitializer OR ErrorBoundary */
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <GluestackInitializer colorScheme={colorScheme}>
          <CallNavigator />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "white" },
          }}
        >
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="new-chat" options={{ headerShown: false }} />
          <Stack.Screen name="machine-map" options={{ headerShown: false }} />
          <Stack.Screen name="machine-inventory" options={{ headerShown: false }} />
          <Stack.Screen name="scanner" options={{ headerShown: false, presentation: "fullScreenModal" }} />
          <Stack.Screen name="call" options={{ headerShown: false, presentation: "fullScreenModal" }} />
          <Stack.Screen name="incoming-call" options={{ headerShown: false, presentation: "fullScreenModal" }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </GluestackInitializer>
    </ErrorBoundary>
    </GestureHandlerRootView>
  );
}