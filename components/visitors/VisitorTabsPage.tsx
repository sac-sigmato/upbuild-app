"use client";
// components/VisitorTabsPage.tsx
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type TabProps = {
  defaultTab?: "visitor" | "bulk";
  onTabChange?: (tab: "visitor" | "bulk") => void;
};

export default function VisitorTabsPage({
  defaultTab = "visitor",
  onTabChange,
}: TabProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"visitor" | "bulk">(defaultTab);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const handleTabChange = (tab: "visitor" | "bulk") => {
    setActiveTab(tab);

    // Only call onTabChange, don't use router.push
    if (onTabChange) {
      onTabChange(tab);
    }
    // REMOVED the router.push calls - this is what was causing navigation
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabsRow}>
        <TouchableOpacity
          onPress={() => handleTabChange("visitor")}
          activeOpacity={0.8}
          style={[styles.tab, activeTab === "visitor" && styles.tabActive]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "visitor" && styles.tabTextActive,
            ]}
          >
            Visitors
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleTabChange("bulk")}
          activeOpacity={0.8}
          style={[styles.tab, activeTab === "bulk" && styles.tabActive]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "bulk" && styles.tabTextActive,
            ]}
          >
            Bulk Visitors
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: "transparent",
  },
  tabsRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    marginRight: 12,
  },
  tabActive: {
    borderBottomColor: "#1eb88c",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  tabTextActive: {
    color: "#1eb88c",
  },
});
