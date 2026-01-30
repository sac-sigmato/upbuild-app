import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
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
  visitors: BulkVisitor[];
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
  visitors,
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

  useEffect(() => {
    (async () => {
      const { permissions, roleSlug } = await getMyPermissions();
      setPermissions(permissions || []);
      setRoleSlug(roleSlug || "");
    })();
  }, []);

  const canCopyLink = permissions.includes("can_copy_bulk_visitor_link");
  const canSeeLink = roleSlug === "occupants";

  const toggleSelect = (id: string) => {
    setSelectedVisitorIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedVisitorIds.length === visitors.length) {
      setSelectedVisitorIds([]);
    } else {
      setSelectedVisitorIds(visitors.map((v) => v._id));
    }
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
      await Clipboard.setStringAsync(data.bulkVisitorLink);
      toast("Link copied");
    } catch {
      toast("Failed to copy link");
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

              const displayDate = v.isMultipleDays
                ? `${new Date(v.fromDate!).toLocaleDateString()} - ${new Date(
                    v.toDate!,
                  ).toLocaleDateString()}`
                : new Date(v.visitDate!).toLocaleDateString();

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
                      : `${v.flatName}-${v.blockName}`}
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

      {/* PAGINATION */}
      <View style={styles.pagination}>
        <TouchableOpacity
          disabled={currentPage === 1}
          onPress={() => onPageChange(currentPage - 1)}
        >
          <Text>{"<<"}</Text>
        </TouchableOpacity>

        <Text style={styles.pageNo}>{currentPage}</Text>

        <TouchableOpacity
          disabled={currentPage === totalPages}
          onPress={() => onPageChange(currentPage + 1)}
        >
          <Text>{">>"}</Text>
        </TouchableOpacity>
      </View>

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

// ---------- styles ----------
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
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    paddingVertical: 16,
  },
  pageNo: {
    backgroundColor: "#1eb88c",
    color: "#fff",
    paddingHorizontal: 10,
    borderRadius: 6,
    fontWeight: "700",
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
