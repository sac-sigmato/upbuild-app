import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { api_url } from "@/utils/apiLocalhost";
import { getMyPermissions } from "@/utils/getMyPermissions";

type BulkVisitor = {
  _id: string;
  bulkVisitorId: string;
  flatName?: string;
  blockName?: string;
  isForEntireApartment: boolean;
  eventPurpose: string;
  expectedCount: number;
  isMultipleDays: boolean;
  visitDate?: string;
  fromDate?: string;
  toDate?: string;
  fromTime: string;
  toTime: string;
  notes?: string;
};

type Props = {
  visitors?: BulkVisitor[]; // made optional, default to []
  loading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  selectedVisitorIds: string[];
  setSelectedVisitorIds: React.Dispatch<React.SetStateAction<string[]>>;
  onViewDetails: (id: string) => void;
};

const toast = (msg: string) => {
  if (Platform.OS === "android") {
    const { ToastAndroid } = require("react-native");
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  } else {
    Alert.alert("", msg);
  }
};

export default function BulkVisitorsList({
  visitors = [],
  loading,
  currentPage,
  totalPages,
  onPageChange,
  selectedVisitorIds,
  setSelectedVisitorIds,
  onViewDetails,
}: Props) {
  const [noteModal, setNoteModal] = useState<{ open: boolean; text: string }>({
    open: false,
    text: "",
  });

  const [permissions, setPermissions] = useState<string[]>([]);
  const [roleSlug, setRoleSlug] = useState("");

  // Prevent state updates after unmount
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    (async () => {
      try {
        const { permissions, roleSlug } = await getMyPermissions();
        if (isMounted.current) {
          setPermissions(permissions || []);
          setRoleSlug(roleSlug || "");
        }
      } catch {
        // ignore – permissions stay empty
      }
    })();
    return () => {
      isMounted.current = false;
    };
  }, []);

  const canCopyLink = permissions.includes("can_copy_bulk_visitor_link");
  const canSeeLink = roleSlug === "occupants";

  // Safe values for pagination
  const safeCurrentPage = Number(currentPage) || 1;
  const safeTotalPages = Number(totalPages) || 1;

  // Safely call setSelectedVisitorIds only if it's a function
  const safeSetSelected = (updater: (prev: string[]) => string[]) => {
    if (typeof setSelectedVisitorIds === "function") {
      setSelectedVisitorIds(updater);
    }
  };

  const toggleSelect = (id: string) => {
    safeSetSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    safeSetSelected((prev) =>
      prev.length === visitors.length ? [] : visitors.map((v) => v._id),
    );
  };

  const handleCopyLink = async (id: string) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(
        `${api_url}get/flat/bulk/visitor/${id}/copy/link`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (data.bulkVisitorLink) {
        await Clipboard.setStringAsync(data.bulkVisitorLink);
        toast("Link copied");
      } else {
        toast("No link available");
      }
    } catch {
      toast("Failed to copy link");
    }
  };

  // Safe date formatting
  const formatDate = (dateStr?: string) =>
    dateStr ? new Date(dateStr).toLocaleDateString() : "";

  // Pagination handlers (same style as VisitorsList)
  const handlePrevPage = () => {
    if (typeof onPageChange === "function" && safeCurrentPage > 1) {
      onPageChange(safeCurrentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (
      typeof onPageChange === "function" &&
      safeCurrentPage < safeTotalPages
    ) {
      onPageChange(safeCurrentPage + 1);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* TABLE */}
      <ScrollView horizontal>
        <View>
          {/* HEADER */}
          <View style={[styles.row, styles.header]}>
            <View style={styles.cellCheckbox}>
              <TouchableOpacity onPress={toggleSelectAll}>
                <Text style={styles.checkbox}>
                  {visitors.length > 0 &&
                  selectedVisitorIds.length === visitors.length
                    ? "✓"
                    : ""}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.th}>Bulk Visitor Id</Text>
            <Text style={styles.th}>Flat / Apartment</Text>
            <Text style={styles.th}>Event</Text>
            <Text style={styles.th}>Expected</Text>
            <Text style={styles.th}>Type</Text>
            <Text style={styles.th}>Date</Text>
            <Text style={styles.th}>Time</Text>
            <Text style={styles.th}>Notes</Text>
            <Text style={styles.th}>Details</Text>
            {(canCopyLink || canSeeLink) && <Text style={styles.th}>Link</Text>}
          </View>

          {/* BODY */}
          {loading ? (
            <View style={{ padding: 24 }}>
              <ActivityIndicator color="#1eb88c" />
            </View>
          ) : visitors.length === 0 ? (
            <Text style={styles.empty}>No bulk visitors found.</Text>
          ) : (
            visitors.map((v) => {
              const isSelected = selectedVisitorIds.includes(v._id);

              // Build display date safely
              let displayDate = "";
              if (v.isMultipleDays) {
                displayDate =
                  v.fromDate && v.toDate
                    ? `${formatDate(v.fromDate)} - ${formatDate(v.toDate)}`
                    : "";
              } else {
                displayDate = v.visitDate ? formatDate(v.visitDate) : "";
              }

              return (
                <View
                  key={v._id}
                  style={[
                    styles.row,
                    isSelected && { backgroundColor: "#e6f7f4" },
                  ]}
                >
                  <View style={styles.cellCheckbox}>
                    <TouchableOpacity onPress={() => toggleSelect(v._id)}>
                      <Text style={styles.checkbox}>
                        {isSelected ? "✓" : ""}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.td}>{v.bulkVisitorId}</Text>
                  <Text style={styles.td}>
                    {v.isForEntireApartment
                      ? "Entire Apartment"
                      : `${v.flatName || ""}-${v.blockName || ""}`}
                  </Text>
                  <Text style={styles.td}>{v.eventPurpose}</Text>
                  <Text style={styles.td}>{v.expectedCount}</Text>
                  <Text style={styles.td}>
                    {v.isMultipleDays ? "Multi-Day" : "Single Day"}
                  </Text>
                  <Text style={styles.td}>{displayDate}</Text>
                  <Text style={styles.td}>
                    {v.fromTime} - {v.toTime}
                  </Text>

                  <TouchableOpacity
                    onPress={() =>
                      setNoteModal({
                        open: true,
                        text: v.notes || "No notes provided.",
                      })
                    }
                  >
                    <Text style={styles.link}>View</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => onViewDetails(v._id)}>
                    <Text style={styles.link}>View</Text>
                  </TouchableOpacity>

                  {(canCopyLink || canSeeLink) && (
                    <TouchableOpacity onPress={() => handleCopyLink(v._id)}>
                      <Text style={styles.link}>Copy</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* PAGINATION - Updated to match VisitorsList style */}
      {safeTotalPages > 1 && (
        <View style={styles.pagination}>
          <Pressable
            style={[
              styles.pageButton,
              safeCurrentPage === 1 && styles.disabledButton,
            ]}
            onPress={handlePrevPage}
            disabled={safeCurrentPage === 1}
          >
            <Text style={styles.buttonText}>Previous</Text>
          </Pressable>

          <Text style={styles.pageInfo}>
            Page {safeCurrentPage} of {safeTotalPages}
          </Text>

          <Pressable
            style={[
              styles.pageButton,
              safeCurrentPage === safeTotalPages && styles.disabledButton,
            ]}
            onPress={handleNextPage}
            disabled={safeCurrentPage === safeTotalPages}
          >
            <Text style={styles.buttonText}>Next</Text>
          </Pressable>
        </View>
      )}

      {/* NOTES MODAL */}
      <Modal visible={noteModal.open} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Visitor Notes</Text>
            <Text style={styles.modalText}>{noteModal.text}</Text>

            <TouchableOpacity
              onPress={() => setNoteModal({ open: false, text: "" })}
              style={styles.modalBtn}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ---------- styles (updated pagination styles) ----------
const CELL_WIDTH = 140;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  header: {
    backgroundColor: "#f4f6f8",
  },
  th: {
    width: CELL_WIDTH,
    fontSize: 13,
    fontWeight: "600",
  },
  td: {
    width: CELL_WIDTH,
    fontSize: 13,
  },
  cellCheckbox: {
    width: 40,
    alignItems: "center",
  },
  checkbox: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    width: 22,
    height: 22,
    textAlign: "center",
    borderRadius: 4,
    fontWeight: "700",
  },
  link: {
    width: CELL_WIDTH,
    color: "#1eb88c",
    fontWeight: "600",
  },
  empty: {
    padding: 24,
    color: "#6b7280",
  },
  // Pagination styles (copied from VisitorsList)
  pagination: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  pageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#1eb88c",
    borderRadius: 8,
    minWidth: 90,
  },
  disabledButton: {
    backgroundColor: "#cbd5e1",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
  },
  pageInfo: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    width: "90%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  modalText: {
    color: "#374151",
  },
  modalBtn: {
    marginTop: 16,
    backgroundColor: "#1eb88c",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
});
