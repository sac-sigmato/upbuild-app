// components/visitors/VisitorsList.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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
  fetchVisitors,
}: VisitorsListProps) {
  const [selectedVisitorId, setSelectedVisitorId] = useState<string | null>(
    null
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

  // Get token from AsyncStorage
  useEffect(() => {
    const getToken = async () => {
      const storedToken = await AsyncStorage.getItem("token");
      setToken(storedToken || "");
    };
    getToken();
  }, []);

  // Get permissions
  useEffect(() => {
    getMyPermissions()
      .then(({ permissions, roleSlug }) => {
        setPermissions(permissions);
        setRoleSlug(roleSlug);
      })
      .catch((err) => console.error("🔐 Error fetching permissions:", err));
  }, []);

  const canEditVisitorStatus =
    roleSlug === "security" || permissions.includes("can_edit_visitor_status");

  const canRespondToVisitorStatus = roleSlug === "occupants";

  // Safe pagination handlers
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  // Safe modal close handlers
  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedId("");
  };

  const handleCloseStatusModal = () => {
    setShowStatusModal(false);
    setSelectedVisitorId(null);
  };

  const handleCloseOccupantModal = () => {
    setShowOccupantModal(false);
    setOccupantModalVisitorId(null);
  };

  const handleStatusChange = () => {
    fetchVisitors?.();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1eb88c" />
        <Text>Loading visitors...</Text>
      </View>
    );
  }

  if (visitors.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text>No visitors found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Use your existing VisitorTable component */}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[
              styles.pageButton,
              currentPage === 1 && styles.disabledButton,
            ]}
            onPress={handlePrevPage}
            disabled={currentPage === 1}
          >
            <Text style={styles.buttonText}>Previous</Text>
          </TouchableOpacity>

          <Text style={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </Text>

          <TouchableOpacity
            style={[
              styles.pageButton,
              currentPage === totalPages && styles.disabledButton,
            ]}
            onPress={handleNextPage}
            disabled={currentPage === totalPages}
          >
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modals using your existing components */}
      <VisitorDetailsModal
        visitorId={selectedId}
        isOpen={showDetailsModal}
        onClose={handleCloseDetailsModal}
        token={token}
      />

      {selectedVisitorId && (
        <UpdateVisitorStatusModal
          visitorId={selectedVisitorId}
          isOpen={showStatusModal}
          onClose={handleCloseStatusModal}
          token={token}
          onStatusChange={handleStatusChange}
        />
      )}

      {occupantModalVisitorId && (
        <OccupantResponseModal
          visitorId={occupantModalVisitorId}
          isOpen={showOccupantModal}
          onClose={handleCloseOccupantModal}
          onStatusChange={handleStatusChange}
        />
      )}
    </View>
  );
}

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
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  // Pagination Styles
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
    minWidth: 80,
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
