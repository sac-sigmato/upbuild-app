// app/visitors/index.tsx
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ExportDateRangeModal from "../../components/visitors/ExportDateRangeModal";
import VisitorsFilters from "../../components/visitors/VisitorsFilters";
import VisitorsList from "../../components/visitors/VisitorsList";
import { visitorService } from "../../services/visitorService";
import { useUserStore } from "../../store/useUserStore";

// ---------- Helper Toast ----------
const nativeToast = (msg: string) => {
  if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
  else Alert.alert("", msg);
};

export default function VisitorsPageScreen() {
  const router = useRouter();
  const { user, hasHydrated } = useUserStore();

  // State declarations
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

  // Stable fetch function
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
        console.error("Failed to load visitors:", err);
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
    ]
  );

  // Safe effect with cleanup
  useEffect(() => {
    if (!hasHydrated) return;

    let isMounted = true;
    const controller = new AbortController();

    const loadData = async () => {
      if (!isMounted) return;
      try {
        await fetchVisitors(currentPage, selectedLimit);
        if (isMounted) {
          setSelectedVisitorIds([]);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Fetch visitors error:", error);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [hasHydrated, currentPage, fetchVisitors, selectedLimit]);

  // Safe export handlers
  const handleExport = async () => {
    if (selectedVisitorIds.length === 0) {
      setShowDateRangeModal(true);
      return;
    }

    try {
      setLoadingExport(true);
      await visitorService.exportVisitorsByIds(selectedVisitorIds);
      nativeToast("Export successful");
    } catch (err: any) {
      console.error(err);
      nativeToast(err?.message || "Failed to export visitors.");
    } finally {
      setLoadingExport(false);
    }
  };

  const handleExportByDateRange = async (fromD: string, toD: string) => {
    try {
      setLoadingExport(true);
      await visitorService.exportVisitorsByDateRange(fromD, toD);
      nativeToast("Export successful");
    } catch (err: any) {
      console.error(err);
      nativeToast(err?.message || "Failed to export visitors.");
    } finally {
      setLoadingExport(false);
      setShowDateRangeModal(false);
    }
  };

  // Safe state updaters
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
        <Text style={styles.visitorsTitle}>Visitors</Text>

        <View style={styles.contentContainer}>
          <Text style={styles.title}>Visitors Management</Text>

          <View style={styles.cardBox}>
            <VisitorsFilters
              fromDate={fromDate}
              toDate={toDate}
              searchText={searchText}
              selectedStatus={selectedStatus}
              selectedAcceptStatus={selectedAcceptStatus}
              selectedLimit={selectedLimit}
              selectedVisitorIds={selectedVisitorIds}
              canExportVisitors={true}
              loadingExport={loadingExport}
              setFromDate={(date) => {
                setFromDate(date);
                handleFilterChange();
              }}
              setToDate={(date) => {
                setToDate(date);
                handleFilterChange();
              }}
              setSearchText={handleSearchChange}
              setSelectedStatus={(status) => {
                setSelectedStatus(status);
                handleFilterChange();
              }}
              setSelectedAcceptStatus={(status) => {
                setSelectedAcceptStatus(status);
                handleFilterChange();
              }}
              setSelectedLimit={(limit) => {
                setSelectedLimit(limit);
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
              canEditVisitorStatus={true}
              canRespondToVisitorStatus={false}
            />

            <ExportDateRangeModal
              isOpen={showDateRangeModal}
              onClose={() => setShowDateRangeModal(false)}
              onExport={handleExportByDateRange}
            />
          </View>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f6f7",
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
  visitorsTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1eb88c",
    marginLeft: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#606873",
    marginBottom: 16,
  },
  cardBox: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    flex: 1,
  },
});
