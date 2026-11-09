import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAppStore } from "../state/appStore";
import { useAuthStore } from "../state/authStore";
import { colors } from "../theme";

export default function RootLayout() {
  const hydrate = useAppStore((state) => state.hydrate);
  const restoreSession = useAuthStore((state) => state.restoreSession);
  useEffect(() => {
    void hydrate();
    void restoreSession();
  }, [hydrate, restoreSession]);
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas }, animation: "slide_from_right" }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="profile" options={{ presentation: "card" }} />
        <Stack.Screen name="subscription" options={{ presentation: "card" }} />
        <Stack.Screen name="auth/login" options={{ presentation: "card" }} />
        <Stack.Screen name="auth/register" options={{ presentation: "card" }} />
        <Stack.Screen name="auth/forgot-password" options={{ presentation: "card" }} />
        <Stack.Screen name="reference" />
        <Stack.Screen name="projects" />
        <Stack.Screen name="tools/[id]" />
        <Stack.Screen name="studio/[id]" options={{ gestureEnabled: false }} />
        <Stack.Screen name="camera" options={{ presentation: "fullScreenModal", animation: "fade" }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
