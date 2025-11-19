// app/apartments/visitors/test.tsx
"use client";

import React from "react";
import { Text, View } from "react-native";

export default function TestVisitorsScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Test Screen - No Async Operations</Text>
      <Text>If this works, the problem is in your async code</Text>
    </View>
  );
}
