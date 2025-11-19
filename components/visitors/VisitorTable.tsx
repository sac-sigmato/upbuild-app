import Checkbox from "expo-checkbox";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function VisitorTableMobile({
  visitors,
  selectedVisitorIds,
  setSelectedVisitorIds,
  setSelectedId,
  setShowModal,
  setSelectedVisitorId,
  setShowStatusModal,
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
            <Text style={[styles.colStatus, styles.headerText]}>Status</Text>
            <Text style={[styles.colResponse, styles.headerText]}>
              Response
            </Text>
            <Text style={[styles.colEdit, styles.headerText]}>Edit</Text>
          </View>

          {/* BODY (vertical scroll) */}
          <ScrollView
            style={{ maxHeight: "80%" }}
            showsVerticalScrollIndicator={false}
          >
            {visitors.map((v) => (
              <View key={v._id} style={styles.row}>
                {/* Select + Log ID */}
                <View style={styles.colSelect}>
                  <Checkbox
                    value={selectedVisitorIds.includes(v._id)}
                    onValueChange={(checked) => toggleSelectOne(v._id, checked)}
                    color="#1eb88c"
                  />
                  <Text style={[styles.cellText, { flexShrink: 1 }]}>
                    {v.visitorLogId}
                  </Text>
                </View>

                {/* Visitor */}
                <View style={styles.colVisitor}>
                  <Text style={styles.cellText}>{v.name}</Text>
                  <Text style={styles.subText}>{v.phone}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedId(v._id);
                      setShowModal(true);
                    }}
                  >
                    <Text style={styles.link}>View</Text>
                  </TouchableOpacity>
                </View>

                {/* Flat */}
                <View style={styles.colFlat}>
                  <Text style={styles.cellText}>
                    {v.flatId?.flatName}-{v.flatId?.blockName}
                  </Text>
                </View>

                {/* Status */}
                <View style={styles.colStatus}>
                  <Text style={[styles.statusBadge, styles[v.status]]}>
                    {v.status}
                  </Text>
                </View>

                {/* Response */}
                <View style={styles.colResponse}>
                  <Text
                    style={[styles.statusBadge, styles[v.occupantAcceptStatus]]}
                  >
                    {v.occupantAcceptStatus}
                  </Text>
                </View>

                {/* Edit */}
                <TouchableOpacity
                  style={styles.colEdit}
                  onPress={() => {
                    setSelectedVisitorId(v._id);
                    setShowStatusModal(true);
                  }}
                >
                  <Text style={styles.moreIcon}>⋮</Text>
                </TouchableOpacity>
              </View>
            ))}
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
    borderBottomWidth: 1,
    borderBottomColor: "#ECECEC",
    alignItems: "center",
  },

  headerRow: {
    backgroundColor: "#F2F4F7",
    paddingVertical: 14,
  },

  headerText: {
    fontWeight: "700",
    fontSize: 14,
    color: "#111827",
  },

  cellText: {
    color: "#1F2937",
    fontSize: 13,
    fontWeight: "500",
    flexShrink: 1,
  },

  subText: {
    color: "#6B7280",
    fontSize: 11,
    marginTop: 2,
  },

  link: {
    color: "#1EB88C",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
  },

  moreIcon: {
    fontSize: 22,
    color: "#6B7280",
  },

  /* Column widths optimized for mobile */
  colSelect: {
    width: 150,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  colVisitor: {
    width: 160,
  },

  colFlat: {
    width: 130,
  },

  colStatus: {
    width: 110,
    alignItems: "center",
  },

  colResponse: {
    width: 130,
    alignItems: "center",
  },

  colEdit: {
    width: 60,
    alignItems: "center",
  },

  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    overflow: "hidden",
  },

  Awaiting: { backgroundColor: "#FEF3C7", color: "#92400E" },
  Accepted: { backgroundColor: "#D1FAE5", color: "#065F46" },
  Pending: { backgroundColor: "#FEE2E2", color: "#991B1B" },
});
