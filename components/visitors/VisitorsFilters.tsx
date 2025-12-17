"use client";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import {
  Calendar,
  ChevronDown,
  Download,
  Filter,
  Search,
  UserPlus,
  X,
} from "lucide-react-native";
import React, { useState } from "react";
import {
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

type Props = {
  fromDate: string;
  toDate: string;
  searchText: string;
  selectedStatus: string;
  selectedAcceptStatus: string;
  selectedLimit: number;
  selectedVisitorIds: string[];
  canExportVisitors: boolean;
  loadingExport: boolean;

  setFromDate: (val: string) => void;
  setToDate: (val: string) => void;
  setSearchText: (val: string) => void;
  setSelectedStatus: (val: string) => void;
  setSelectedAcceptStatus: (val: string) => void;
  setSelectedLimit: (val: number) => void;
  setCurrentPage: (val: number) => void;
  handleExport: () => void;
};

const nativeToast = (msg: string) => {
  if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
  else console.log(msg);
};

const { height: screenHeight } = Dimensions.get("window");

// Custom Dropdown Component with Individual Modal
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
  const [showDropdownModal, setShowDropdownModal] = useState(false);

  const selectedItem = items.find((item) => item.value === value) || items[0];

  const handleSelect = (itemValue: string) => {
    onValueChange(itemValue);
    setShowDropdownModal(false);
  };

  return (
    <View style={styles.dropdownContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setShowDropdownModal(true)}
      >
        <Text style={styles.dropdownText}>
          {selectedItem?.label || "Select..."}
        </Text>
        <ChevronDown size={16} color="#6b7280" />
      </TouchableOpacity>

      {/* Dropdown Options Modal */}
      <Modal
        visible={showDropdownModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDropdownModal(false)}
      >
        <TouchableOpacity
          style={styles.dropdownModalOverlay}
          activeOpacity={1}
          onPress={() => setShowDropdownModal(false)}
        >
          <View style={styles.dropdownModalContent}>
            <View style={styles.dropdownModalHeader}>
              <Text style={styles.dropdownModalTitle}>{label}</Text>
              <TouchableOpacity
                onPress={() => setShowDropdownModal(false)}
                style={styles.dropdownCloseButton}
              >
                <X size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.dropdownModalScrollView}
              showsVerticalScrollIndicator={true}
            >
              {items.map((item, index) => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.dropdownModalOption,
                    index === items.length - 1 &&
                      styles.dropdownModalOptionLast,
                  ]}
                  onPress={() => handleSelect(item.value)}
                >
                  <Text
                    style={[
                      styles.dropdownModalOptionText,
                      value === item.value &&
                        styles.dropdownModalOptionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {value === item.value && (
                    <View style={styles.selectedIndicator} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default function VisitorsFilters({
  fromDate,
  toDate,
  searchText,
  selectedStatus,
  selectedAcceptStatus,
  selectedLimit,
  selectedVisitorIds,
  canExportVisitors,
  loadingExport,
  setFromDate,
  setToDate,
  setSearchText,
  setSelectedStatus,
  setSelectedAcceptStatus,
  setSelectedLimit,
  setCurrentPage,
  handleExport,
}: Props) {
  const router = useRouter();

  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const onChangeFrom = (_: any, selected?: Date) => {
    setShowFromPicker(false);
    if (selected) {
      const iso = selected.toISOString().split("T")[0];
      setFromDate(iso);
    }
  };

  const onChangeTo = (_: any, selected?: Date) => {
    setShowToPicker(false);
    if (selected) {
      const iso = selected.toISOString().split("T")[0];
      setToDate(iso);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Select date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const clearFilters = () => {
    setFromDate("");
    setToDate("");
    setSelectedStatus("");
    setSelectedAcceptStatus("");
    setSelectedLimit(10);
    setCurrentPage(1);
    setShowFilterModal(false);
  };

  const applyFilters = () => {
    setCurrentPage(1);
    setShowFilterModal(false);
  };

  const hasActiveFilters =
    fromDate ||
    toDate ||
    selectedStatus ||
    selectedAcceptStatus ||
    selectedLimit !== 10;

  // Dropdown options
  const statusOptions = [
    { label: "All Status", value: "" },
    { label: "Awaiting", value: "Awaiting" },
    { label: "Checked-In", value: "Checked-In" },
    { label: "Checked-Out", value: "Checked-Out" },
    { label: "Wrong Entry", value: "Wrong Entry" },
  ];

  const acceptStatusOptions = [
    { label: "All Responses", value: "" },
    { label: "Pending", value: "Pending" },
    { label: "Accepted", value: "Accepted" },
    { label: "Rejected", value: "Rejected" },
    { label: "N/A", value: "N/A" },
  ];

  const limitOptions = [
    { label: "10 items", value: "10" },
    { label: "25 items", value: "25" },
    { label: "50 items", value: "50" },
    { label: "100 items", value: "100" },
  ];

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>VM</Text>
          </View>
          <View>
            <Text style={styles.subtitle}>Manage apartment visitors</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          {canExportVisitors && selectedVisitorIds.length > 0 && (
            <TouchableOpacity
              onPress={handleExport}
              disabled={loadingExport}
              style={[
                styles.iconButton,
                loadingExport && styles.buttonDisabled,
              ]}
            >
              <Download
                size={18}
                color={loadingExport ? "#9ca3af" : "#1eb88c"}
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => setShowFilterModal(true)}
            style={[
              styles.iconButton,
              hasActiveFilters && styles.activeFilterButton,
            ]}
          >
            <Filter size={18} color={hasActiveFilters ? "#fff" : "#1eb88c"} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              router.push(`/visitors/add` as any);
            }}
            style={styles.addButton}
          >
            <UserPlus size={16} color="#fff" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={18} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          placeholder="Search visitors, phone, flat, occupant..."
          value={searchText}
          onChangeText={(text) => {
            setSearchText(text);
            setCurrentPage(1);
          }}
          style={styles.searchInput}
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Selected Count */}
      {selectedVisitorIds.length > 0 && (
        <View style={styles.selectedContainer}>
          <Text style={styles.selectedText}>
            {selectedVisitorIds.length} visitors selected
          </Text>
          {canExportVisitors && (
            <TouchableOpacity
              onPress={handleExport}
              disabled={loadingExport}
              style={styles.exportSmallButton}
            >
              <Text style={styles.exportSmallText}>
                {loadingExport ? "Exporting..." : "Export"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Visitors</Text>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                style={styles.closeButton}
              >
                <X size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={false}
            >
              {/* Date Range */}
              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>Date Range</Text>
                <View style={styles.dateRow}>
                  <View style={styles.dateInputContainer}>
                    <Text style={styles.inputLabel}>From Date</Text>
                    <TouchableOpacity
                      onPress={() => setShowFromPicker(true)}
                      style={styles.dateInput}
                    >
                      <Calendar size={16} color="#6b7280" />
                      <Text style={styles.dateInputText}>
                        {formatDate(fromDate)}
                      </Text>
                    </TouchableOpacity>
                    {showFromPicker && (
                      <DateTimePicker
                        value={fromDate ? new Date(fromDate) : new Date()}
                        mode="date"
                        display="default"
                        onChange={onChangeFrom}
                      />
                    )}
                  </View>

                  <View style={styles.dateInputContainer}>
                    <Text style={styles.inputLabel}>To Date</Text>
                    <TouchableOpacity
                      onPress={() => setShowToPicker(true)}
                      style={styles.dateInput}
                    >
                      <Calendar size={16} color="#6b7280" />
                      <Text style={styles.dateInputText}>
                        {formatDate(toDate)}
                      </Text>
                    </TouchableOpacity>
                    {showToPicker && (
                      <DateTimePicker
                        value={toDate ? new Date(toDate) : new Date()}
                        mode="date"
                        display="default"
                        onChange={onChangeTo}
                      />
                    )}
                  </View>
                </View>
              </View>

              {/* Status Filters */}
              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>Status</Text>

                <CustomDropdown
                  label="Visitor Status"
                  value={selectedStatus}
                  items={statusOptions}
                  onValueChange={setSelectedStatus}
                />

                <CustomDropdown
                  label="Accept Status"
                  value={selectedAcceptStatus}
                  items={acceptStatusOptions}
                  onValueChange={setSelectedAcceptStatus}
                />
              </View>

              {/* Display Settings */}
              <View style={styles.modalSection}>
                <Text style={styles.sectionTitle}>Display</Text>
                <CustomDropdown
                  label="Items per page"
                  value={selectedLimit.toString()}
                  items={limitOptions}
                  onValueChange={(value) => setSelectedLimit(Number(value))}
                />
              </View>
            </ScrollView>

            {/* Modal Footer Buttons */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={clearFilters}
                style={styles.clearButton}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={applyFilters}
                style={styles.applyButton}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
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
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
  },
  subtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1eb88c",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: "#374151",
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
