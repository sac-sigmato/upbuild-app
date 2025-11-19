// app/_layout.tsx
import { Stack } from "expo-router";
import { Suspense } from "react";
import { ActivityIndicator, Text, View } from "react-native";

function LoadingFallback() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#1eb88c" />
      <Text>Loading...</Text>
    </View>
  );
}

export default function RootLayout() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="visitors/index"
          options={{
            title: "Visitors",
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="visitors/add/index"
          options={{
            title: "Add Visitor",
            headerShown: true,
          }}
        />
        {/* Add other visitor routes as needed */}
      </Stack>
    </Suspense>
  );
}
