import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControlProps,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { getMyPermissions } from "../../utils/getMyPermissions";
import OccupantResponseModal from "./OccupantResponseModal";
import UpdateVisitorStatusModal from "./UpdateVisitorStatusModal";
import VisitorDetailsModal from "./VisitorDetailsModal";
import VisitorTable from "./VisitorTable";

interface VisitorsListProps {
  visitors: any[];
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
  visitors,
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

  /* ---------- PAGINATION ---------- */
  const handleNextPage = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleStatusChange = () => {
    fetchVisitors?.();
  };

  /* ---------- LOADING ---------- */
  if (loading && currentPage === 1) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1eb88c" />
        <Text>Loading visitors...</Text>
      </View>
    );
  }

  /* ---------- EMPTY ---------- */
  if (!loading && visitors.length === 0) {
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
    <ScrollView
      style={styles.container}
      refreshControl={refreshControl} // ✅ PULL TO REFRESH
    >
      <VisitorTable
        visitors={visitors}
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
      {totalPages > 1 && (
        <View style={styles.pagination}>
          <Pressable
            style={[
              styles.pageButton,
              currentPage === 1 && styles.disabledButton,
            ]}
            onPress={handlePrevPage}
            disabled={currentPage === 1}
          >
            <Text style={styles.buttonText}>Previous</Text>
          </Pressable>

          <Text style={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </Text>

          <Pressable
            style={[
              styles.pageButton,
              currentPage === totalPages && styles.disabledButton,
            ]}
            onPress={handleNextPage}
            disabled={currentPage === totalPages}
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
