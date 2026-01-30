// app/apartments/visitors/bulk/index.tsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";

import { api_url } from "../../../utils/apiLocalhost";

const DEFAULT_LIMIT = 10;
const COL_WIDTH = 140;

// ---------- Helpers ----------
const nativeToast = (msg: string) => {
  if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
  else Alert.alert("", msg);
};

// ---------- Notes Modal ----------
const NotesModal = ({ isVisible, onClose, notes }: any) => {
  if (!isVisible) return null;

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Notes</Text>
        <Text style={styles.notesText}>{notes || "No notes available"}</Text>

        <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
          <Text style={styles.modalCloseText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ---------- Main ----------
export default function BulkVisitors({ onBack }: { onBack?: () => void }) {
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalVisitors, setTotalVisitors] = useState(0);

  const [searchText, setSearchText] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [limit, setLimit] = useState(DEFAULT_LIMIT);

  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState("");

  const getApartmentId = async () => {
    const raw = await AsyncStorage.getItem("upbuild_user_store");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.user?.apartment ?? null;
  };

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
    } catch (err: any) {
      nativeToast(err?.message || "Failed to load bulk visitors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBulkVisitors(currentPage);
  }, [currentPage, searchText, fromDate, toDate, limit]);

  const totalPages = Math.max(1, Math.ceil(totalVisitors / limit));

  return (
    <View style={styles.container}>
      {/* FILTER + ACTION ROW (MATCHES SS) */}

      {/* TABLE */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          <View style={[styles.row, styles.tableHeader]}>
            {[
              "Bulk Visitor Id",
              "Flat / Apartment",
              "Event",
              "Visitor Expected Count",
              "Type",
              "Date",
              "Time",
              "Notes",
              "Details",
            ].map((h) => (
              <Text key={h} style={styles.th}>
                {h}
              </Text>
            ))}
          </View>

          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator color="#1eb88c" />
            </View>
          ) : visitors.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text>No bulk visitors found</Text>
            </View>
          ) : (
            visitors.map((v) => (
              <View key={v._id} style={styles.row}>
                <Text style={styles.cell}>{v.bulkVisitorId}</Text>
                <Text style={styles.cell}>
                  {v.isForEntireApartment
                    ? "Entire Apartment"
                    : `${v.flatName}-${v.blockName}`}
                </Text>
                <Text style={styles.cell}>{v.eventPurpose}</Text>
                <Text style={styles.cell}>{v.expectedCount}</Text>
                <Text style={styles.cell}>Single Day</Text>
                <Text style={styles.cell}>
                  {v.visitDate
                    ? new Date(v.visitDate).toLocaleDateString()
                    : "-"}
                </Text>
                <Text style={styles.cell}>
                  {v.fromTime} - {v.toTime}
                </Text>

                <TouchableOpacity
                  onPress={() => {
                    setSelectedNotes(v.notes || "");
                    setNotesModalVisible(true);
                  }}
                >
                  <Text style={styles.link}>View</Text>
                </TouchableOpacity>

                <TouchableOpacity>
                  <Text style={styles.link}>View</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <View style={styles.pagination}>
          <TouchableOpacity
            disabled={currentPage === 1}
            onPress={() => setCurrentPage((p) => p - 1)}
          >
            <Text>{"<<"}</Text>
          </TouchableOpacity>

          <View style={styles.pageBox}>
            <Text style={styles.pageText}>{currentPage}</Text>
          </View>

          <TouchableOpacity
            disabled={currentPage === totalPages}
            onPress={() => setCurrentPage((p) => p + 1)}
          >
            <Text>{">>"}</Text>
          </TouchableOpacity>
        </View>
      )}

      <NotesModal
        isVisible={notesModalVisible}
        onClose={() => setNotesModalVisible(false)}
        notes={selectedNotes}
      />
    </View>
  );
}

// ---------- STYLES ----------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6f7f9" },

  pageHeader: { paddingHorizontal: 16, paddingTop: 16 },
  backText: { color: "#1eb88c", fontWeight: "700" },

  headerCard: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  headerLeft: { flexDirection: "row", gap: 12 },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1eb88c",
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: { fontSize: 16, fontWeight: "700" },
  headerSubtitle: { fontSize: 13, color: "#6b7280" },

  headerActions: { flexDirection: "row", gap: 10 },
  exportBtn: {
    backgroundColor: "#1eb88c",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtn: {
    backgroundColor: "#1eb88c",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  btnText: { color: "#fff", fontWeight: "700" },

  filterCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  filterLeft: { flex: 2 },
  filterRight: { flex: 1, gap: 12 },

  label: { fontSize: 12, color: "#6b7280", marginBottom: 4 },

  searchInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    padding: 12,
  },

  dateRow: { flexDirection: "row", gap: 12 },
  dateBox: { flex: 1 },

  dateInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    padding: 12,
  },

  perPageBox: { width: 120 },
  perPageSelect: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },

  table: { backgroundColor: "#fff", margin: 16, borderRadius: 12 },
  tableHeader: {
    backgroundColor: "#f4f6f8",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },

  row: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },

  th: { width: COL_WIDTH, fontSize: 12, fontWeight: "700" },
  cell: { width: COL_WIDTH, fontSize: 13 },
  link: { width: COL_WIDTH, color: "#1eb88c", fontWeight: "700" },

  loader: { padding: 24 },
  emptyContainer: { padding: 24, alignItems: "center" },

  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginVertical: 20,
  },
  pageBox: {
    backgroundColor: "#1eb88c",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  pageText: { color: "#fff", fontWeight: "700" },

  modalOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "90%",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  modalCloseBtn: {
    marginTop: 12,
    backgroundColor: "#1eb88c",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  modalCloseText: { color: "#fff", fontWeight: "700" },
  notesText: { fontSize: 14 },
});
