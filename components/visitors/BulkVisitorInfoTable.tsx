// components/BulkVisitorInfoTable.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { api_url } from "../../utils/apiLocalhost"; // adjust path
import OccupantBulkResponseModal from "./bulkVisitor/fillForm/OccupantBulkResponseModal"; // implement RN modal
// import { usePermissions } from "./roleAndPermissionsCheck/permissionContext"; // if you have RN version
import UpdateBulkVisitorStatusModal from "./bulkVisitor/fillForm/UpdateBulkVisitorStatusModal"; // implement RN modal

type Props = {
  visitors: any[];
  canEditVisitorStatus: boolean;
  formatDateTime: (date?: string) => string;
  refreshVisitors: () => void;
  roleSlug: string;
};

export default function BulkVisitorInfoTable({
  visitors,
  canEditVisitorStatus,
  formatDateTime,
  refreshVisitors,
  roleSlug,
}: Props) {
  const [selectedVisitorId, setSelectedVisitorId] = useState<string | null>(
    null,
  );
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [occupantModalVisitorId, setOccupantModalVisitorId] = useState<
    string | null
  >(null);
  const [showOccupantModal, setShowOccupantModal] = useState(false);
  const [loadingApprove, setLoadingApprove] = useState<string | null>(null);

  const handleApproveVisitor = async (visitorId: string) => {
    Alert.alert(
      "Confirm",
      "Approve this visitor form?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          style: "default",
          onPress: async () => {
            setLoadingApprove(visitorId);
            try {
              const token = await AsyncStorage.getItem("token");
              const res = await fetch(
                `${api_url}approve/people/form/${visitorId}`,
                {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  },
                },
              );

              // try parse json safely
              const text = await res.text();
              let data: any = null;
              try {
                data = JSON.parse(text);
              } catch {
                data = text;
              }

              if (!res.ok) {
                const message =
                  typeof data === "object"
                    ? data?.message || JSON.stringify(data)
                    : String(data || `Status ${res.status}`);
                throw new Error(message);
              }

              Alert.alert(
                "Success",
                (data && data.message) || "Visitor approved",
              );
              refreshVisitors();
            } catch (err: any) {
              console.error("approve error", err);
              Alert.alert("Error", err?.message || "Failed to approve visitor");
            } finally {
              setLoadingApprove(null);
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  if (!visitors || visitors.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No visitors added yet.</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: any }) => {
    return (
      <View style={styles.mobileCard}>
        <View style={styles.cardRow}>
          {/* LEFT : INFO */}
          <View style={styles.leftInfo}>
            <Text style={styles.formId}>{item.visitorInfoId}</Text>

            <Text style={styles.name}>{item.name || "-"}</Text>
            <Text style={styles.phone}>📞 {item.phoneNumber || "-"}</Text>

            <View style={styles.statusRow}>
              <View style={[styles.badge, badgeColorStyle(item.status)]}>
                <Text style={styles.badgeText}>
                  Status: {item.status || "-"}
                </Text>
              </View>

              <View
                style={[
                  styles.badge,
                  badgeColorStyle(item.occupantAcceptStatus, true),
                ]}
              >
                <Text style={styles.badgeText}>
                  Occupant: {item.occupantAcceptStatus || "Pending"}
                </Text>
              </View>
              {/* APPROVE BUTTON (occupant only, same as WEB) */}
              {roleSlug === "occupants" &&
                item.occupantAcceptStatus === "Pending" && (
                  <Text
                    onPress={() => handleApproveVisitor(item._id)}
                    style={[
                      styles.approveBtn,
                      loadingApprove === item._id && { opacity: 0.6 },
                    ]}
                  >
                    {loadingApprove === item._id ? "Approving..." : "Approve"}
                  </Text>
                )}
            </View>
          </View>

          {/* RIGHT : QR */}
          <View style={styles.qrContainer}>
            {item.qrCode ? (
              <Image source={{ uri: item.qrCode }} style={styles.qr} />
            ) : (
              <Text style={styles.noQr}>No QR</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <>
      <FlatList
        data={visitors}
        keyExtractor={(v) => v._id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {/* Update Status Modal - placeholder, implement RN version */}
      <Modal
        visible={!!selectedVisitorId && showStatusModal}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Replace below with your RN UpdateBulkVisitorStatusModal component */}
            <UpdateBulkVisitorStatusModal
              visitorId={selectedVisitorId || ""}
              isOpen={showStatusModal}
              onClose={() => {
                setShowStatusModal(false);
                setSelectedVisitorId(null);
              }}
              token={AsyncStorage.getItem("token") as any}
              onStatusChange={() => {
                setShowStatusModal(false);
                setSelectedVisitorId(null);
                refreshVisitors();
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Occupant Response Modal */}
      <Modal visible={showOccupantModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <OccupantBulkResponseModal
              visitorId={occupantModalVisitorId || ""}
              isOpen={showOccupantModal}
              onClose={() => {
                setShowOccupantModal(false);
                setOccupantModalVisitorId(null);
              }}
              onStatusChange={() => {
                setShowOccupantModal(false);
                setOccupantModalVisitorId(null);
                refreshVisitors();
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

// helper: badge styles based on status
function badgeColorStyle(status: string | undefined, isOccupant = false) {
  if (isOccupant) {
    if (status === "Pending") return { backgroundColor: "#FEF3C7" }; // yellow
    if (status === "Accepted") return { backgroundColor: "#ECFDF5" }; // green
    if (status === "Rejected") return { backgroundColor: "#FEE2E2" }; // red
    return { backgroundColor: "#F3F4F6" };
  } else {
    if (status === "Awaiting") return { backgroundColor: "#FEF3C7" };
    if (status === "Checked-In") return { backgroundColor: "#ECFDF5" };
    if (status === "Checked-Out") return { backgroundColor: "#EFF6FF" };
    return { backgroundColor: "#FEE2E2" };
  }
}

const styles = StyleSheet.create({
  center: { padding: 24, alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#6b7280" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  row: { flexDirection: "row", alignItems: "flex-start" },
  leftCol: { flex: 1 },
  rightCol: { width: 140, alignItems: "flex-end" },

  formId: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "700",
    marginBottom: 8,
  },

  photoRow: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e6e9ee",
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  avatarPlaceholderText: { color: "#9ca3af" },

  name: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  subText: { color: "#6b7280", marginTop: 2 },
  meta: { color: "#374151", marginTop: 6 },

  vehiclePhoto: { width: 56, height: 56, borderRadius: 6, marginTop: 6 },

  badgeRow: { flexDirection: "row", marginTop: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },

  approveBtn: {
    marginTop: 8,
    backgroundColor: "#1eb88c",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  approveText: { color: "#fff", fontWeight: "700" },

  bottomRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  overflowMenu: { fontSize: 22, color: "#6b7280" },

  grey: { color: "#9ca3af" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: "94%",
    maxWidth: 720,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 8,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  leftInfo: {
    flex: 1,
    paddingRight: 10,
  },

  qrContainer: {
    width: 90,
    alignItems: "center",
    justifyContent: "center",
  },

  qr: {
    width: 80,
    height: 80,
    borderRadius: 0,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
  },
  mobileCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  phone: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 10,
  },

  statusRow: {
    flexDirection: "column",
    gap: 8,
    marginBottom: 12,
  },

  noQr: {
    textAlign: "center",
    color: "#9ca3af",
    marginTop: 12,
  },
});
