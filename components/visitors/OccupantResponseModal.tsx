// components/OccupantResponseModal.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
        ActivityIndicator,
        Alert,
        Image,
        Modal,
        Platform,
        StyleSheet,
        Text,
        TouchableOpacity,
        View,
} from "react-native";
import { api_url, img_url } from "../../utils/apiLocalhost"; // adjust path if needed

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onExport?: (fromDate: string, toDate: string) => void; // not used here, kept for compatibility
  onStatusChange?: () => void;
  visitorId?: string | null;
  // original props used visitorId and onStatusChange — keep compatibility
};

type OccupantResponseModalProps = {
  visitorId: string;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: () => void;
};

const nativeToast = (msg: string) => {
  if (Platform.OS === "android") {
    const ToastAndroid = require("react-native").ToastAndroid;
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  } else {
    Alert.alert("", msg);
  }
};

export default function OccupantResponseModal({
  visitorId,
  isOpen,
  onClose,
  onStatusChange,
}: OccupantResponseModalProps) {
  const [visitor, setVisitor] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!visitorId || !isOpen) return;
    let mounted = true;

    const fetchVisitor = async () => {
      setIsLoading(true);
      try {
        const token = await AsyncStorage.getItem("token");
        const res = await fetch(`${api_url}get/visitor/by/id/${visitorId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
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

        if (!mounted) return;
        setVisitor(data.visitor ?? null);
      } catch (err: any) {
        console.error("fetchVisitor error:", err);
        nativeToast(err?.message || "Failed to fetch visitor");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchVisitor();
    return () => {
      mounted = false;
      setVisitor(null);
      setIsLoading(false);
    };
  }, [visitorId, isOpen]);

  const handleResponse = async (response: "Accepted" | "Rejected") => {
    if (!visitorId || !response) return;
    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(
        `${api_url}visitor/occupant/response/${visitorId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ response }),
        }
      );

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || `Status ${res.status}`);
      }

      nativeToast("Response recorded successfully");
      onStatusChange();
      onClose();
    } catch (err: any) {
      console.error("handleResponse error:", err);
      nativeToast(err?.message || "Error updating status");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentResponse = visitor?.occupantAcceptStatus || "Pending";
  const isAlreadyResponded = currentResponse !== "Pending";

  return (
    <Modal visible={isOpen} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Visitor Approval Request</Text>

          {isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#1eb88c" />
            </View>
          ) : !visitor ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>Visitor not found</Text>
            </View>
          ) : (
            <>
              <View style={styles.grid}>
                {visitor.visitor?.photo ? (
                  <View style={styles.photoWrap}>
                    <Image
                      source={{
                        uri: visitor.visitor.photo.startsWith("http")
                          ? visitor.visitor.photo
                          : `${img_url}${visitor.visitor.photo}`,
                      }}
                      style={styles.avatar}
                    />
                  </View>
                ) : null}

                <View style={styles.info}>
                  <Text style={styles.label}>Name</Text>
                  <Text style={styles.value}>{visitor.visitor?.name}</Text>
                </View>

                <View style={styles.info}>
                  <Text style={styles.label}>Gender</Text>
                  <Text style={styles.value}>{visitor.visitor?.gender}</Text>
                </View>

                <View style={styles.info}>
                  <Text style={styles.label}>Phone</Text>
                  <Text style={styles.value}>
                    {visitor.visitor?.phoneNumber}
                  </Text>
                </View>

                <View style={styles.info}>
                  <Text style={styles.label}>Type</Text>
                  <Text style={styles.value}>{visitor.visitorType}</Text>
                </View>

                <View style={styles.info}>
                  <Text style={styles.label}>Flat</Text>
                  <Text style={styles.value}>
                    {visitor.flatId
                      ? `${visitor.flatId.flatName} - ${visitor.flatId.blockName}`
                      : "—"}
                  </Text>
                </View>

                <View style={styles.fullCol}>
                  <Text style={styles.label}>Occupant Response</Text>
                  <View
                    style={[
                      styles.responseBadge,
                      currentResponse === "Accepted"
                        ? styles.badgeAccepted
                        : currentResponse === "Rejected"
                        ? styles.badgeRejected
                        : styles.badgePending,
                    ]}
                  >
                    <Text style={styles.responseText}>{currentResponse}</Text>
                  </View>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={onClose}
                  style={[styles.btn, styles.btnCancel]}
                >
                  <Text style={styles.btnCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleResponse("Rejected")}
                  disabled={isAlreadyResponded || isSubmitting}
                  style={[
                    styles.btn,
                    styles.btnReject,
                    (isAlreadyResponded || isSubmitting) && styles.btnDisabled,
                  ]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>Reject</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleResponse("Accepted")}
                  disabled={isAlreadyResponded || isSubmitting}
                  style={[
                    styles.btn,
                    styles.btnAccept,
                    (isAlreadyResponded || isSubmitting) && styles.btnDisabled,
                  ]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnText}>Accept</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
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
    maxWidth: 520,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 12, color: "#111" },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  emptyText: { color: "#6b7280" },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12 as any,
    alignItems: "center",
  },
  photoWrap: {
    width: 64,
    height: 64,
    borderRadius: 999,
    overflow: "hidden",
    marginRight: 8,
  },
  avatar: { width: 64, height: 64, borderRadius: 999 },
  info: { width: "45%", marginBottom: 8 },
  label: { fontSize: 12, color: "#6b7280" },
  value: { fontSize: 14, color: "#111", fontWeight: "600" },

  fullCol: { width: "100%", marginTop: 6 },
  responseBadge: {
    marginTop: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  badgeAccepted: { backgroundColor: "#D1FAE5" },
  badgeRejected: { backgroundColor: "#FEE2E2" },
  badgePending: { backgroundColor: "#FEF3C7" },
  responseText: { fontWeight: "700", color: "#065f46" },

  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    gap: 8 as any,
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 90,
    marginLeft: 8,
  },
  btnCancel: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  btnCancelText: { color: "#374151", fontWeight: "700" },
  btnReject: { backgroundColor: "#ef4444" },
  btnAccept: { backgroundColor: "#059669" },
  btnText: { color: "#fff", fontWeight: "700" },
  btnDisabled: { opacity: 0.6 },
});
