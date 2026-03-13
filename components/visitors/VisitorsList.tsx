import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControlProps,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getMyPermissions } from "../../utils/getMyPermissions";
import OccupantResponseModal from "./OccupantResponseModal";
import UpdateVisitorStatusModal from "./UpdateVisitorStatusModal";
import VisitorDetailsModal from "./VisitorDetailsModal";
import VisitorTable from "./VisitorTable";

interface VisitorsListProps {
  visitors?: any[]; // make optional, default to []
  loading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;

  selectedVisitorIds: string[];
  setSelectedVisitorIds: (ids: string[]) => void;

  /** ✅ NEW (from parent) */
  canExportVisitors?: boolean;
  canRespondToVisitorStatus?: boolean;

  /** ✅ Pull to refresh */
  refreshControl?: React.ReactElement<RefreshControlProps>;

  fetchVisitors?: () => void;
}

export default function VisitorsList({
  visitors = [], // ← default to empty array
  loading,
  currentPage,
  totalPages,
  onPageChange,
  selectedVisitorIds,
  setSelectedVisitorIds,
  canExportVisitors = false,
  canRespondToVisitorStatus: canRespondProp,
  refreshControl,
  fetchVisitors,
}: VisitorsListProps) {
  const [selectedVisitorId, setSelectedVisitorId] = useState<string | null>(
    null,
  );
  const [selectedId, setSelectedId] = useState<string>("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showOccupantModal, setShowOccupantModal] = useState(false);
  const [occupantModalVisitorId, setOccupantModalVisitorId] = useState<
    string | null
  >(null);

  const [token, setToken] = useState<string>("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roleSlug, setRoleSlug] = useState<string>("");

  /* ---------- TOKEN ---------- */
  useEffect(() => {
    AsyncStorage.getItem("token").then((t) => setToken(t || ""));
  }, []);

  /* ---------- PERMISSIONS ---------- */
  useEffect(() => {
    getMyPermissions()
      .then(({ permissions, roleSlug }) => {
        setPermissions(permissions);
        setRoleSlug(roleSlug);
      })
      .catch(() => {});
  }, []);

  const canEditVisitorStatus =
    roleSlug === "security" || permissions.includes("can_edit_visitor_status");

  const canRespondToVisitorStatus =
    typeof canRespondProp === "boolean"
      ? canRespondProp
      : roleSlug === "occupants";

  /* ---------- SAFE VALUES ---------- */
  const safeVisitors = Array.isArray(visitors) ? visitors : [];
  const safeCurrentPage = Number(currentPage) || 1;
  const safeTotalPages = Number(totalPages) || 1;

  /* ---------- PAGINATION ---------- */
  const handleNextPage = () => {
    if (
      typeof onPageChange === "function" &&
      safeCurrentPage < safeTotalPages
    ) {
      onPageChange(safeCurrentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (typeof onPageChange === "function" && safeCurrentPage > 1) {
      onPageChange(safeCurrentPage - 1);
    }
  };

  const handleStatusChange = () => {
    fetchVisitors?.();
  };

  /* ---------- LOADING / EMPTY STATES ---------- */
  // Show loader only when we have no data at all
  if (loading && safeVisitors.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1eb88c" />
        <Text>Loading visitors...</Text>
      </View>
    );
  }

  if (!loading && safeVisitors.length === 0) {
    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.emptyContainer}
        refreshControl={refreshControl}
      >
        <Text>No visitors found</Text>
      </ScrollView>
    );
  }

  /* ---------- MAIN ---------- */
  return (
    // If VisitorTable internally uses a FlatList, consider removing the outer ScrollView
    // to avoid nested scrollables. For now we keep it for pull‑to‑refresh support.
    <ScrollView style={styles.container} refreshControl={refreshControl}>
      <VisitorTable
        visitors={safeVisitors}
        loading={loading}
        selectedVisitorIds={selectedVisitorIds}
        setSelectedVisitorIds={setSelectedVisitorIds}
        setSelectedId={setSelectedId}
        setShowModal={setShowDetailsModal}
        canRespondToVisitorStatus={canRespondToVisitorStatus}
        setOccupantModalVisitorId={setOccupantModalVisitorId}
        setShowOccupantModal={setShowOccupantModal}
        canEditVisitorStatus={canEditVisitorStatus}
        setSelectedVisitorId={setSelectedVisitorId}
        setShowStatusModal={setShowStatusModal}
      />

      {/* ---------- PAGINATION ---------- */}
      {safeTotalPages > 1 && (
        <View style={styles.pagination}>
          <Pressable
            style={[
              styles.pageButton,
              safeCurrentPage === 1 && styles.disabledButton,
            ]}
            onPress={handlePrevPage}
            disabled={safeCurrentPage === 1}
          >
            <Text style={styles.buttonText}>Previous</Text>
          </Pressable>

          <Text style={styles.pageInfo}>
            Page {safeCurrentPage} of {safeTotalPages}
          </Text>

          <Pressable
            style={[
              styles.pageButton,
              safeCurrentPage === safeTotalPages && styles.disabledButton,
            ]}
            onPress={handleNextPage}
            disabled={safeCurrentPage === safeTotalPages}
          >
            <Text style={styles.buttonText}>Next</Text>
          </Pressable>
        </View>
      )}

      {/* ---------- MODALS ---------- */}
      <VisitorDetailsModal
        visitorId={selectedId}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedId("");
        }}
        token={token}
      />

      {selectedVisitorId && (
        <UpdateVisitorStatusModal
          visitorId={selectedVisitorId}
          isOpen={showStatusModal}
          onClose={() => {
            setShowStatusModal(false);
            setSelectedVisitorId(null);
          }}
          token={token}
          onStatusChange={handleStatusChange}
        />
      )}

      {occupantModalVisitorId && (
        <OccupantResponseModal
          visitorId={occupantModalVisitorId}
          isOpen={showOccupantModal}
          onClose={() => {
            setShowOccupantModal(false);
            setOccupantModalVisitorId(null);
          }}
          onStatusChange={handleStatusChange}
        />
      )}
    </ScrollView>
  );
}

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  pageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#1eb88c",
    borderRadius: 8,
    minWidth: 90,
  },
  disabledButton: {
    backgroundColor: "#cbd5e1",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
  },
  pageInfo: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
  },
});
