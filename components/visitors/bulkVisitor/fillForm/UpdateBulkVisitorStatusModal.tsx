// UpdateBulkVisitorStatusModal.native.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View
} from "react-native";
import { api_url } from "../.../../../../../utils/apiLocalhost"; // adjust path

type Props = {
  visitorId: string;
  isOpen: boolean;
  onClose: () => void;
  token?: string; // optional if you prefer passing it
  onStatusChange: () => void;
};

export default function UpdateBulkVisitorStatusModal({
  visitorId,
  isOpen,
  onClose,
  token: tokenProp,
  onStatusChange,
}: Props) {
  const [visitor, setVisitor] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (msg: string) => {
    if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
    else Alert.alert("", msg);
  };

  useEffect(() => {
    if (!visitorId || !isOpen) return;

    let cancelled = false;
    const fetchVisitor = async () => {
      setLoading(true);
      try {
        const token = tokenProp ?? (await AsyncStorage.getItem("token"));
        const res = await fetch(
          `${api_url}visitor/info/of/bulVisitor/${visitorId}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }
        );

        const data = await res.json().catch(() => null);
        if (!res.ok) {
          const msg = data?.message || "Failed to fetch visitor";
          throw new Error(msg);
        }

        if (!cancelled) setVisitor(data);
      } catch (err: any) {
        console.error("fetchVisitor error:", err);
        showToast(err?.message || "Failed to fetch visitor");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchVisitor();
    return () => {
      cancelled = true;
    };
  }, [visitorId, isOpen, tokenProp]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!visitorId) return;
    setIsSubmitting(true);
    try {
      const token = tokenProp ?? (await AsyncStorage.getItem("token"));
      const res = await fetch(`${api_url}visitor/update-status/${visitorId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Error updating status");

      showToast(`Visitor marked as ${newStatus}`);
      onStatusChange();
      onClose();
    } catch (err: any) {
      console.error("handleStatusUpdate error:", err);
      showToast(err?.message || "Error updating status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNotifyOccupant = async () => {
    if (!visitorId) return;
    setIsSubmitting(true);
    try {
      const token = tokenProp ?? (await AsyncStorage.getItem("token"));
      const res = await fetch(`${api_url}notify/occupant/${visitorId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json().catch(() => null);
      if (!res.ok)
        throw new Error(data?.message || "Failed to notify occupant");

      showToast("Occupant has been notified ✅");
      onStatusChange();
    } catch (err: any) {
      console.error("handleNotifyOccupant error:", err);
      showToast(err?.message || "Failed to notify occupant");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const status = visitor?.status;
  const clockTimeLabel =
    status === "Checked-Out" ? "Clock-out Time" : "Clock-in Time";

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Bulk Visitor Status</Text>

          {loading ? (
            <View style={styles.loaderWrap}>
                <ActivityIndicator size="large" color="#1eb88c" />
            </View>
          ) : !visitor ? (
            <View style={styles.noData}>
              <Text style={styles.noDataText}>No visitor data.</Text>
            </View>
          ) : (
            <View style={styles.content}>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Name:</Text>
                <Text style={styles.value}>{visitor.name || "-"}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Phone:</Text>
                <Text style={styles.value}>{visitor.phoneNumber || "-"}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Flat:</Text>
                <Text style={styles.value}>
                  {visitor.flatName || "-"} - {visitor.flatBlock || "-"}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Visitor Status:</Text>
                <Text style={[styles.value, { fontWeight: "700" }]}>
                  {visitor.status}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Occupant Accept Status:</Text>
                <Text style={[styles.value, { fontWeight: "700" }]}>
                  {visitor.occupantAcceptStatus || "-"}
                </Text>
              </View>

              {visitor.clockInTime ? (
                <View style={styles.clockWrap}>
                  <Text style={styles.label}>{clockTimeLabel}</Text>
                  <Text style={styles.value}>
                    {new Date(visitor.clockInTime).toLocaleString()}
                  </Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Footer actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelBtn]}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            {/* Awaiting & Accepted -> Check-In */}
            {visitor?.status === "Awaiting" &&
              visitor?.occupantAcceptStatus === "Accepted" && (
                <TouchableOpacity
                  style={[styles.button, styles.checkinBtn]}
                  onPress={() => handleStatusUpdate("Checked-In")}
                  disabled={isSubmitting}
                >
                  <Text style={styles.buttonText}>
                    {isSubmitting ? "Processing..." : "Mark as Checked-In"}
                  </Text>
                </TouchableOpacity>
              )}

            {/* Awaiting & not accepted -> Notify occupant */}
            {visitor?.status === "Awaiting" &&
              visitor?.occupantAcceptStatus !== "Accepted" && (
                <TouchableOpacity
                  style={[styles.button, styles.notifyBtn]}
                  onPress={handleNotifyOccupant}
                  disabled={isSubmitting}
                >
                  <Text style={styles.buttonText}>
                    {isSubmitting ? "Processing..." : "Notify Occupant"}
                  </Text>
                </TouchableOpacity>
              )}

            {/* Checked-In -> Check-Out */}
            {visitor?.status === "Checked-In" && (
              <TouchableOpacity
                style={[styles.button, styles.checkoutBtn]}
                onPress={() => handleStatusUpdate("Checked-Out")}
                disabled={isSubmitting}
              >
                <Text style={styles.buttonText}>
                  {isSubmitting ? "Processing..." : "Mark as Checked-Out"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  container: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    maxHeight: "90%",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  loaderWrap: { paddingVertical: 24, alignItems: "center" },
  content: { paddingBottom: 8 },
  infoRow: { flexDirection: "row", marginVertical: 6, alignItems: "center" },
  label: { width: 150, fontWeight: "600", color: "#374151" },
  value: { flex: 1, color: "#374151" },
  clockWrap: { marginTop: 8 },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 14,
    flexWrap: "wrap",
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    marginLeft: 8,
    marginTop: 8,
  },
  cancelBtn: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#9ca3af",
  },
  cancelText: { color: "#374151", fontWeight: "700" },
  checkinBtn: { backgroundColor: "#2563eb" },
  checkoutBtn: { backgroundColor: "#10b981" },
  notifyBtn: { backgroundColor: "#f59e0b" },
  buttonText: { color: "#fff", fontWeight: "700" },
  noData: { paddingVertical: 16, alignItems: "center" },
  noDataText: { color: "#6b7280" },
});
