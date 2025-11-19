"use client";
// app/apartments/visitors/index.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
        Alert,
        Platform,
        StyleSheet,
        Text,
        ToastAndroid,
        View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler"; // Add this import
import ExportDateRangeModal from "../../components/visitors/ExportDateRangeModal";
import VisitorTabsPage from "../../components/visitors/VisitorTabsPage";
import VisitorsFilters from "../../components/visitors/VisitorsFilters";
import VisitorsList from "../../components/visitors/VisitorsList";
import { useUserStore } from "../../store/useUserStore";
import { api_url } from "../../utils/apiLocalhost";
import BulkVisitors from "./bulkVisit";

// ---------- CONFIG ----------
const DEFAULT_LIMIT = 10;

// ---------- Helper Toast ----------
const nativeToast = (msg: string) => {
  if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
  else Alert.alert("", msg);
};

// ---------- Minimal permission helper (placeholder) ----------
const getMyPermissions = async () => {
  return { permissions: [] as string[] };
};

// ---------- Visitors Screen ----------
export default function VisitorsPageScreen() {
  const router = useRouter();
  const { typeOfVisitor } = useLocalSearchParams<{ typeOfVisitor?: string }>();

  useEffect(() => {
    console.log(typeOfVisitor, "typeOfVisitor");

    if (typeOfVisitor) {
      setActiveTab(typeOfVisitor);
    }
  }, [typeOfVisitor]);
  const { hasHydrated } = useUserStore();

  if (!hasHydrated) {
    return <View />; // or a simple loader
  }
  const { user } = useUserStore();
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalVisitors, setTotalVisitors] = useState(0);

  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedLimit, setSelectedLimit] = useState(3);
  const [selectedVisitorIds, setSelectedVisitorIds] = useState<string[]>([]);
  const [loadingExport, setLoadingExport] = useState(false);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [selectedAcceptStatus, setSelectedAcceptStatus] = useState("");
  const [searchText, setSearchText] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);

  // fetch permissions (placeholder)
  useEffect(() => {
    getMyPermissions().then((res) => setPermissions(res.permissions));
  }, []);

  const canExportVisitors = permissions.includes("can_export_visitors_data");

  // derive apartment id
  const fetchApartmentId = async () => {
    if (user?.apartment) return user.apartment;

    const raw = await AsyncStorage.getItem("upbuild_user_store");
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      return parsed?.state?.user?.apartment ?? null;
    } catch {
      return null;
    }
  };

  // Fetch visitors (POST)
  const fetchVisitors = async (page = 1, limit = selectedLimit) => {
    const apartmentId = await fetchApartmentId();
    const token = await AsyncStorage.getItem("token");

    if (!apartmentId) {
      nativeToast("Apartment ID missing");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        `${api_url}get/visitors/by/apartmentId/${apartmentId}`,
        {
          method: "POST",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            page,
            limit,
            search: searchText || undefined,
            status: selectedStatus || undefined,
            occupantAcceptStatus: selectedAcceptStatus || undefined,
            fromDate: fromDate || undefined,
            toDate: toDate || undefined,
          }),
        }
      );

      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }

      if (!res.ok) {
        const msg = data?.message || text || `Status ${res.status}`;
        throw new Error(msg);
      }

      setVisitors(data.visitors || []);
      setTotalVisitors(data.total || 0);
    } catch (err: any) {
      console.error("Failed to load visitors:", err);
      nativeToast(err?.message || "Failed to load visitors");
    } finally {
      setLoading(false);
    }
  };

  // refetch when filters/pagination/search change
  useEffect(() => {
    if (!hasHydrated) return; // ⛔ DO NOT FETCH YET

    fetchVisitors(currentPage, selectedLimit);
    setSelectedVisitorIds([]);
  }, [
    hasHydrated, // ← MUST include this
    currentPage,
    searchText,
    selectedStatus,
    selectedLimit,
    selectedAcceptStatus,
    fromDate,
    toDate,
  ]);

  const handleExport = async () => {
    if (selectedVisitorIds.length === 0) {
      setShowDateRangeModal(true);
      return;
    }

    try {
      setLoadingExport(true);
      const token = await AsyncStorage.getItem("token");

      const res = await fetch(`${api_url}export/visitors/pdf`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ visitorIds: selectedVisitorIds }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        nativeToast(errData?.message || "Export failed. Please try again.");
        return;
      }

      nativeToast(
        "Export successful (server processed). Check server or email for file."
      );
    } catch (err) {
      console.error(err);
      nativeToast("Failed to export visitors.");
    } finally {
      setLoadingExport(false);
    }
  };

  const handleExportByDateRange = async (fromD: string, toD: string) => {
    try {
      setLoadingExport(true);
      const token = await AsyncStorage.getItem("token");

      const res = await fetch(`${api_url}export/visitors/pdf`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fromDate: fromD, toDate: toD }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        nativeToast(errData?.message || "Export failed. Please try again.");
        return;
      }

      nativeToast("Export successful (date range)");
    } catch (err) {
      console.error(err);
      nativeToast("Failed to export visitors.");
    } finally {
      setLoadingExport(false);
      setShowDateRangeModal(false);
    }
  };
  const [activeTab, setActiveTab] = useState("visitor"); // 👈 track active tab

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Text style={styles.visitorsTitle}>Visitors </Text>
        {/* Tabs */}
        <VisitorTabsPage defaultTab="visitor" onTabChange={setActiveTab} />

        <View
          style={{
            flex: 1,
            padding: 16,
            margin: 16,
            backgroundColor: "#fefefe",
            borderRadius: 16,
          }}
        >
          <Text style={styles.title}>
            {activeTab === "visitor" ? "Visitors" : "Bulk Visitors"}
          </Text>

          <View style={styles.cardBox}>
            {activeTab === "visitor" ? (
              <>
                {/* Regular Visitors View */}
                <VisitorsFilters
                  fromDate={fromDate}
                  toDate={toDate}
                  searchText={searchText}
                  selectedStatus={selectedStatus}
                  selectedAcceptStatus={selectedAcceptStatus}
                  selectedLimit={selectedLimit}
                  selectedVisitorIds={selectedVisitorIds}
                  canExportVisitors={canExportVisitors}
                  loadingExport={loadingExport}
                  setFromDate={setFromDate}
                  setToDate={setToDate}
                  setSearchText={setSearchText}
                  setSelectedStatus={setSelectedStatus}
                  setSelectedAcceptStatus={setSelectedAcceptStatus}
                  setSelectedLimit={setSelectedLimit}
                  setCurrentPage={setCurrentPage}
                  handleExport={handleExport}
                  activeTab={activeTab}
                />
                <VisitorsList
                  visitors={visitors}
                  loading={loading}
                  fetchVisitors={() => fetchVisitors(currentPage)}
                  currentPage={currentPage}
                  totalPages={Math.ceil(totalVisitors / selectedLimit) || 1}
                  onPageChange={(page) => setCurrentPage(page)}
                  selectedVisitorIds={selectedVisitorIds}
                  setSelectedVisitorIds={setSelectedVisitorIds}
                  canEditVisitorStatus={true}
                  canRespondToVisitorStatus={false}
                />
                <ExportDateRangeModal
                  isOpen={showDateRangeModal}
                  onClose={() => setShowDateRangeModal(false)}
                  onExport={handleExportByDateRange}
                />
              </>
            ) : (
              // Bulk Visitors View - Add proper container
              <View style={styles.bulkVisitorsContainer}>
                <BulkVisitors />
              </View>
            )}
          </View>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f6f7" },
  tabsContainer: { padding: 12, backgroundColor: "#fff" },
  tabsText: { color: "#1eb88c" },
  title: { fontSize: 22, fontWeight: "700", color: "#606873", marginBottom: 8 },
  cardBox: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    height: "90%",
  },
  filtersBox: { marginBottom: 12 },
  filtersTitle: { fontWeight: "700", marginBottom: 8 },
  filterRow: { color: "#6b7280", marginBottom: 4 },
  visitorsTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1eb88c",
    marginLeft: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderColor: "#e5e7eb",
    borderWidth: 1,
    marginBottom: 8,
  },
  cardTitle: { fontWeight: "700", fontSize: 16 },
  cardSub: { color: "#6b7280" },

  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  pageBtn: { color: "#1eb88c", fontWeight: "700" },
  bulkVisitorsContainer: {
    flex: 1,
  },
});
