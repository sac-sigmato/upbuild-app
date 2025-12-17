// app/_layout.tsx
import { Buffer } from "buffer";
import { Stack } from "expo-router";
import { Suspense } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import Toast from "react-native-toast-message";

import AuthenticatedSocketHandlers from "@/sockets/AuthenticatedSocketHandlers";
import SocketConnectionProvider from "@/sockets/SocketConnectionProvider";
import { useUserStore } from "@/store/useUserStore"; // Zustand / Context

global.Buffer = Buffer;

function LoadingFallback() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#1eb88c" />
      <Text>Loading...</Text>
    </View>
  );
}

export default function RootLayout() {
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <SocketConnectionProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen
            name="visitors/index"
            options={{ title: "Visitors", headerShown: true }}
          />
          <Stack.Screen
            name="visitors/add/index"
            options={{ title: "Add Visitor", headerShown: true }}
          />
        </Stack>

        {/* ✅ ONLY after login */}
        {isLoggedIn && <AuthenticatedSocketHandlers />}

        {/* ✅ Global toast */}
        <Toast />
      </SocketConnectionProvider>
    </Suspense>
  );
}
