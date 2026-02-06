import { Buffer } from "buffer";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { Suspense, useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import Toast from "react-native-toast-message";

import AuthenticatedSocketHandlers from "@/sockets/AuthenticatedSocketHandlers";
import SocketConnectionProvider from "@/sockets/SocketConnectionProvider";
import { useUserStore } from "@/store/useUserStore";
import { setupAndroidNotifications } from "./notifications";

global.Buffer = Buffer;

/* 🔔 REQUIRED: Notification handler (TOP LEVEL ONLY) */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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

  /* ✅ CORRECT PLACE for useEffect */
  useEffect(() => {
    setupAndroidNotifications();
  }, []);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <SocketConnectionProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen
            name="visitors/index"
            options={{ title: "Visitors", headerShown: false }}
          />
          <Stack.Screen
            name="visitors/add/index"
            options={{ title: "Add Visitor", headerShown: false }}
          />
          <Stack.Screen name="profile/index" options={{ headerShown: false }} />
          <Stack.Screen
            name="visitors/bulkVisit/index"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="visitors/bulkVisit/bulkVisitorDetails/index"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="visitors/scan/index"
            options={{ headerShown: false }}
          />
        </Stack>

        {isLoggedIn && <AuthenticatedSocketHandlers />}

        <Toast />
      </SocketConnectionProvider>
    </Suspense>
  );
}
