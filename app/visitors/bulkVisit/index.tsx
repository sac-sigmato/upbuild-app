// app/apartments/visitors/bulk/index.tsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from "react-native";

import { api_url } from "@/utils/apiLocalhost";
import { getMyPermissions } from "@/utils/getMyPermissions";
import { useRouter } from "expo-router";

// ✅ IMPORT FILTER + LIST + MODAL
import BulkVisitorsFilters from "@/components/visitors/bulkVisitor/BulkVisitorsFilters";
import BulkVisitorsList from "@/components/visitors/bulkVisitor/BulkVisitorsList";
import ExportDateRangeModal from "@/components/visitors/ExportDateRangeModal";

const DEFAULT_LIMIT = 10;

/* ---------- Helpers ---------- */
const toast = (msg: string) => {
  if (Platform.OS === "android") {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  } else {
    Alert.alert("", msg);
  }
};

/* ---------- Main ---------- */
const BulkVisitors = forwardRef((props, ref) => {
  const [refreshing, setRefreshing] = useState(false);

  useImperativeHandle(ref, () => ({
    refresh: async () => {
      try {
        setRefreshing(true);
        setCurrentPage(1);
        await fetchBulkVisitors(1);
        setSelectedVisitorIds([]);
      } finally {
        setRefreshing(false);
      }
    },
  }));

  const router = useRouter();

  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalVisitors, setTotalVisitors] = useState(0);

  const [searchText, setSearchText] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  const [selectedVisitorIds, setSelectedVisitorIds] = useState<string[]>([]);

  const [canExport, setCanExport] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [showDateRangeModal, setShowDateRangeModal] = useState(false);

  /* ---------- Permissions ---------- */
  useEffect(() => {
    (async () => {
      const { permissions } = await getMyPermissions();
      setCanExport(permissions.includes("can_export_visitors_data"));
    })();
  }, []);

  /* ---------- Helpers ---------- */
  const getApartmentId = async () => {
    const raw = await AsyncStorage.getItem("upbuild_user_store");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.user?.apartment ?? null;
  };

  /* ---------- Fetch ---------- */
  const fetchBulkVisitors = async (page = 1) => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");
      const apartmentId = await getApartmentId();

      const res = await fetch(`${api_url}get/visitor/in/bulk/${apartmentId}`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          page,
          limit,
          search: searchText || undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
        }),
      });

      const data = await res.json();

      setVisitors(data.visitors || []);
      setTotalVisitors(data.total || 0);
      setSelectedVisitorIds([]);
    } catch (err: any) {
      toast(err?.message || "Failed to load bulk visitors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBulkVisitors(currentPage);
  }, [currentPage, searchText, fromDate, toDate, limit]);

  const totalPages = Math.max(1, Math.ceil(totalVisitors / limit));

  /* ---------- Export Selected OR Open Modal ---------- */
  const handleExport = async () => {
    // 🟢 SAME AS WEB
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

      const res = await fetch(`${api_url}export/visitors/bulk/pdf`, {
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

      await saveAndSharePdf(base64, `bulk_visitors_${Date.now()}.pdf`);

      toast("Export successful");
      setSelectedVisitorIds([]);
    } catch (e) {
      console.error(e);
      toast("Export failed");
    } finally {
      setExporting(false);
    }
  };

  /* ---------- Export By Date Range ---------- */
  const handleExportByDateRange = async (from: string, to: string) => {
    try {
      setExporting(true);

      const token = await AsyncStorage.getItem("token");
      const apartmentId = await getApartmentId();

      const res = await fetch(`${api_url}export/visitors/bulk/pdf`, {
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

      await saveAndSharePdf(base64, `bulk_visitors_${from}_to_${to}.pdf`);

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

  /* ---------- UI ---------- */
  return (
    <View style={styles.container}>
      <BulkVisitorsFilters
        fromDate={fromDate}
        toDate={toDate}
        searchText={searchText}
        selectedLimit={limit}
        selectedVisitorIds={selectedVisitorIds}
        canExportVisitors={canExport}
        loadingExport={exporting}
        handleExport={handleExport}
        setFromDate={(v) => {
          setFromDate(v);
          setCurrentPage(1);
        }}
        setToDate={(v) => {
          setToDate(v);
          setCurrentPage(1);
        }}
        setSearchText={(v) => {
          setSearchText(v);
          setCurrentPage(1);
        }}
        setSelectedLimit={(v) => {
          setLimit(v);
          setCurrentPage(1);
        }}
        setCurrentPage={setCurrentPage}
      />

      {selectedVisitorIds.length > 0 && (
        <View style={styles.selectedBar}>
          <Text style={styles.selectedText}>
            {selectedVisitorIds.length} selected
          </Text>
        </View>
      )}

      {loading && currentPage === 1 ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#1eb88c" />
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await fetchBulkVisitors(1);
                setRefreshing(false);
              }}
              colors={["#1eb88c"]}
              tintColor="#1eb88c"
            />
          }
        >
          <BulkVisitorsList
            visitors={visitors}
            loading={loading}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            selectedVisitorIds={selectedVisitorIds}
            setSelectedVisitorIds={setSelectedVisitorIds}
            onViewDetails={(id) => {
              router.push({
                pathname: "/visitors/bulkVisit/bulkVisitorDetails",
                params: { id },
              });
            }}
          />
        </ScrollView>
      )}

      <ExportDateRangeModal
        isOpen={showDateRangeModal}
        onClose={() => setShowDateRangeModal(false)}
        onExport={handleExportByDateRange}
      />
    </View>
  );
});

export default BulkVisitors;

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

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f7f9",
    // padding: 16,
  },
  selectedBar: {
    backgroundColor: "#f0fdf9",
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#c8e7dd",
  },
  selectedText: {
    fontSize: 12,
    color: "#1e7f65",
    fontWeight: "600",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
