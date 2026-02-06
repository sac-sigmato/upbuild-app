"use client";

import DateTimePicker from "@react-native-community/datetimepicker";
import {
  Calendar,
  ChevronDown,
  Download,
  Filter,
  Search,
  X,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
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

/* ---------- Props ---------- */
type Props = {
  fromDate: string;
  toDate: string;
  searchText: string;
  selectedLimit: number;

  /** ✅ EXPORT (same as VisitorsFilters) */
  selectedVisitorIds: string[];
  canExportVisitors: boolean;
  loadingExport: boolean;
  handleExport: () => void;

  setFromDate: (val: string) => void;
  setToDate: (val: string) => void;
  setSearchText: (val: string) => void;
  setSelectedLimit: (val: number) => void;
  setCurrentPage: (val: number) => void;
};

const nativeToast = (msg: string) => {
  if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
  else console.log(msg);
};

const { height: screenHeight } = Dimensions.get("window");

/* ---------- Dropdown ---------- */
const CustomDropdown = ({
  label,
  value,
  items,
  onValueChange,
}: {
  label: string;
  value: string;
  items: { label: string; value: string }[];
  onValueChange: (value: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const selected = items.find((i) => i.value === value) || items[0];
  const [showNoSelectionModal, setShowNoSelectionModal] = useState(false);

  return (
    <View style={styles.dropdownContainer}>
      <Text style={styles.inputLabel}>{label}</Text>

      <TouchableOpacity style={styles.dropdown} onPress={() => setOpen(true)}>
        <Text style={styles.dropdownText}>{selected.label}</Text>
        <ChevronDown size={16} color="#6b7280" />
      </TouchableOpacity>

      <Modal transparent visible={open} animationType="fade">
        <TouchableOpacity
          style={styles.dropdownModalOverlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={styles.dropdownModalContent}>
            <View style={styles.dropdownModalHeader}>
              <Text style={styles.dropdownModalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <X size={18} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {items.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={styles.dropdownModalOption}
                  onPress={() => {
                    onValueChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownModalOptionText,
                      value === item.value && {
                        color: "#1eb88c",
                        fontWeight: "600",
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

/* ---------- Main ---------- */
export default function BulkVisitorsFilters({
  fromDate,
  toDate,
  searchText,
  selectedLimit,
  selectedVisitorIds,
  canExportVisitors,
  loadingExport,
  handleExport,
  setFromDate,
  setToDate,
  setSearchText,
  setSelectedLimit,
  setCurrentPage,
}: Props) {
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const formatDate = (val: string) =>
    val
      ? new Date(val).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "Select date";

  const clearFilters = () => {
    setFromDate("");
    setToDate("");
    setSelectedLimit(10);
    setCurrentPage(1);
    setShowFilterModal(false);
  };

  const limitOptions = [
    { label: "10 items", value: "10" },
    { label: "25 items", value: "25" },
    { label: "50 items", value: "50" },
    { label: "100 items", value: "100" },
  ];

  const hasActiveFilters = fromDate || toDate || selectedLimit !== 10;

  return (
    <View style={styles.container}>
      {/* Header Card */}
      <View style={styles.card}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Bulk Visitors</Text>
            <Text style={styles.subtitle}>
              Manage apartment bulk visitor entries
            </Text>
          </View>

          {/* ✅ ACTION BUTTONS (MATCH VisitorsFilters) */}
          <View style={styles.actionButtons}>
            {canExportVisitors && (
              <TouchableOpacity
                onPress={handleExport} // ✅ ALWAYS CALL
                disabled={loadingExport}
                style={[
                  styles.circleButton,
                  loadingExport && styles.buttonDisabled,
                ]}
              >
                {loadingExport ? (
                  <ActivityIndicator size="small" color="#1EB88C" />
                ) : (
                  <Download size={18} color="#1EB88C" />
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => setShowFilterModal(true)}
              style={[
                styles.circleButton,
                hasActiveFilters && styles.circleButtonActive,
              ]}
            >
              <Filter size={18} color={hasActiveFilters ? "#fff" : "#1EB88C"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Search size={16} color="#6B7280" />
          <TextInput
            placeholder="Search event, flat, block..."
            value={searchText}
            onChangeText={(t) => {
              setSearchText(t);
              setCurrentPage(1);
            }}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Filter Modal */}
      <Modal transparent animationType="slide" visible={showFilterModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Bulk Visitors</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {/* Date Range */}
              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>Date Range</Text>

                <View style={styles.dateRow}>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => setShowFromPicker(true)}
                  >
                    <Calendar size={16} color="#6b7280" />
                    <Text>{formatDate(fromDate)}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => setShowToPicker(true)}
                  >
                    <Calendar size={16} color="#6b7280" />
                    <Text>{formatDate(toDate)}</Text>
                  </TouchableOpacity>
                </View>

                {showFromPicker && (
                  <DateTimePicker
                    value={fromDate ? new Date(fromDate) : new Date()}
                    mode="date"
                    onChange={(_, d) => {
                      setShowFromPicker(false);
                      d && setFromDate(d.toISOString().split("T")[0]);
                    }}
                  />
                )}

                {showToPicker && (
                  <DateTimePicker
                    value={toDate ? new Date(toDate) : new Date()}
                    mode="date"
                    onChange={(_, d) => {
                      setShowToPicker(false);
                      d && setToDate(d.toISOString().split("T")[0]);
                    }}
                  />
                )}
              </View>

              {/* Display */}
              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>Display</Text>
                <CustomDropdown
                  label="Items per page"
                  value={String(selectedLimit)}
                  items={limitOptions}
                  onValueChange={(v) => setSelectedLimit(Number(v))}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={clearFilters}
                style={styles.clearButton}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setCurrentPage(1);
                  setShowFilterModal(false);
                }}
                style={styles.applyButton}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ---------- STYLES ----------

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    // padding: 16,
    // borderBottomWidth: 1,
    // borderBottomColor: "#e5e7eb",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },

  subtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },

  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  circleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ECFEF7",
    alignItems: "center",
    justifyContent: "center",
  },

  circleButtonActive: {
    backgroundColor: "#1EB88C",
  },

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1EB88C",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },

  addButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },

  searchInput: {
    flex: 1,
    fontSize: 13,
    marginLeft: 8,
    color: "#374151",
  },

  titleSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#00b8d9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  iconText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  activeFilterButton: {
    backgroundColor: "#1eb88c",
    borderColor: "#1eb88c",
  },
  buttonDisabled: {
    opacity: 0.5,
  },

  searchIcon: {
    marginRight: 8,
  },

  selectedContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f0fdf9",
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#c8e7dd",
  },
  selectedText: {
    fontSize: 12,
    color: "#1e7f65",
    fontWeight: "500",
  },
  exportSmallButton: {
    backgroundColor: "#1eb88c",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  exportSmallText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },

  // Main Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.85,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
  },
  closeButton: {
    padding: 4,
  },
  modalScrollView: {
    maxHeight: screenHeight * 0.85 - 140,
  },
  modalSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: "row",
    gap: 12,
  },
  dateInputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
    marginBottom: 8,
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    gap: 8,
    minHeight: 44,
  },
  dateInputText: {
    fontSize: 14,
    color: "#374151",
  },

  // Dropdown Styles
  dropdownContainer: {
    marginBottom: 16,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
    minHeight: 44,
  },
  dropdownText: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
  },

  // Dropdown Modal Styles
  dropdownModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dropdownModalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "90%",
    maxHeight: "70%",
    elevation: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  dropdownModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  dropdownModalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  dropdownCloseButton: {
    padding: 4,
  },
  dropdownModalScrollView: {
    maxHeight: 300,
  },
  dropdownModalOption: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownModalOptionLast: {
    borderBottomWidth: 0,
  },
  dropdownModalOptionText: {
    fontSize: 16,
    color: "#374151",
    flex: 1,
  },
  dropdownModalOptionTextSelected: {
    color: "#1eb88c",
    fontWeight: "600",
  },
  selectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1eb88c",
  },

  modalFooter: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  clearButtonText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 14,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#1eb88c",
    borderRadius: 8,
    alignItems: "center",
  },
  applyButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
