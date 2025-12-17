// app/visitors/index.tsx
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
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

  // Simple and reliable export function
  const handleExport = async () => {
    if (selectedVisitorIds.length === 0) {
      setShowDateRangeModal(true);
      return;
    }

    try {
      setLoadingExport(true);

      console.log("Exporting visitor IDs:", selectedVisitorIds);

      // Get API URL and token
      const apiUrl = "http://192.168.29.35:5000/api/";
      const token = await getAuthToken();

      console.log("API URL:", apiUrl);
      console.log("Token available:", !!token);

      if (!token) {
        nativeToast("Authentication token not found. Please login again.");
        return;
      }

      // Prepare request body
      const requestBody = {
        visitorIds: selectedVisitorIds,
      };

      console.log("Request body:", JSON.stringify(requestBody));

      // Make the fetch request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch(`${apiUrl}export/visitors/pdf`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/pdf",
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log("Response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Server error:", errorText);
          nativeToast("Export failed. Please try again.");
          return;
        }

        // Method 1: Direct download for web
        if (Platform.OS === "web") {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `visitors_report_${Date.now()}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          nativeToast("Download started!");
          return;
        }

        // Method 2: For React Native - save to file and share
        // Get the blob
        const blob = await response.blob();
        console.log("Blob size:", blob.size, "bytes");

        if (blob.size === 0) {
          nativeToast("Empty PDF received from server");
          return;
        }

        // Convert blob to base64
        const base64 = await blobToBase64(blob);
        console.log("Base64 length:", base64.length);

        // Try different methods to save and open the file
        await saveAndOpenPdf(base64, `visitors_report_${Date.now()}.pdf`);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);

        if (fetchError.name === "AbortError") {
          nativeToast("Export timeout. Please try again.");
        } else if (fetchError.message?.includes("Network request failed")) {
          nativeToast("Network error. Please check your connection.");
        } else {
          console.error("Fetch error:", fetchError);
          nativeToast(`Export failed: ${fetchError.message}`);
        }
      }
    } catch (err: any) {
      console.error("Export process error:", err);
      nativeToast(`Export failed: ${err.message || "Please try again"}`);
    } finally {
      setLoadingExport(false);
    }
  };

  // Helper to get auth token
  const getAuthToken = async () => {
    try {
      if (visitorService.getToken) {
        return await visitorService.getToken();
      }
      return user?.token;
    } catch (error) {
      console.error("Failed to get auth token:", error);
      return null;
    }
  };

  // Convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          const base64data = (reader.result as string).split(",")[1];
          resolve(base64data);
        } else {
          reject(new Error("Failed to read blob"));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Save and open PDF using different methods
  const saveAndOpenPdf = async (base64: string, filename: string) => {
    try {
      // Method A: Try using expo-file-system legacy API
      try {
        const { writeAsStringAsync, EncodingType, cacheDirectory } =
          await import("expo-file-system/legacy");
        const fileUri = `${cacheDirectory}${filename}`;

        await writeAsStringAsync(fileUri, base64, {
          encoding: EncodingType.Base64,
        });

        console.log("File saved to:", fileUri);

        // Try to open with Linking
        if (await Linking.canOpenURL(fileUri)) {
          await Linking.openURL(fileUri);
          nativeToast("Opening PDF...");
        } else {
          // Try to share
          try {
            const { isAvailableAsync, shareAsync } = await import(
              "expo-sharing"
            );
            if (await isAvailableAsync()) {
              await shareAsync(fileUri, {
                mimeType: "application/pdf",
                dialogTitle: "Visitors Report",
              });
              nativeToast("Sharing PDF...");
            } else {
              nativeToast(`PDF saved to: ${fileUri}`);
            }
          } catch (shareError) {
            nativeToast(`PDF saved to app cache`);
          }
        }
        return;
      } catch (fsError) {
        console.log("FileSystem method failed:", fsError);
      }

      // Method B: For Android - create a download link
      if (Platform.OS === "android") {
        try {
          // Create a data URL
          const dataUrl = `data:application/pdf;base64,${base64}`;

          // Try to open with Linking
          if (await Linking.canOpenURL(dataUrl)) {
            await Linking.openURL(dataUrl);
            nativeToast("Opening PDF...");
          } else {
            // Fallback: Download manager intent
            const downloadUrl = `http://192.168.29.35:5000/api/download?filename=${filename}&data=${encodeURIComponent(
              base64
            )}`;
            await Linking.openURL(downloadUrl);
            nativeToast("Starting download...");
          }
          return;
        } catch (androidError) {
          console.log("Android method failed:", androidError);
        }
      }

      // Method C: For iOS - try to open in browser
      if (Platform.OS === "ios") {
        try {
          const dataUrl = `data:application/pdf;base64,${base64}`;
          await Linking.openURL(dataUrl);
          nativeToast("Opening PDF...");
          return;
        } catch (iosError) {
          console.log("iOS method failed:", iosError);
        }
      }

      // Fallback: Show base64 data (for debugging)
      console.log("PDF base64 (first 100 chars):", base64.substring(0, 100));
      nativeToast("PDF downloaded. Please check your downloads folder.");
    } catch (error: any) {
      console.error("Save and open error:", error);
      nativeToast("Could not open PDF. Please try another method.");
    }
  };

  const handleExportByDateRange = async (fromDate: string, toDate: string) => {
    try {
      setLoadingExport(true);

      console.log("Exporting by date range:", { fromDate, toDate });

      const apiUrl = "http://192.168.29.35:5000/api/";
      const token = await getAuthToken();

      if (!token) {
        nativeToast("Authentication token not found.");
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch(`${apiUrl}export/visitors/pdf`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ fromDate, toDate }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        console.log("Response status:", response.status);

        if (!response.ok) {
          nativeToast("Export failed.");
          return;
        }

        if (Platform.OS === "web") {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `visitors_${fromDate}_to_${toDate}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          nativeToast("Download started!");
          return;
        }

        const blob = await response.blob();
        const base64 = await blobToBase64(blob);
        await saveAndOpenPdf(base64, `visitors_${fromDate}_to_${toDate}.pdf`);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        nativeToast("Export failed. Please try again.");
      }
    } catch (err: any) {
      console.error("Export error:", err);
      nativeToast("Failed to export.");
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
  cardBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    flex: 1,
  },
});
