import { Buffer } from "buffer";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { Suspense, useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import Toast from "react-native-toast-message";

import { setupAndroidNotifications } from "@/services/notifications";
import AuthenticatedSocketHandlers from "@/sockets/AuthenticatedSocketHandlers";
import SocketConnectionProvider from "@/sockets/SocketConnectionProvider";
import { useUserStore } from "@/store/useUserStore";

if (!global.Buffer) {
  global.Buffer = Buffer;
}

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

  useEffect(() => {
    if (Constants.appOwnership !== "expo") {
      setupAndroidNotifications();
    }
  }, []);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <SocketConnectionProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen
            name="visitors/index"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="visitors/add/index"
            options={{ headerShown: false }}
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
