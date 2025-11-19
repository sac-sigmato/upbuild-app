// components/OccupantBulkResponseModal.native.tsx
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View
} from "react-native";
import { api_url, img_url } from "../.../../../../../utils/apiLocalhost"; // adjust path
// import Loader from "../../../../../loader/loader"; // adjust path if required
import AsyncStorage from "@react-native-async-storage/async-storage";

type Props = {
  visitorId: string;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: () => void;
};

export default function OccupantBulkResponseModal({
  visitorId,
  isOpen,
  onClose,
  onStatusChange,
}: Props) {
  const [visitor, setVisitor] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (message: string) => {
    if (Platform.OS === "android")
      ToastAndroid.show(message, ToastAndroid.SHORT);
    else Alert.alert(message);
  };

  useEffect(() => {
    if (!isOpen || !visitorId) return;

    let cancelled = false;
    const fetchVisitor = async () => {
      setIsLoading(true);
      try {
        const token = await AsyncStorage.getItem("token");
        const res = await fetch(
          `${api_url}visitor/info/of/bulVisitor/${visitorId}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }
        );

        if (!res.ok) {
          throw new Error("Failed to fetch visitor");
        }

        const data = await res.json();
        if (!cancelled) setVisitor(data);
      } catch (err) {
        console.error("fetchVisitor error", err);
        showToast("Failed to fetch visitor");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchVisitor();

    return () => {
      cancelled = true;
    };
  }, [isOpen, visitorId]);

  const handleResponse = async (response: "Accepted" | "Rejected") => {
    if (!visitorId) return;
    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${api_url}accept/people/form/${visitorId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ response }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || "Error updating status");
      }

      showToast("Response recorded successfully");
      onStatusChange();
      onClose();
    } catch (err: any) {
      console.error("handleResponse error", err);
      showToast(err?.message || "Error updating status");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentResponse = visitor?.occupantAcceptStatus || "Pending";
  const isAlreadyResponded = currentResponse !== "Pending";

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Bulk Visitor Approval Request</Text>

          {isLoading ? (
            <View style={styles.loaderWrap}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
          ) : visitor ? (
            <View style={styles.content}>
              {/* Photo */}
              {visitor.photo ? (
                <View style={styles.photoWrap}>
                  <Image
                    source={{ uri: `${img_url}${visitor.photo}` }}
                    style={styles.photo}
                    resizeMode="cover"
                  />
                </View>
              ) : null}

              {/* Details */}
              <View style={styles.info}>
                <View style={styles.row}>
                  <Text style={styles.label}>Name:</Text>
                  <Text style={styles.value}>{visitor.name || "-"}</Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>Phone:</Text>
                  <Text style={styles.value}>{visitor.phoneNumber || "-"}</Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>Flat:</Text>
                  <Text style={styles.value}>
                    {visitor.flatName || "-"} - {visitor.flatBlock || "-"}
                  </Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>Occupant Response:</Text>
                  <View
                    style={[
                      styles.statusPill,
                      currentResponse === "Accepted"
                        ? styles.accept
                        : currentResponse === "Rejected"
                        ? styles.reject
                        : styles.pending,
                    ]}
                  >
                    <Text style={styles.statusText}>{currentResponse}</Text>
                  </View>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.btn, styles.cancelBtn]}
                  onPress={onClose}
                  disabled={isSubmitting}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>

                {!isAlreadyResponded && (
                  <>
                    <TouchableOpacity
                      style={[styles.btn, styles.rejectBtn]}
                      onPress={() => handleResponse("Rejected")}
                      disabled={isSubmitting}
                    >
                      <Text style={styles.btnText}>
                        {isSubmitting ? "Processing..." : "Reject"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.btn, styles.acceptBtn]}
                      onPress={() => handleResponse("Accepted")}
                      disabled={isSubmitting}
                    >
                      <Text style={styles.btnText}>
                        {isSubmitting ? "Processing..." : "Accept"}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.noData}>
              <Text style={styles.noDataText}>Visitor not found</Text>
            </View>
          )}
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
  card: {
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
    textAlign: "left",
  },
  loaderWrap: { paddingVertical: 24, alignItems: "center" },
  content: { paddingBottom: 8 },
  photoWrap: { alignItems: "flex-start", marginBottom: 12 },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  info: { marginTop: 6 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
    flexWrap: "wrap",
  },
  label: { fontWeight: "600", color: "#374151", width: 140 },
  value: { color: "#374151", flex: 1 },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  statusText: { fontWeight: "700" },
  accept: { backgroundColor: "#d1fae5" },
  reject: { backgroundColor: "#fee2e2" },
  pending: { backgroundColor: "#fef3c7" },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 14,
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    marginLeft: 8,
  },
  cancelBtn: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#9ca3af",
  },
  cancelText: { color: "#374151", fontWeight: "700" },
  rejectBtn: { backgroundColor: "#ef4444" },
  acceptBtn: { backgroundColor: "#10b981" },
  btnText: { color: "#fff", fontWeight: "700" },
  noData: { paddingVertical: 16, alignItems: "center" },
  noDataText: { color: "#6b7280" },
});
