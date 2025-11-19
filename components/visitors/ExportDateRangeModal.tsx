"use client";
// components/ExportDateRangeModal.tsx
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onExport: (fromDate: string, toDate: string) => void;
};

const nativeToast = (msg: string) => {
  if (Platform.OS === "android") {
    const ToastAndroid = require("react-native").ToastAndroid;
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  } else {
    Alert.alert("", msg);
  }
};

export default function ExportDateRangeModal({
  isOpen,
  onClose,
  onExport,
}: Props) {
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const handleSubmit = () => {
    if (!fromDate || !toDate) {
      nativeToast("Please select both From and To dates.");
      return;
    }
    onExport(fromDate, toDate);
    onClose();
    // reset if you want
    setFromDate("");
    setToDate("");
  };

  const onFromChange = (_: any, selected?: Date) => {
    setShowFromPicker(false);
    if (selected) {
      const iso = selected.toISOString().split("T")[0];
      setFromDate(iso);
    }
  };

  const onToChange = (_: any, selected?: Date) => {
    setShowToPicker(false);
    if (selected) {
      const iso = selected.toISOString().split("T")[0];
      setToDate(iso);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Export Visitors by Date</Text>

          <View style={{ marginTop: 8 }}>
            <Text style={styles.label}>From Date</Text>
            <TouchableOpacity
              style={styles.inputLike}
              onPress={() => setShowFromPicker(true)}
            >
              <Text style={styles.inputText}>{fromDate || "Select date"}</Text>
            </TouchableOpacity>
            {showFromPicker && (
              <DateTimePicker
                value={fromDate ? new Date(fromDate) : new Date()}
                mode="date"
                display="default"
                onChange={onFromChange}
              />
            )}
          </View>

          <View style={{ marginTop: 12 }}>
            <Text style={styles.label}>To Date</Text>
            <TouchableOpacity
              style={styles.inputLike}
              onPress={() => setShowToPicker(true)}
            >
              <Text style={styles.inputText}>{toDate || "Select date"}</Text>
            </TouchableOpacity>
            {showToPicker && (
              <DateTimePicker
                value={toDate ? new Date(toDate) : new Date()}
                mode="date"
                display="default"
                onChange={onToChange}
              />
            )}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => {
                onClose();
                setFromDate("");
                setToDate("");
              }}
              style={[styles.btn, styles.btnOutline]}
            >
              <Text style={styles.btnOutlineText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              style={[styles.btn, styles.btnPrimary]}
            >
              <Text style={styles.btnPrimaryText}>Export</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  title: { fontSize: 18, fontWeight: "700", color: "#111", marginBottom: 8 },

  label: { fontSize: 13, color: "#6b7280", marginBottom: 6 },
  inputLike: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  inputText: { color: "#111" },

  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 16,
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  btnOutline: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#3b414e",
  },
  btnOutlineText: { color: "#3b414e", fontWeight: "700" },

  btnPrimary: { backgroundColor: "#1eb88c" },
  btnPrimaryText: { color: "#fff", fontWeight: "700" },
});
