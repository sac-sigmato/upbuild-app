// components/VisitorDetailsModal.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api_url, img_url } from "../../utils/apiLocalhost";

type VisitorProps = {
  visitorId: string;
  isOpen: boolean;
  onClose: () => void;
  token?: string;
};

type VisitorLog = {
  _id: string;
  visitorLogId?: string;
  visitor: {
    name?: string;
    phoneNumber?: string;
    address?: string;
    gender?: string;
    photo?: string;
  };
  purpose?: string;
  qrCode?: string;
  visitorType?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  vehiclePhoto?: string;
  status?: string;
  occupantAcceptStatus?: string;
  clockInTime?: string;
  clockOutTime?: string;
  scheduleFrom?: string;
  scheduleDate?: string;
  scheduleTo?: string;
  flatId?: {
    flatName?: string;
    blockName?: string;
    ownerStaying?: boolean;
    occupantName?: string;
    occupantPhoneNumber?: string;
  };
};

export default function VisitorDetailsModal({
  visitorId,
  isOpen,
  onClose,
  token: propToken,
}: VisitorProps) {
  const [visitor, setVisitor] = useState<VisitorLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string>("");

  // Get token from storage
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
          const text = await res.text().catch(() => "");
          throw new Error(text || `Status ${res.status}`);
        }

        const data = await res.json();
        if (!mounted) return;
        setVisitor(data.visitor ?? null);
      } catch (err: any) {
        console.error("Failed to fetch visitor:", err);
        if (!mounted) return;
        setError(err?.message || "Failed to load visitor");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchVisitor();
    return () => {
      mounted = false;
    };
  }, [isOpen, visitorId, token]);

  const formatDateTime = (iso?: string) => {
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

  const formatDate = (iso?: string) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  const toTime = (t?: string) => {
    if (!t) return "";
    try {
      const d = new Date(`1970-01-01T${t}`);
      return d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return t;
    }
  };

  const statusBadgeStyle = (status?: string) => {
    switch (status) {
      case "Awaiting":
        return { backgroundColor: "#FEF3C7" };
      case "Checked-In":
        return { backgroundColor: "#D1FAE5" };
      case "Checked-Out":
        return { backgroundColor: "#DBEAFE" };
      default:
        return { backgroundColor: "#FEE2E2" };
    }
  };

  const occupantBadgeStyle = (status?: string) => {
    switch (status) {
      case "Accepted":
        return { backgroundColor: "#D1FAE5" };
      case "Rejected":
        return { backgroundColor: "#FEE2E2" };
      case "N/A":
        return { backgroundColor: "#E5E7EB" };
      default:
        return { backgroundColor: "#FEF3C7" };
    }
  };

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Visitor Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          {/* CONTENT AREA (scrollable) */}
          <View style={styles.contentWrapper}>
            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color="#1eb88c" />
                <Text style={styles.loadingText}>
                  Loading visitor details...
                </Text>
              </View>
            ) : error ? (
              <View style={styles.center}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setVisitor(null);
                    setError(null);
                  }}
                  style={[styles.btn, styles.btnPrimary]}
                >
                  <Text style={styles.btnText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : visitor ? (
              <ScrollView
                contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
              >
                {/* BASIC INFO */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Basic Information</Text>

                  <View style={styles.fieldRow}>
                    <Text style={styles.label}>Log ID:</Text>
                    <Text style={styles.value}>
                      {visitor.visitorLogId ?? "—"}
                    </Text>
                  </View>

                  <View style={styles.fieldRow}>
                    <Text style={styles.label}>Name:</Text>
                    <Text style={styles.value}>
                      {visitor.visitor?.name ?? "—"}
                    </Text>
                  </View>

                  <View style={styles.fieldRow}>
                    <Text style={styles.label}>Phone:</Text>
                    <Text style={styles.value}>
                      {visitor.visitor?.phoneNumber ?? "—"}
                    </Text>
                  </View>

                  <View style={styles.fieldRow}>
                    <Text style={styles.label}>Address:</Text>
                    <Text style={styles.value}>
                      {visitor.visitor?.address ?? "—"}
                    </Text>
                  </View>

                  <View style={styles.fieldRow}>
                    <Text style={styles.label}>Gender:</Text>
                    <Text style={styles.value}>
                      {visitor.visitor?.gender ?? "—"}
                    </Text>
                  </View>
                </View>

                {/* VISIT INFO */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Visit Information</Text>

                  <View style={styles.fieldRow}>
                    <Text style={styles.label}>Purpose:</Text>
                    <Text style={styles.value}>{visitor.purpose ?? "—"}</Text>
                  </View>

                  <View style={styles.fieldRow}>
                    <Text style={styles.label}>Visitor Type:</Text>
                    <Text style={styles.value}>
                      {visitor.visitorType ?? "—"}
                    </Text>
                  </View>

                  <View style={styles.fieldRow}>
                    <Text style={styles.label}>Vehicle Type:</Text>
                    <Text style={styles.value}>
                      {visitor.vehicleType ?? "—"}
                    </Text>
                  </View>

                  <View style={styles.fieldRow}>
                    <Text style={styles.label}>Vehicle No:</Text>
                    <Text style={styles.value}>
                      {visitor.vehicleNumber ?? "—"}
                    </Text>
                  </View>
                </View>

                {/* FLAT INFO */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Flat Information</Text>

                  <View style={styles.fieldRow}>
                    <Text style={styles.label}>Flat:</Text>
                    <Text style={styles.value}>
                      {visitor.flatId
                        ? `${visitor.flatId.flatName} - ${visitor.flatId.blockName}`
                        : "—"}
                    </Text>
                  </View>

                  <View style={styles.fieldRow}>
                    <Text style={styles.label}>Occupant Name:</Text>
                    <Text style={styles.value}>
                      {visitor.flatId?.occupantName ?? "—"}
                    </Text>
                  </View>

                  <View style={styles.fieldRow}>
                    <Text style={styles.label}>Occupant Phone:</Text>
                    <Text style={styles.value}>
                      {visitor.flatId?.occupantPhoneNumber ?? "—"}
                    </Text>
                  </View>
                </View>

                {/* PHOTOS */}
                {(visitor.visitor?.photo || visitor.vehiclePhoto) && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Photos</Text>

                    <View style={styles.photosContainer}>
                      {visitor.visitor?.photo && (
                        <View style={styles.photoContainer}>
                          <Text style={styles.photoLabel}>Visitor Photo</Text>
                          <Image
                            source={{
                              uri: visitor.visitor.photo.startsWith("http")
                                ? visitor.visitor.photo
                                : `${img_url}${visitor.visitor.photo}`,
                            }}
                            style={styles.photo}
                          />
                        </View>
                      )}

                      {visitor.vehiclePhoto && (
                        <View style={styles.photoContainer}>
                          <Text style={styles.photoLabel}>Vehicle Photo</Text>
                          <Image
                            source={{
                              uri: visitor.vehiclePhoto.startsWith("http")
                                ? visitor.vehiclePhoto
                                : `${img_url}${visitor.vehiclePhoto}`,
                            }}
                            style={styles.photo}
                          />
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* STATUS & TIMING */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Status & Timing</Text>

                  <View style={styles.timingContainer}>
                    {visitor.status === "Checked-In" && visitor.clockInTime && (
                      <View style={styles.timeField}>
                        <Text style={styles.label}>Clock-in Time:</Text>
                        <Text style={styles.value}>
                          {formatDateTime(visitor.clockInTime)}
                        </Text>
                      </View>
                    )}

                    {visitor.status === "Checked-Out" &&
                      visitor.clockOutTime && (
                        <View style={styles.timeField}>
                          <Text style={styles.label}>Clock-out Time:</Text>
                          <Text style={styles.value}>
                            {formatDateTime(visitor.clockOutTime)}
                          </Text>
                        </View>
                      )}
                  </View>

                  <View style={styles.statusContainer}>
                    <View style={styles.statusItem}>
                      <Text style={styles.label}>Status:</Text>
                      <View
                        style={[styles.badge, statusBadgeStyle(visitor.status)]}
                      >
                        <Text style={styles.badgeText}>
                          {visitor.status ?? "—"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.statusItem}>
                      <Text style={styles.label}>Occupant Response:</Text>
                      <View
                        style={[
                          styles.badge,
                          occupantBadgeStyle(visitor.occupantAcceptStatus),
                        ]}
                      >
                        <Text style={styles.badgeText}>
                          {visitor.occupantAcceptStatus ?? "Pending"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {visitor.status === "Awaiting" && visitor.scheduleDate && (
                    <View style={styles.scheduleContainer}>
                      <Text style={styles.label}>Expected Schedule:</Text>
                      <Text style={styles.value}>
                        {formatDate(visitor.scheduleDate)}
                      </Text>
                      <Text style={styles.scheduleTime}>
                        {visitor.scheduleFrom
                          ? `From: ${toTime(visitor.scheduleFrom)}`
                          : ""}
                        {visitor.scheduleTo
                          ? `  |  To: ${toTime(visitor.scheduleTo)}`
                          : ""}
                      </Text>
                    </View>
                  )}
                </View>

                {/* QR CODE */}
                {visitor.qrCode && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>QR Code</Text>
                    <View style={styles.qrContainer}>
                      <TouchableOpacity
                        onPress={() => {
                          const url = visitor.qrCode!;
                          if (url.startsWith("http")) {
                            Linking.openURL(url).catch(() =>
                              Alert.alert("Cannot open URL")
                            );
                          }
                        }}
                        activeOpacity={0.8}
                      >
                        <Image
                          source={{ uri: visitor.qrCode }}
                          style={styles.qrImage}
                        />
                      </TouchableOpacity>
                      <Text style={styles.qrLabel}>Tap to open QR</Text>
                    </View>
                  </View>
                )}
              </ScrollView>
            ) : (
              <View style={styles.center}>
                <Text style={styles.errorText}>No visitor data found.</Text>
              </View>
            )}
          </View>

          {/* FOOTER */}
          {/* <View style={styles.footer}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.btn, styles.btnOutline]}
            >
              <Text style={styles.btnOutlineText}>Close</Text>
            </TouchableOpacity>
          </View> */}
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
    height: "90%", // 🔥 FIXED HEIGHT
    maxHeight: "90%",
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#f8fafc",
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
  },

  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },

  closeButtonText: {
    fontSize: 20,
    fontWeight: "bold",
  },

  // 🔥 FIXED SCROLL AREA
  contentWrapper: {
    flex: 1,
    backgroundColor: "#fff",
  },

  section: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },

  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  label: { flex: 1, color: "#6b7280" },
  value: { flex: 2, textAlign: "right", color: "#374151" },

  photosContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  photoContainer: {
    width: "48%",
    alignItems: "center",
    marginBottom: 16,
  },

  photo: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },

  timingContainer: { marginBottom: 16 },

  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  statusItem: { flex: 1 },

  badge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 4,
  },

  badgeText: { fontSize: 12, fontWeight: "600" },

  scheduleContainer: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#1eb88c",
  },

  qrContainer: { alignItems: "center" },
  qrImage: { width: 160, height: 160, borderRadius: 8 },

  center: { padding: 40, alignItems: "center" },

  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#f8fafc",
  },

  btn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  btnOutline: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },

  btnOutlineText: {
    fontWeight: "600",
    color: "#374151",
  },

  btnPrimary: { backgroundColor: "#1eb88c" },
  btnText: { color: "#fff", fontWeight: "600" },
});
