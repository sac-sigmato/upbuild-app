// app/apartments/visitors/bulk/details.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Search } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BulkVisitorInfoTable from "./BulkVisitorInfoTable";

// ---------- CONFIG ----------
const API_BASE = "http://192.168.29.35:5000/api/";

// ---------- Helpers ----------
const getMyPermissions = async (): Promise<{
  permissions: string[];
  roleSlug: string;
}> => {
  const token = await AsyncStorage.getItem("token");
  if (!token) return { permissions: [], roleSlug: "" };

  try {
    const res = await fetch(`${API_BASE}user/get/my/permissions`, {
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

  const date = new Date(dateString);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
};

// ---------- Main Component ----------
export default function BulkVisitorDetails() {  
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filteredVisitors, setFilteredVisitors] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roleSlug, setRoleSlug] = useState<string>("");

  useEffect(() => {
    getMyPermissions()
      .then(({ permissions, roleSlug }) => {
        setPermissions(permissions);
        setRoleSlug(roleSlug);
      })
      .catch((err) => console.error("Error fetching permissions:", err));
  }, []);

  const canEditVisitorStatus =
    roleSlug === "security" || permissions.includes("can_edit_visitor_status");

  const fetchData = async () => {
    try {
      if (!id) return;

      const token = await AsyncStorage.getItem("token");
      const query = searchText.trim();
      const url = `${API_BASE}get/visitorsbulk/by/${id}${
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
      setFilteredVisitors(json.visitors || []);
    } catch (err: any) {
      console.error("Error fetching data:", err);
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
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No data found.</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#1eb88c" />
        </TouchableOpacity>
        <Text style={styles.title}>Bulk Visitors Entry</Text>
      </View>

      {/* Event + Flat Info */}
      <View style={styles.infoContainer}>
        {/* Event Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Event Details</Text>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Purpose</Text>
            <Text style={styles.detailValue}>{data.eventPurpose || "-"}</Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>
              {data.isMultipleDays
                ? `${new Date(data.fromDate).toLocaleDateString(
                    "en-GB"
                  )} to ${new Date(data.toDate).toLocaleDateString("en-GB")}`
                : new Date(data.visitDate).toLocaleDateString("en-GB")}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailValue}>
              {data.fromTime || "-"} - {data.toTime || "-"}
            </Text>
          </View>

          {data.notes && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Notes</Text>
              <Text style={styles.detailValue}>{data.notes}</Text>
            </View>
          )}
        </View>

        {/* Flat Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Flat Info</Text>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Flat-Block</Text>
            <Text style={styles.detailValue}>
              {data.flatId?.flatName || "-"}-{data.flatId?.blockName || "-"}
            </Text>
          </View>

          {data.flatId?.occupant && (
            <>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Occupant</Text>
                <Text style={styles.detailValue}>
                  {data.flatId.occupant.name || "-"}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailValue}>
                  {data.flatId.occupant.phoneNumber || "-"}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Visitor List */}
      <View style={styles.visitorListContainer}>
        <View style={styles.visitorListHeader}>
          <Text style={styles.visitorListTitle}>Visitor List</Text>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <Text style={styles.searchLabel}>Search by VisitorInfoId</Text>
            <View style={styles.searchInputContainer}>
              <Search size={20} color="#6b7280" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search..."
                value={searchText}
                onChangeText={setSearchText}
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>
        </View>

        {/* Visitor Table */}
        <BulkVisitorInfoTable
          visitors={filteredVisitors}
          canEditVisitorStatus={canEditVisitorStatus}
          formatDateTime={formatDateTime}
          refreshVisitors={fetchData}
        />
      </View>
    </ScrollView>
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#606873",
  },
  infoContainer: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: "#f0fdf9",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#c8e7dd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e7f65",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#bee3d4",
  },
  detailItem: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  visitorListContainer: {
    backgroundColor: "#fff",
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  visitorListHeader: {
    marginBottom: 16,
  },
  visitorListTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#606873",
    marginBottom: 16,
  },
  searchContainer: {
    marginBottom: 8,
  },
  searchLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 8,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  searchIcon: {
    marginLeft: 12,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 12,
    fontSize: 14,
    color: "#374151",
  },
  backButtonText: {
    color: "#1eb88c",
    fontSize: 16,
    fontWeight: "600",
  },
});
