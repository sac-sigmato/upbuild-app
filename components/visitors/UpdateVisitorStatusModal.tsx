// components/UpdateVisitorStatusModal.tsx
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
  View,
} from "react-native";
import { api_url } from "../../utils/apiLocalhost";

type Props = {
  visitorId: string;
  isOpen: boolean;
  onClose: () => void;
  token?: string;
  onStatusChange: () => void;
};

export default function UpdateVisitorStatusModal({
  visitorId,
  isOpen,
  onClose,
  token: propToken,
  onStatusChange,
}: Props) {
  const [visitor, setVisitor] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string>("");

  const nativeToast = (msg: string) => {
    if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
    else Alert.alert("", msg);
  };

  // Get token from props or AsyncStorage
  useEffect(() => {
    const getToken = async () => {
      if (propToken) {
        setToken(propToken);
        return;
      }
      try {
        const storedToken = await AsyncStorage.getItem("token");
        setToken(storedToken || "");
      } catch (error) {
        console.error("Error getting token:", error);
        setToken("");
      }
    };
    getToken();
  }, [propToken]);

  useEffect(() => {
    if (!isOpen || !visitorId || !token) return;
    let mounted = true;

    const fetchVisitor = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${api_url}get/visitor/by/id/${visitorId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || `Status ${res.status}`);
        }

        const data = await res.json();
        if (!mounted) return;
        setVisitor(data.visitor ?? null);
      } catch (err: any) {
        console.error("fetchVisitor error:", err);
        if (!mounted) return;
        setError(err?.message || "Failed to fetch visitor");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchVisitor();
    return () => {
      mounted = false;
    };
  }, [isOpen, visitorId, token]);

  const handleCheckin = async () => {
    if (!visitorId || !token) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `${api_url}visitor/check-in-if-accepted/${visitorId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ status: "Checked-In" }),
        }
      );

      const text = await res.text();
      let data = null;
      try {
        data = JSON.parse(text);
      } catch {
        /* ignore */
      }

      if (!res.ok) {
        const msg = data?.message || text || `Status ${res.status}`;
        throw new Error(msg);
      }

      nativeToast("Visitor marked as Checked-In");
      onStatusChange();
      onClose();
    } catch (err: any) {
      console.error("handleCheckin error:", err);
      nativeToast(err?.message || "Error updating status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckout = async () => {
    if (!visitorId || !token) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${api_url}update/visitor/status/${visitorId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: "Checked-Out" }),
      });

      const text = await res.text();
      let data = null;
      try {
        data = JSON.parse(text);
      } catch {
        /* ignore */
      }

      if (!res.ok) {
        const msg = data?.message || text || `Status ${res.status}`;
        throw new Error(msg);
      }

      nativeToast("Visitor marked as Checked-Out");
      onStatusChange();
      onClose();
    } catch (err: any) {
      console.error("handleCheckout error:", err);
      nativeToast(err?.message || "Error updating status");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const formattedDateTime = (iso?: string) => {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d
        .toLocaleString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
        .replace(",", "");
    } catch {
      return iso;
    }
  };

  const status = visitor?.status;
  const clockTimeLabel =
    status === "Checked-Out" ? "Clock-out Time" : "Clock-in Time";

  return (
    <Modal visible={isOpen} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Visitor Status</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#1eb88c" />
          ) : error ? (
            <View style={styles.center}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                onPress={() => {
                  setVisitor(null);
                  setError(null);
                }}
                style={[
                  styles.btn,
                  { marginTop: 12, backgroundColor: "#1eb88c" },
                ]}
              >
                <Text style={styles.btnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : visitor ? (
            <>
              <View style={styles.row}>
                <Text style={styles.labelBold}>Name:</Text>
                <Text style={styles.value}>{visitor.visitor?.name ?? "—"}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.labelBold}>Phone:</Text>
                <Text style={styles.value}>
                  {visitor.visitor?.phoneNumber ?? "—"}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.labelBold}>Flat:</Text>
                <Text style={styles.value}>
                  {visitor.flatId
                    ? `${visitor.flatId.flatName} - ${visitor.flatId.blockName}`
                    : "—"}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.labelBold}>Visitor Status:</Text>
                <Text style={styles.value}>{status ?? "—"}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.labelBold}>Occupant Response:</Text>
                <Text style={styles.value}>
                  {visitor.occupantAcceptStatus ?? "N/A"}
                </Text>
              </View>

              {visitor.clockInTime ? (
                <View style={styles.col}>
                  <Text style={styles.labelSmall}>{clockTimeLabel}</Text>
                  <Text style={styles.valueSmall}>
                    {formattedDateTime(visitor.clockInTime)}
                  </Text>
                </View>
              ) : null}

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={onClose}
                  style={[styles.btn, styles.btnOutline]}
                >
                  <Text style={styles.btnOutlineText}>Cancel</Text>
                </TouchableOpacity>

                {status === "Awaiting" &&
                  visitor.occupantAcceptStatus === "Accepted" && (
                    <TouchableOpacity
                      onPress={handleCheckin}
                      disabled={isSubmitting}
                      style={[
                        styles.btn,
                        styles.btnPrimary,
                        isSubmitting && styles.disabled,
                      ]}
                    >
                      <Text style={styles.btnText}>Mark as Checked-In</Text>
                    </TouchableOpacity>
                  )}

                {status === "Checked-In" && (
                  <TouchableOpacity
                    onPress={handleCheckout}
                    disabled={isSubmitting}
                    style={[
                      styles.btn,
                      styles.btnSuccess,
                      isSubmitting && styles.disabled,
                    ]}
                  >
                    <Text style={styles.btnText}>Mark as Checked-Out</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          ) : (
            <View style={styles.center}>
              <Text style={styles.errorText}>No visitor data</Text>
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
    backgroundColor: "rgba(3,7,18,0.35)",
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
  title: { fontSize: 18, fontWeight: "700", color: "#111", marginBottom: 12 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  col: { marginBottom: 12 },
  labelBold: { fontWeight: "700", color: "#374151" },
  value: { color: "#374151" },
  labelSmall: { fontWeight: "600", color: "#374151", marginBottom: 6 },
  valueSmall: { color: "#374151" },

  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 12,
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    marginLeft: 8,
  },
  btnPrimary: { backgroundColor: "#2563eb" },
  btnSuccess: { backgroundColor: "#1eb88c" },
  btnOutline: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#9ca3af",
  },
  btnText: { color: "#fff", fontWeight: "700" },
  btnOutlineText: { color: "#374151", fontWeight: "700" },
  disabled: { opacity: 0.6 },

  center: { alignItems: "center", justifyContent: "center", padding: 12 },
  errorText: { color: "#ef4444" },
});
