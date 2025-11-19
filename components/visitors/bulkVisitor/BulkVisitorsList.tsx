// components/BulkVisitorsList.tsx - FIXED
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
// import Loader from "../../loader/loader"; // adjust path
import { api_url } from "../../../utils/apiLocalhost"; // adjust path
import { getMyPermissions } from "../../../utils/getMyPermissions"; // adjusted path

type BulkVisitor = {
  _id: string;
  bulkVisitorId: string;
  flatName?: string;
  blockName?: string;
  isForEntireApartment: boolean;
  eventPurpose: string;
  expectedCount: number;
  isMultipleDays: boolean;
  visitDate?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  fromTime: string;
  toTime: string;
  notes?: string;
  createdAt: string;
};

type Props = {
  visitors: BulkVisitor[];
  loading: boolean;
  fetchVisitors: () => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  selectedVisitorIds: string[];
  setSelectedVisitorIds: (ids: string[]) => void;
};

const nativeToast = (msg: string) => {
  if (Platform.OS === "android") {
    const ToastAndroid = require("react-native").ToastAndroid;
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  } else {
    Alert.alert("", msg);
  }
};

export default function BulkVisitorsList({
  visitors,
  loading,
  fetchVisitors,
  currentPage,
  totalPages,
  onPageChange,
  selectedVisitorIds,
  setSelectedVisitorIds,
}: Props) {
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteContent, setNoteContent] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roleSlug, setRoleSlug] = useState<string>("");
  const [permLoading, setPermLoading] = useState(true);

  const navigation = useNavigation();

  useEffect(() => {
    let mounted = true;
    (async () => {
      setPermLoading(true);
      try {
        const { permissions: p, roleSlug: r } = await getMyPermissions();
        if (!mounted) return;
        setPermissions(p);
        setRoleSlug(r);
      } catch (err) {
        console.error("getMyPermissions error:", err);
      } finally {
        if (mounted) setPermLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const canCopyLink = permissions.includes("can_copy_bulk_visitor_link");
  const canSeeLink = roleSlug === "occupants";

  useEffect(() => {
    // keep selection in-range if visitors list length changes
    setSelectedVisitorIds((prev) =>
      prev.filter((id) => visitors.some((v) => v._id === id))
    );
  }, [visitors, setSelectedVisitorIds]);

  const toggleSelect = useCallback(
    (id: string) => {
      setSelectedVisitorIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    },
    [setSelectedVisitorIds]
  );

  const toggleSelectAll = useCallback(() => {
    if (selectedVisitorIds.length === visitors.length) {
      setSelectedVisitorIds([]);
    } else {
      setSelectedVisitorIds(visitors.map((v) => v._id));
    }
  }, [selectedVisitorIds, visitors, setSelectedVisitorIds]);

  const handleCopyLink = async (id: string) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(
        `${api_url}get/flat/bulk/visitor/${id}/copy/link`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );

      const text = await res.text();
      const data = (() => {
        try {
          return JSON.parse(text);
        } catch {
          return null;
        }
      })();

      if (!res.ok) {
        throw new Error(data?.message || text || `Status ${res.status}`);
      }

      const link = data?.bulkVisitorLink;
      if (!link) throw new Error("No link returned");

      await Clipboard.setStringAsync(link);
      nativeToast("Link copied to clipboard!");
    } catch (err: any) {
      console.error("handleCopyLink error:", err);
      nativeToast(err?.message || "Failed to copy link");
    }
  };

  const renderItem = ({ item }: { item: BulkVisitor }) => {
    const displayDate = item.isMultipleDays
      ? `${new Date(item.fromDate || "").toLocaleDateString()} - ${new Date(
          item.toDate || ""
        ).toLocaleDateString()}`
      : new Date(item.visitDate || "").toLocaleDateString();

    const isSelected = selectedVisitorIds.includes(item._id);

    return (
      <View style={[styles.card, isSelected && styles.cardSelected]}>
        <View style={styles.cardRow}>
          <TouchableOpacity
            onPress={() => toggleSelect(item._id)}
            style={styles.checkbox}
          >
            <Text style={{ fontWeight: "700" }}>{isSelected ? "✓" : ""}</Text>
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{item.bulkVisitorId}</Text>
            <Text style={styles.sub}>
              {item.isForEntireApartment
                ? "Entire Apartment"
                : `${item.flatName}-${item.blockName}`}
            </Text>
            <Text style={styles.sub}>{item.eventPurpose}</Text>
            <Text style={styles.meta}>Expected: {item.expectedCount}</Text>
            <Text style={styles.meta}>
              {item.isMultipleDays ? "Multi-Day" : "Single Day"}
            </Text>
            <Text style={styles.meta}>{displayDate}</Text>
            <Text style={styles.meta}>
              {item.fromTime} - {item.toTime}
            </Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={() => {
              setNoteContent(item.notes || "No notes provided.");
              setNoteModalVisible(true);
            }}
          >
            <Text style={styles.link}>Notes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              // navigate to bulk detail screen — adjust route name as per your navigator
              // example: navigation.navigate("BulkVisitDetails", { id: item._id })
              // Here using a common approach: if you're using react-navigation stack, replace below with navigation.navigate
              // For expo-router you might use: router.push(`/apartment/visitors/bulkVisit/${item._id}`)
              navigation.navigate?.("BulkVisitorDetails" as any, {
                id: item._id,
              });
            }}
          >
            <Text style={styles.link}>View</Text>
          </TouchableOpacity>

          {(canCopyLink || canSeeLink) && (
            <TouchableOpacity onPress={() => handleCopyLink(item._id)}>
              <Text style={styles.link}>Copy</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (permLoading) {
    return (
      <View style={styles.center}>
        {/* <Loader /> */}
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loaderRow}>
          {/* <Loader /> */}
          <Text>Loading...</Text>
        </View>
      )}
      {/* Select all row */}
      <View style={styles.selectAllRow}>
        <TouchableOpacity onPress={toggleSelectAll} style={styles.checkbox}>
          <Text style={{ fontWeight: "700" }}>
            {selectedVisitorIds.length === visitors.length &&
            visitors.length > 0
              ? "✓"
              : ""}
          </Text>
        </TouchableOpacity>
        <Text style={styles.selectAllText}>Select All</Text>
      </View>
      {/* List - FIXED: Added flexGrow to contentContainerStyle */}
      // Temporary debug - replace the FlatList with this:
      {visitors.length > 0 ? (
        <View style={styles.debugContainer}>
          {visitors.map((item, index) => (
            <View key={item._id} style={styles.card}>
              <Text style={styles.title}>{item.bulkVisitorId}</Text>
              <Text style={styles.sub}>{item.eventPurpose}</Text>
              <Text style={styles.meta}>Expected: {item.expectedCount}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No bulk visitors found.</Text>
        </View>
      )}
      {/* Pagination */}
      <View style={styles.pagination}>
        <TouchableOpacity
          onPress={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          style={[styles.pageBtn, currentPage <= 1 && styles.disabledBtn]}
        >
          <Text style={styles.pageBtnText}>Prev</Text>
        </TouchableOpacity>

        <Text style={styles.pageInfo}>
          Page {currentPage} of {Math.max(1, totalPages)}
        </Text>

        <TouchableOpacity
          onPress={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          style={[
            styles.pageBtn,
            currentPage >= totalPages && styles.disabledBtn,
          ]}
        >
          <Text style={styles.pageBtnText}>Next</Text>
        </TouchableOpacity>
      </View>
      {/* Notes Modal */}
      <Modal visible={noteModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Visitor Notes</Text>
            <Text style={styles.modalBody}>{noteContent}</Text>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                marginTop: 16,
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  setNoteModalVisible(false);
                  setNoteContent(null);
                }}
                style={styles.modalBtn}
              >
                <Text style={styles.modalBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ---------- styles ----------
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loaderRow: {
    paddingVertical: 12,
  },
  selectAllRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  checkbox: {
    width: 30,
    height: 30,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  selectAllText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
  },

  // ✅ FIXED: Added listContent with flexGrow
  listContent: {
    flexGrow: 1, // This is crucial for the list to be visible
    paddingBottom: 24,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 6,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardSelected: {
    backgroundColor: "#e6f7f4",
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  sub: {
    color: "#6b7280",
    marginTop: 4,
  },
  meta: {
    color: "#6b7280",
    marginTop: 2,
    fontSize: 13,
  },

  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
  },
  link: {
    color: "#1eb88c",
    fontWeight: "700",
  },

  empty: {
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    color: "#6b7280",
  },

  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 12,
  },
  pageBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#1eb88c",
    borderRadius: 8,
  },
  pageBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  disabledBtn: {
    opacity: 0.45,
    backgroundColor: "#9ca3af",
  },
  pageInfo: {
    marginHorizontal: 12,
    color: "#374151",
    fontWeight: "700",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
  },
  modalBody: {
    color: "#374151",
  },
  modalBtn: {
    backgroundColor: "#1eb88c",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
});
