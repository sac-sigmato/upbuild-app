// app/visitors/index.tsx
import AppUserHeader from "@/components/AppUserHeader";
import ExportDateRangeModal from "@/components/visitors/ExportDateRangeModal";
import VisitorsFilters from "@/components/visitors/VisitorsFilters";
import VisitorsList from "@/components/visitors/VisitorsList";
import { visitorService } from "@/services/visitorService";
import { useUserStore } from "@/store/useUserStore";
import { api_url } from "@/utils/apiLocalhost";
import { getMyPermissions } from "@/utils/getMyPermissions";

import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { RefreshControl } from "react-native";

import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// ✅ ADD BULK VISITORS SCREEN (NO REMOVAL)
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QrCode } from "lucide-react-native";
import BulkVisitors from "./bulkVisit";

// ---------- Helper Toast ----------
const nativeToast = (msg: string) => {
  if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
  else Alert.alert("", msg);
};

/* ---------- Helpers ---------- */
const toast = (msg: string) => {
  if (Platform.OS === "android") {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  } else {
    Alert.alert("", msg);
  }
};

export default function VisitorsPageScreen() {
  const bulkRef = useRef<any>(null);
  const router = useRouter(); // ⬅ kept
  const { user, hasHydrated } = useUserStore();
  const [refreshing, setRefreshing] = useState(false);

  // ✅ ADD TAB STATE (nothing removed)
  const [activeTab, setActiveTab] = useState<"visitors" | "bulk">("visitors");

  // State declarations (UNCHANGED)
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedLimit, setSelectedLimit] = useState(10);
  const [selectedVisitorIds, setSelectedVisitorIds] = useState<string[]>([]);
  const [loadingExport, setLoadingExport] = useState(false);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [selectedAcceptStatus, setSelectedAcceptStatus] = useState("");
  const [searchText, setSearchText] = useState("");
  const [canExportVisitors, setCanExportVisitors] = useState(false);
  const [roleSlug, setRoleSlug] = useState("");
  const [canExport, setCanExport] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleRefresh = async () => {
    if (refreshing) return;
    try {
      setRefreshing(true);
      setCurrentPage(1);
      await fetchVisitors(1, selectedLimit);
      setSelectedVisitorIds([]);
    } catch {
      nativeToast("Failed to refresh visitors");
    } finally {
      setRefreshing(false);
    }
  };

  // Stable fetch function (UNCHANGED)
  const fetchVisitors = useCallback(
    async (page = 1, limit = selectedLimit) => {
      try {
        setLoading(true);

        const params = {
          page,
          limit,
          search: searchText || undefined,
          status: selectedStatus || undefined,
          occupantAcceptStatus: selectedAcceptStatus || undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
        };

        const data = await visitorService.fetchVisitors(params, user);
        setVisitors(data.visitors || []);
        setTotalVisitors(data.total || 0);
      } catch (err: any) {
        nativeToast(err?.message || "Failed to load visitors");
        setVisitors([]);
        setTotalVisitors(0);
      } finally {
        setLoading(false);
      }
    },
    [
      user,
      searchText,
      selectedStatus,
      selectedAcceptStatus,
      fromDate,
      toDate,
      selectedLimit,
    ],
  );

  useEffect(() => {
    if (!hasHydrated) return;
    fetchVisitors(currentPage, selectedLimit);
  }, [hasHydrated, currentPage, fetchVisitors, selectedLimit]);

  useEffect(() => {
    if (!hasHydrated) return;
    (async () => {
      const { permissions, roleSlug } = await getMyPermissions();
      setRoleSlug(roleSlug);
      setCanExportVisitors(permissions.includes("can_export_visitors_data"));
    })();
  }, [hasHydrated]);

  // ---- export + helpers UNCHANGED ----
  const handleExport = async () => {
    // 🟢 SAME AS WEB + BULK
    if (selectedVisitorIds.length === 0) {
      setShowDateRangeModal(true);
      return;
    }

    try {
      setExporting(true);

      const token = await AsyncStorage.getItem("token");
      const apartmentId = await getApartmentId();

      if (!token || !apartmentId) {
        toast("Authentication error");
        return;
      }

      const res = await fetch(`${api_url}export/visitors/pdf`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          visitorIds: selectedVisitorIds,
          apartmentId,
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error(txt);
        toast("Export failed");
        return;
      }

      const blob = await res.blob();
      const base64 = await blobToBase64(blob);

      await saveAndSharePdf(base64, `visitors_${Date.now()}.pdf`);

      toast("Export successful");
      setSelectedVisitorIds([]);
    } catch (e) {
      console.error(e);
      toast("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleExportByDateRange = async (from: string, to: string) => {
    try {
      setExporting(true);

      const token = await AsyncStorage.getItem("token");
      const apartmentId = await getApartmentId();

      if (!token || !apartmentId) {
        toast("Authentication error");
        return;
      }

      const res = await fetch(`${api_url}export/visitors/pdf`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromDate: from,
          toDate: to,
          apartmentId,
        }),
      });

      if (!res.ok) {
        toast("Export failed");
        return;
      }

      const blob = await res.blob();
      const base64 = await blobToBase64(blob);

      await saveAndSharePdf(base64, `visitors_${from}_to_${to}.pdf`);

      toast("Export successful");
      setSelectedVisitorIds([]);
    } catch (e) {
      console.error(e);
      toast("Export failed");
    } finally {
      setExporting(false);
      setShowDateRangeModal(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    setCurrentPage(1);
  };

  const handleFilterChange = useCallback(() => {
    setCurrentPage(1);
  }, []);

  if (!hasHydrated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1eb88c" />
        <Text>Loading app...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <AppUserHeader />

        {/* ---------- HEADER TABS ---------- */}
        <View style={styles.titleRow}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              onPress={() => setActiveTab("visitors")}
              style={[
                styles.bulkBtn,
                activeTab === "visitors" && styles.activeTab,
              ]}
            >
              <Text
                style={[
                  styles.bulkBtnText,
                  activeTab === "visitors" && styles.activeTabText,
                ]}
              >
                Visitors
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab("bulk")}
              style={[styles.bulkBtn, activeTab === "bulk" && styles.activeTab]}
            >
              <Text
                style={[
                  styles.bulkBtnText,
                  activeTab === "bulk" && styles.activeTabText,
                ]}
              >
                Bulk Visitors
              </Text>
            </Pressable>

            {roleSlug === "security" && (
              <Pressable
                style={styles.scanBtn}
                onPress={() => router.push("/visitors/scan")}
              >
                <QrCode size={18} color="#fff" />
                <Text style={styles.scanText}>Scan Visitor QR</Text>
              </Pressable>
            )}
          </View>

          <Pressable
            onPress={() => {
              if (activeTab === "visitors") {
                handleRefresh();
              } else {
                bulkRef.current?.refresh();
              }
            }}
          >
            <Text style={{ color: "#1eb88c", fontWeight: "600" }}>
              {refreshing ? "Refreshing..." : "Refresh"}
            </Text>
          </Pressable>
        </View>

        {/* ---------- CONTENT ---------- */}
        <View style={styles.contentContainer}>
          <View style={styles.cardBox}>
            {activeTab === "bulk" ? (
              <BulkVisitors ref={bulkRef} />
            ) : (
              <>
                <VisitorsFilters
                  fromDate={fromDate}
                  toDate={toDate}
                  searchText={searchText}
                  selectedStatus={selectedStatus}
                  selectedAcceptStatus={selectedAcceptStatus}
                  selectedLimit={selectedLimit}
                  selectedVisitorIds={selectedVisitorIds}
                  canExportVisitors={canExportVisitors}
                  loadingExport={exporting}
                  setFromDate={(v) => {
                    setFromDate(v);
                    handleFilterChange();
                  }}
                  setToDate={(v) => {
                    setToDate(v);
                    handleFilterChange();
                  }}
                  setSearchText={handleSearchChange}
                  setSelectedStatus={(v) => {
                    setSelectedStatus(v);
                    handleFilterChange();
                  }}
                  setSelectedAcceptStatus={(v) => {
                    setSelectedAcceptStatus(v);
                    handleFilterChange();
                  }}
                  setSelectedLimit={(v) => {
                    setSelectedLimit(v);
                    handleFilterChange();
                  }}
                  setCurrentPage={setCurrentPage}
                  handleExport={handleExport}
                />

                <VisitorsList
                  visitors={visitors}
                  loading={loading}
                  currentPage={currentPage}
                  totalPages={Math.ceil(totalVisitors / selectedLimit) || 1}
                  onPageChange={setCurrentPage}
                  selectedVisitorIds={selectedVisitorIds}
                  setSelectedVisitorIds={setSelectedVisitorIds}
                  canExportVisitors={canExportVisitors}
                  canRespondToVisitorStatus={false}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={handleRefresh}
                      colors={["#1eb88c"]}
                      tintColor="#1eb88c"
                    />
                  }
                />

                <ExportDateRangeModal
                  isOpen={showDateRangeModal}
                  onClose={() => setShowDateRangeModal(false)}
                  onExport={handleExportByDateRange}
                />
              </>
            )}
          </View>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}
/* ---------- Helpers ---------- */
const getApartmentId = async () => {
  const raw = await AsyncStorage.getItem("upbuild_user_store");
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  return parsed?.state?.user?.apartment ?? null;
};
/* ---------- Helpers ---------- */
const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const saveAndSharePdf = async (base64: string, filename: string) => {
  const { writeAsStringAsync, cacheDirectory, EncodingType } =
    await import("expo-file-system/legacy");

  const fileUri = `${cacheDirectory}${filename}`;

  await writeAsStringAsync(fileUri, base64, {
    encoding: EncodingType.Base64,
  });

  const Sharing = await import("expo-sharing");
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: "application/pdf",
    });
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f6f7",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 16,
  },
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#1eb88c",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  scanText: {
    color: "#fff",
    fontWeight: "700",
  },
  bulkBtn: {
    backgroundColor: "#e5e7eb",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  bulkBtnText: {
    color: "#374151",
    fontWeight: "700",
    fontSize: 12,
  },

  activeTab: {
    backgroundColor: "#1eb88c",
  },
  activeTabText: {
    color: "#fff",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
    margin: 16,
    backgroundColor: "#fefefe",
    borderRadius: 16,
  },
  cardBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    flex: 1,
  },
});
