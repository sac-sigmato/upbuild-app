// app/apartments/visitors/bulk/details.tsx

import BulkVisitorInfoTable from "@/components/visitors/BulkVisitorInfoTable";
import { api_url } from "@/utils/apiLocalhost";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Search } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

/* ---------- Helpers ---------- */
const getMyPermissions = async (): Promise<{
  permissions: string[];
  roleSlug: string;
}> => {
  const token = await AsyncStorage.getItem("token");
  if (!token) return { permissions: [], roleSlug: "" };

  try {
    const res = await fetch(`${api_url}user/get/my/permissions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { permissions: [], roleSlug: "" };
    const data = await res.json();
    return {
      permissions: Array.isArray(data.permissions) ? data.permissions : [],
      roleSlug: data.roleSlug || "",
    };
  } catch {
    return { permissions: [], roleSlug: "" };
  }
};

const formatDateTime = (dateString?: string) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
};

/* ---------- Main ---------- */
export default function BulkVisitorDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [visitors, setVisitors] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roleSlug, setRoleSlug] = useState("");

  /* ---------- Permissions ---------- */
  useEffect(() => {
    getMyPermissions().then(({ permissions, roleSlug }) => {
      setPermissions(permissions);
      setRoleSlug(roleSlug);
    });
  }, []);

  const canEditVisitorStatus =
    roleSlug === "security" || permissions.includes("can_edit_visitor_status");

  /* ---------- Fetch ---------- */
  const fetchData = async () => {
    try {
      if (!id) return;
      setLoading(true);

      const token = await AsyncStorage.getItem("token");
      const query = searchText.trim();

      const url = `${api_url}get/visitorsbulk/by/${id}${
        query ? `?search=${encodeURIComponent(query)}` : ""
      }`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to fetch bulk visitor details");

      const json = await res.json();
      setData(json);
      setVisitors(json.visitors || []);
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message || "Failed to load visitor details");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, searchText]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  /* ---------- Loading ---------- */
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1eb88c" />
        <Text style={styles.loadingText}>Loading visitor details...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.loadingContainer}>
        <Text>No data found</Text>
      </View>
    );
  }

  /* ---------- UI ---------- */
  return (
    <FlatList
      data={visitors}
      style={styles.main}
      keyExtractor={(item) => item._id}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListHeaderComponent={
        <>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color="#1eb88c" />
            </TouchableOpacity>
            <Text style={styles.title}>Bulk Visitors Entry</Text>
          </View>

          {/* Event + Flat Info */}
          <View style={styles.infoContainer}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Event Details</Text>
              <Text>{data.eventPurpose || "-"}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Flat Info</Text>
              <Text>
                {data.flatId?.flatName}-{data.flatId?.blockName}
              </Text>
            </View>
          </View>

          {/* Search */}
          <View style={styles.searchBox}>
            <Search size={18} color="#6b7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by VisitorInfoId"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        </>
      }
      renderItem={() => null}
      ListFooterComponent={
        <BulkVisitorInfoTable
          visitors={visitors}
          canEditVisitorStatus={canEditVisitorStatus}
          roleSlug={roleSlug}
          formatDateTime={formatDateTime}
          refreshVisitors={fetchData}
        />
      }
    />
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  main: { marginTop: 40 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#6b7280" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    gap: 12,
  },
  title: { fontSize: 18, fontWeight: "700", color: "#374151" },
  infoContainer: { padding: 16, gap: 16 },
  card: {
    backgroundColor: "#f0fdf9",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#c8e7dd",
  },
  cardTitle: { fontWeight: "700", marginBottom: 6 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    gap: 8,
  },
  searchInput: { flex: 1 },
});
