import Checkbox from "expo-checkbox";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function VisitorTableMobile({
  visitors,
  loading,
  selectedVisitorIds,
  setSelectedVisitorIds,
  setSelectedId,
  setShowModal,
  setSelectedVisitorId,
  setShowStatusModal,
  canRespondToVisitorStatus,
  setOccupantModalVisitorId,
  setShowOccupantModal,
  canEditVisitorStatus,
}: {
  visitors: any[];
  loading: boolean; // ✅ ADD
  selectedVisitorIds: string[];
  setSelectedVisitorIds: (ids: string[]) => void;
  setSelectedId: (id: string) => void;
  setShowModal: (visible: boolean) => void;
  setSelectedVisitorId: (id: string) => void;
  setShowStatusModal: (visible: boolean) => void;
  canRespondToVisitorStatus: boolean;
  setOccupantModalVisitorId: (id: string) => void;
  setShowOccupantModal: (visible: boolean) => void;
  canEditVisitorStatus: boolean;
}) {
  const toggleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedVisitorIds([...selectedVisitorIds, id]);
    } else {
      setSelectedVisitorIds(selectedVisitorIds.filter((x) => x !== id));
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedVisitorIds(visitors.map((v) => v._id));
    } else {
      setSelectedVisitorIds([]);
    }
  };

  const getStatusStyle = (status?: string) => {
    if (!status) return styles.Pending;
    return STATUS_STYLE_MAP[status] || styles.Pending;
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Helper function to format time
  const formatTime = (timeString: string) => {
    if (!timeString) return "";
    const time = new Date(`1970-01-01T${timeString}`);
    return time.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1eb88c" />
        <Text style={styles.loadingText}>Loading visitors...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Horizontal scroll wrapper for full table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* HEADER */}
          <View style={[styles.row, styles.headerRow]}>
            <View style={styles.colSelect}>
              <Checkbox
                value={
                  visitors.length > 0 &&
                  visitors.every((v) => selectedVisitorIds.includes(v._id))
                }
                onValueChange={toggleSelectAll}
                color="#1eb88c"
              />
              <Text style={styles.headerText}>Log ID</Text>
            </View>

            <Text style={[styles.colVisitor, styles.headerText]}>Visitors</Text>
            <Text style={[styles.colFlat, styles.headerText]}>Flat</Text>
            <Text style={[styles.colType, styles.headerText]}>Type</Text>
            <Text style={[styles.colEntry, styles.headerText]}>Entry</Text>
            <Text style={[styles.colExit, styles.headerText]}>Exit</Text>
            <Text style={[styles.colStatus, styles.headerText]}>Status</Text>
            <Text style={[styles.colResponse, styles.headerText]}>
              Response
            </Text>
            {canEditVisitorStatus && (
              <Text style={[styles.colEdit, styles.headerText]}>Edit</Text>
            )}
          </View>

          {/* BODY (vertical scroll) */}
          <ScrollView
            style={{ maxHeight: "80%" }}
            showsVerticalScrollIndicator={false}
          >
            {visitors.length === 0 ? (
              <View
                style={[styles.row, { justifyContent: "center", padding: 20 }]}
              >
                <Text style={styles.noDataText}>No visitors found.</Text>
              </View>
            ) : (
              visitors.map((v) => {
                // ✅ Precompute createdAt date vs today (same logic as web)
                const createdDate = formatDate(v.createdAt);
                const todayDate = formatDate(new Date().toISOString());

                const canShowRespond =
                  v.status === "Awaiting" &&
                  v.occupantAcceptStatus === "Pending" &&
                  createdDate === todayDate;

                const flat = v.flatId;

                return (
                  <View key={v._id} style={styles.row}>
                    {/* Select + Log ID */}
                    <View style={styles.colSelect}>
                      <Checkbox
                        value={selectedVisitorIds.includes(v._id)}
                        onValueChange={(checked) =>
                          toggleSelectOne(v._id, checked)
                        }
                        color="#1eb88c"
                      />
                      <Text style={[styles.cellText, { flexShrink: 1 }]}>
                        {v.visitorLogId}
                      </Text>
                    </View>

                    {/* Visitor Details */}
                    <View style={styles.colVisitor}>
                      <Text style={styles.cellText}>
                        {v.name} ({v.phone})
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedId(v._id);
                          setShowModal(true);
                        }}
                      >
                        <Text style={styles.link}>View Profile</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Flat Details */}
                    <View style={styles.colFlat}>
                      <Text style={styles.cellText}>
                        {flat ? `${flat.flatName}-${flat.blockName}` : "N/A"}
                      </Text>
                      {flat?.occupantName && (
                        <Text style={styles.subText}>
                          {flat.occupantName} ({flat.occupantPhone})
                        </Text>
                      )}
                    </View>

                    {/* Type */}
                    <View style={styles.colType}>
                      <Text style={styles.cellText}>{v.type}</Text>
                    </View>

                    {/* Entry Time */}
                    <View style={styles.colEntry}>
                      <Text style={styles.cellText}>
                        {v.clockInTime
                          ? formatDate(v.clockInTime) +
                            " " +
                            formatTime(v.clockInTime.split(" ")[1])
                          : "—"}
                      </Text>
                    </View>

                    {/* Exit Time */}
                    <View style={styles.colExit}>
                      <Text style={styles.cellText}>
                        {v.clockOutTime
                          ? formatDate(v.clockOutTime) +
                            " " +
                            formatTime(v.clockOutTime.split(" ")[1])
                          : "—"}
                      </Text>
                    </View>

                    {/* Status */}
                    <View style={styles.colStatus}>
                      <Text
                        style={[styles.statusBadge, getStatusStyle(v.status)]}
                      >
                        {v.status || "—"}
                      </Text>

                      {/* Expected schedule for Awaiting status */}
                      {v.status === "Awaiting" && v.scheduleDate && (
                        <View style={styles.scheduleContainer}>
                          <Text style={styles.scheduleLabel}>Expected:</Text>
                          <Text style={styles.scheduleDate}>
                            {formatDate(v.scheduleDate)}
                          </Text>
                          {(v.scheduleFrom || v.scheduleTo) && (
                            <Text style={styles.scheduleTime}>
                              {v.scheduleFrom &&
                                `From: ${formatTime(v.scheduleFrom)}`}
                              {v.scheduleTo &&
                                ` | To: ${formatTime(v.scheduleTo)}`}
                            </Text>
                          )}
                        </View>
                      )}
                    </View>

                    {/* Occupant Response */}
                    <View style={styles.colResponse}>
                      <Text
                        style={[
                          styles.statusBadge,
                          getStatusStyle(v.occupantAcceptStatus || "Pending"),
                        ]}
                      >
                        {v.occupantAcceptStatus || "Pending"}
                      </Text>

                      {/* Respond button */}
                      {canRespondToVisitorStatus && canShowRespond && (
                        <TouchableOpacity
                          style={styles.respondButton}
                          onPress={() => {
                            setOccupantModalVisitorId(v._id);
                            setShowOccupantModal(true);
                          }}
                        >
                          <Text style={styles.respondText}>Respond</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Edit Menu */}
                    {canEditVisitorStatus && (
                      <TouchableOpacity
                        style={styles.colEdit}
                        onPress={() => {
                          setSelectedVisitorId(v._id);
                          setShowStatusModal(true);
                        }}
                      >
                        <Text style={styles.moreIcon}>⋮</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ECECEC",
    alignItems: "flex-start",
  },

  headerRow: {
    backgroundColor: "#F2F4F7",
    // paddingVertical: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },

  headerText: {
    fontWeight: "700",
    fontSize: 12,
    color: "#111827",
  },

  cellText: {
    color: "#1F2937",
    fontSize: 12,
    fontWeight: "500",
    flexShrink: 1,
  },

  subText: {
    color: "#6B7280",
    fontSize: 10,
    marginTop: 2,
  },

  link: {
    color: "#1EB88C",
    fontSize: 11,
    marginTop: 4,
    fontWeight: "600",
  },

  moreIcon: {
    fontSize: 18,
    color: "#6B7280",
    marginTop: 2,
  },

  noDataText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "500",
  },

  /* Column widths optimized for mobile */
  colSelect: {
    width: 160,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingRight: 8,
  },

  colVisitor: {
    width: 140,
    paddingRight: 8,
  },

  colFlat: {
    width: 120,
    paddingRight: 8,
  },

  colType: {
    width: 100,
    paddingRight: 8,
  },

  colEntry: {
    width: 100,
    paddingRight: 8,
  },

  colExit: {
    width: 100,
    paddingRight: 8,
  },

  colStatus: {
    width: 130,
    paddingRight: 8,
  },

  colResponse: {
    width: 120,
    paddingRight: 8,
  },

  colEdit: {
    width: 50,
    alignItems: "center",
  },

  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
    overflow: "hidden",
    marginBottom: 4,
  },

  scheduleContainer: {
    marginTop: 4,
  },

  scheduleLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#065F46",
    marginBottom: 1,
  },

  scheduleDate: {
    fontSize: 9,
    color: "#065F46",
    marginBottom: 1,
  },

  scheduleTime: {
    fontSize: 8,
    color: "#065F46",
  },

  respondButton: {
    marginTop: 4,
  },

  respondText: {
    fontSize: 10,
    color: "#065F46",
    fontWeight: "600",
    textDecorationLine: "underline",
  },

  /* Status colors */
  Awaiting: { backgroundColor: "#FEF3C7", color: "#92400E" },
  "Checked-In": { backgroundColor: "#D1FAE5", color: "#065F46" },
  "Checked-Out": { backgroundColor: "#DBEAFE", color: "#1E40AF" },
  Rejected: { backgroundColor: "#FEE2E2", color: "#991B1B" },
  Accepted: { backgroundColor: "#D1FAE5", color: "#065F46" },
  Pending: { backgroundColor: "#FEF3C7", color: "#92400E" },
});
const STATUS_STYLE_MAP: Record<string, any> = {
  Awaiting: styles.Awaiting,
  "Checked-In": styles["Checked-In"],
  "Checked-Out": styles["Checked-Out"],
  Accepted: styles.Accepted,
  Rejected: styles.Rejected,
  Pending: styles.Pending,
};
