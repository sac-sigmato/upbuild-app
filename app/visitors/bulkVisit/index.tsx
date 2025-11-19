// app/apartments/visitors/bulk/index.tsx
import VisitorsFilters from "@/components/visitors/VisitorsFilters";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Eye, FileText, Users } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";

import { api_url } from "../../../utils/apiLocalhost";

// ---------- CONFIG ----------
const DEFAULT_LIMIT = 10;

// ---------- Helpers ----------
const nativeToast = (msg: string) => {
  if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
  else Alert.alert("", msg);
};

const getMyPermissions = async () => {
  const token = await AsyncStorage.getItem("token");
  if (!token) return { permissions: [] as string[] };
  try {
    const res = await fetch(`${api_url}user/get/my/permissions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { permissions: [] as string[] };
    const data = await res.json();
    return {
      permissions: Array.isArray(data.permissions) ? data.permissions : [],
    };
  } catch {
    return { permissions: [] as string[] };
  }
};

// ---------- Notes Modal ----------
const NotesModal = ({ isVisible, onClose, notes }: any) => {
  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Notes</Text>
          <Text style={styles.notesText}>{notes || "No notes available"}</Text>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ---------- Date Range Modal ----------
const ExportDateRangeModal = ({ isOpen, onClose, onExport }: any) => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!fromDate || !toDate) {
      nativeToast("Please select both dates");
      return;
    }
    setLoading(true);
    await onExport(fromDate, toDate);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Export by Date Range</Text>

        <View style={styles.modalInputGroup}>
          <View style={styles.modalInputContainer}>
            <Text style={styles.modalLabel}>From Date</Text>
            <TextInput
              value={fromDate}
              onChangeText={setFromDate}
              placeholder="YYYY-MM-DD"
              style={styles.modalInput}
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.modalInputContainer}>
            <Text style={styles.modalLabel}>To Date</Text>
            <TextInput
              value={toDate}
              onChangeText={setToDate}
              placeholder="YYYY-MM-DD"
              style={styles.modalInput}
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        <View style={styles.modalActions}>
          <TouchableOpacity onPress={onClose} style={styles.modalCancelBtn}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleExport}
            disabled={loading}
            style={[styles.modalExportBtn, loading && styles.disabledBtn]}
          >
            <Text style={styles.modalExportText}>
              {loading ? "Exporting..." : "Export"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ---------- Bulk Visitors Component ----------
export default function BulkVisitors({ navigation }: any) {
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalVisitors, setTotalVisitors] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [selectedLimit, setSelectedLimit] = useState(DEFAULT_LIMIT);
  const [selectedVisitorIds, setSelectedVisitorIds] = useState<string[]>([]);
  const [loadingExport, setLoadingExport] = useState(false);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedAcceptStatus, setSelectedAcceptStatus] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState("");

  const canExportVisitors = permissions.includes("can_export_visitors_data");

  const getApartmentId = async (): Promise<string | null> => {
    try {
      const raw = await AsyncStorage.getItem("upbuild_user_store");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.state?.user?.apartment ?? null;
    } catch {
      return null;
    }
  };

  const fetchVisitors = async (page = 1, limit = selectedLimit) => {
    const token = await AsyncStorage.getItem("token");
    const apartmentId = await getApartmentId();

    if (!apartmentId) {
      nativeToast("Apartment ID missing");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

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

  const handleExport = async () => {
    if (selectedVisitorIds.length === 0) {
      setShowDateRangeModal(true);
      return;
    }

    try {
      setLoadingExport(true);
      const token = await AsyncStorage.getItem("token");
      const apartmentId = await getApartmentId();

      const res = await fetch(`${api_url}export/visitors/bulk/pdf`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ visitorIds: selectedVisitorIds, apartmentId }),
      });

      if (!res.ok) {
        const text = await res.text();
        let errData: any = null;
        try {
          errData = JSON.parse(text);
        } catch {
          errData = null;
        }
        throw new Error(errData?.message || text || "Failed to export");
      }

      nativeToast("Export request sent successfully");
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
      const token = await AsyncStorage.getItem("token");
      const apartmentId = await getApartmentId();

      const res = await fetch(`${api_url}export/visitors/bulk/pdf`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fromDate: fromD, toDate: toD, apartmentId }),
      });

      if (!res.ok) {
        const text = await res.text();
        let errData: any = null;
        try {
          errData = JSON.parse(text);
        } catch {
          errData = null;
        }
        throw new Error(errData?.message || text || "Failed to export");
      }

      nativeToast("Export request sent successfully");
    } catch (err: any) {
      console.error(err);
      nativeToast(err?.message || "Failed to export visitors.");
    } finally {
      setLoadingExport(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedVisitorIds((prev: string[]) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedVisitorIds.length === visitors.length) {
      setSelectedVisitorIds([]);
    } else {
      setSelectedVisitorIds(visitors.map((v: any) => v._id));
    }
  };

  const handleViewNotes = (notes: string) => {
    setSelectedNotes(notes);
    setNotesModalVisible(true);
  };

  const handleViewDetails = (id: string) => {
    console.log(id, "bulk visitor id");
    // Navigate to details component with the bulkVisitorId
    router.push(`/visitors/bulkVisit/bulkVisitorDetails?id=${id}` as any);
  };

  const renderVisitorItem = ({ item }: { item: any }) => {
    const isSelected = selectedVisitorIds.includes(item._id);

    // Format date and time for display
    const displayDate = item.visitDate
      ? new Date(item.visitDate).toLocaleDateString()
      : "-";
    const displayTime = item.visitTime || item.timeSlot || "-";

    return (
      <View
        style={[styles.visitorCard, isSelected && styles.visitorCardSelected]}
      >
        {/* Checkbox - Made larger and more visible */}
        <TouchableOpacity
          onPress={() => toggleSelect(item._id)}
          style={styles.visitorCheckbox}
        >
          <View
            style={[styles.checkbox, isSelected && styles.checkboxSelected]}
          >
            {isSelected && <Text style={styles.checkboxTick}>✓</Text>}
          </View>
        </TouchableOpacity>

        {/* Visitor Info */}
        <View style={styles.visitorInfo}>
          {/* Bulk Visitor ID */}
          <Text style={styles.visitorTitle}>
            {item.bulkVisitorId || "Bulk Visit"}
          </Text>

          {/* Main Details Row */}
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>📍 Flat</Text>
              <Text style={styles.detailValue}>
                {item.flatName || item.flatNumber || "-"}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>🎉 Event</Text>
              <Text style={styles.detailValue}>
                {item.eventPurpose || item.eventType || "Event"}
              </Text>
            </View>
          </View>

          {/* Second Details Row */}
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>👥 Visitors</Text>
              <Text style={styles.detailValue}>
                {item.expectedCount || "0"}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>📅 Type</Text>
              <Text style={styles.detailValue}>
                {item.isMultipleDays ? "Multi-day" : "Single-day"}
              </Text>
            </View>
          </View>

          {/* Third Details Row */}
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>📅 Date</Text>
              <Text style={styles.detailValue}>{displayDate}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>⏰ Time</Text>
              <Text style={styles.detailValue}>{displayTime}</Text>
            </View>
          </View>

          {/* Action Buttons - Fixed positioning */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={() => handleViewNotes(item.notes || "")}
              style={[styles.actionButton, styles.notesButton]}
            >
              <FileText size={16} color="#6b7280" />
              <Text style={styles.actionButtonText}>Notes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleViewDetails(item._id)}
              style={[styles.actionButton, styles.detailsButton]}
            >
              <Eye size={16} color="#1eb88c" />
              <Text style={styles.actionButtonText}>Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  useEffect(() => {
    getMyPermissions().then((res) => setPermissions(res.permissions || []));
  }, []);

  useEffect(() => {
    setSelectedVisitorIds([]);
  }, [visitors]);

  useEffect(() => {
    fetchVisitors(currentPage, selectedLimit);
  }, [currentPage, searchText, selectedLimit, fromDate, toDate]);

  const totalPages = Math.max(1, Math.ceil(totalVisitors / selectedLimit));

  return (
    <View style={styles.container}>
      {/* Add VisitorsFilters Component */}
      <VisitorsFilters
        fromDate={fromDate}
        toDate={toDate}
        searchText={searchText}
        selectedStatus="" // Remove this
        selectedAcceptStatus="" // Remove this
        selectedLimit={selectedLimit}
        selectedVisitorIds={selectedVisitorIds}
        canExportVisitors={canExportVisitors}
        loadingExport={loadingExport}
        setFromDate={setFromDate}
        setToDate={setToDate}
        setSearchText={setSearchText}
        setSelectedStatus={() => {}} // Remove this
        setSelectedAcceptStatus={() => {}} // Remove this
        setSelectedLimit={setSelectedLimit}
        setCurrentPage={setCurrentPage}
        handleExport={handleExport}
        activeTab="bulk visitors"
      />

      {/* Main Content Area */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Select All - Fixed at top */}
        {!loading && visitors.length > 0 && (
          <View style={styles.selectAllContainer}>
            <TouchableOpacity
              onPress={toggleSelectAll}
              style={styles.selectAllBtn}
            >
              <View
                style={[
                  styles.checkbox,
                  selectedVisitorIds.length === visitors.length &&
                    styles.checkboxSelected,
                ]}
              >
                {selectedVisitorIds.length === visitors.length && (
                  <Text style={styles.checkboxTick}>✓</Text>
                )}
              </View>
              <Text style={styles.selectAllText}>
                {selectedVisitorIds.length === visitors.length
                  ? "Unselect All"
                  : "Select All"}
              </Text>
            </TouchableOpacity>
            <Text style={styles.selectedCount}>
              {selectedVisitorIds.length} of {visitors.length} selected
            </Text>
          </View>
        )}

        {/* Visitors List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1eb88c" />
            <Text style={styles.loadingText}>Loading visitors...</Text>
          </View>
        ) : visitors.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Users size={40} color="#9ca3af" />
            <Text style={styles.emptyText}>No bulk visitors found</Text>
            <Text style={styles.emptySubText}>
              Add your first bulk visitor to get started
            </Text>
          </View>
        ) : (
          <View style={styles.visitorsList}>
            {visitors.map((item) => (
              <View key={item._id}>{renderVisitorItem({ item })}</View>
            ))}
          </View>
        )}

        {/* Pagination */}
        {!loading && visitors.length > 0 && totalPages > 1 && (
          <View style={styles.pagination}>
            <TouchableOpacity
              onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              style={[
                styles.paginationBtn,
                currentPage === 1 && styles.paginationBtnDisabled,
              ]}
            >
              <Text
                style={[
                  styles.paginationText,
                  currentPage === 1 && styles.paginationTextDisabled,
                ]}
              >
                Previous
              </Text>
            </TouchableOpacity>

            <Text style={styles.paginationInfo}>
              Page {currentPage} of {totalPages}
            </Text>

            <TouchableOpacity
              onPress={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              style={[
                styles.paginationBtn,
                currentPage === totalPages && styles.paginationBtnDisabled,
              ]}
            >
              <Text
                style={[
                  styles.paginationText,
                  currentPage === totalPages && styles.paginationTextDisabled,
                ]}
              >
                Next
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Notes Modal */}
      <NotesModal
        isVisible={notesModalVisible}
        onClose={() => setNotesModalVisible(false)}
        notes={selectedNotes}
      />

      {/* Date Range Modal */}
      <ExportDateRangeModal
        isOpen={showDateRangeModal}
        onClose={() => setShowDateRangeModal(false)}
        onExport={handleExportByDateRange}
      />
    </View>
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  selectAllContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  selectAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  selectAllText: {
    color: "#1eb88c",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 8,
  },
  selectedCount: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  visitorsList: {
    gap: 12,
  },
  visitorCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  visitorCardSelected: {
    backgroundColor: "#f0fdf9",
    borderColor: "#1eb88c",
    borderWidth: 2,
  },
  visitorCheckbox: {
    marginRight: 12,
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  checkboxSelected: {
    backgroundColor: "#1eb88c",
    borderColor: "#1eb88c",
  },
  checkboxTick: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  visitorInfo: {
    flex: 1,
  },
  visitorTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailItem: {
    flex: 1,
    marginRight: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginTop: 12,
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    minWidth: 80,
    justifyContent: "center",
  },
  notesButton: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  detailsButton: {
    backgroundColor: "#f0fdf9",
    borderWidth: 1,
    borderColor: "#1eb88c",
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 12,
    fontWeight: "600",
  },
  emptySubText: {
    fontSize: 13,
    color: "#9ca3af",
    marginTop: 6,
    textAlign: "center",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  paginationBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#1eb88c",
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  paginationBtnDisabled: {
    backgroundColor: "#e5e7eb",
  },
  paginationText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  paginationTextDisabled: {
    color: "#9ca3af",
  },
  paginationInfo: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  disabledBtn: {
    opacity: 0.6,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#fff",
    margin: 20,
    padding: 20,
    borderRadius: 12,
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 16,
    textAlign: "center",
  },
  modalInputGroup: {
    gap: 12,
    marginBottom: 20,
  },
  modalInputContainer: {
    gap: 6,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#374151",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    alignItems: "center",
  },
  modalCancelText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 14,
  },
  modalExportBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: "#1eb88c",
    borderRadius: 8,
    alignItems: "center",
  },
  modalExportText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  modalCloseBtn: {
    paddingVertical: 10,
    backgroundColor: "#1eb88c",
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  modalCloseText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  notesContent: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    minHeight: 100,
    maxHeight: 200,
  },
  notesText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
});
