// components/FlatBulkVisitorForm.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { api_url } from "../../../utils/apiLocalhost"; // adjust path
import { TimeSelector } from "./TimeSelector";

type Flat = {
  _id: string;
  flatName: string;
  blockName: string;
  ownerStaying?: boolean;
  ownerName?: string;
  ownerPhoneNumber?: string;
  tenantDetails?: { tenantName?: string; tenantPhoneNumber?: string };
};

export default function FlatBulkVisitorForm() {
  const [flatId, setFlatId] = useState<string>(""); // "" or "apartment"
  const [flats, setFlats] = useState<Flat[]>([]);
  const [eventPurpose, setEventPurpose] = useState("");
  const [expectedCount, setExpectedCount] = useState<number>(1);

  const [isMultipleDays, setIsMultipleDays] = useState(false);
  const [visitDate, setVisitDate] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [fromTime, setFromTime] = useState<string>("");
  const [toTime, setToTime] = useState<string>("");

  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [roleName, setRoleName] = useState<string | null>(null);
  const navigation = useNavigation();

  // datepicker state for visitDate / fromDate / toDate
  const [showDatePickerFor, setShowDatePickerFor] = useState<
    "visit" | "from" | "to" | null
  >(null);

  const [apartmentId, setApartmentId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const storedData = await AsyncStorage.getItem("upbuild_user_store");
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          setApartmentId(parsed?.state?.user?.apartment || null);
          setRoleName(parsed?.state?.user?.roleName || null);
        } catch (err) {
          console.error("parse upbuild_user_store", err);
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (!apartmentId) return;
    (async () => {
      const token = await AsyncStorage.getItem("token");
      try {
        const res = await fetch(
          `${api_url}get/flat/by/apartment/for/visitor/${apartmentId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );
        const text = await res.text();
        const data = (() => {
          try {
            return JSON.parse(text);
          } catch {
            return null;
          }
        })();
        if (res.ok && data?.flats) {
          setFlats(data.flats);
          // auto select single flat if only one available
          if (data.flats.length === 1 && !flatId) setFlatId(data.flats[0]._id);
        } else {
          console.warn("Failed to load flats:", text);
        }
      } catch (err) {
        console.error("fetch flats error", err);
        Alert.alert("Error", "Failed to load flats");
      }
    })();
  }, [apartmentId]);

  // Helper to format date to yyyy-mm-dd
  const formatISODate = (d: Date) => d.toISOString().split("T")[0];

  const onDateChange = (event: any, selected?: Date) => {
    setShowDatePickerFor(null);
    if (!selected) return;
    const iso = formatISODate(selected);
    if (showDatePickerFor === "visit") setVisitDate(iso);
    else if (showDatePickerFor === "from") setFromDate(iso);
    else if (showDatePickerFor === "to") setToDate(iso);
  };

  const isValidTime = (t: string) =>
    typeof t === "string" &&
    /^((0?[1-9])|(1[0-2])):(00|15|30|45)\s(AM|PM)$/i.test(t.trim());

  const handleSubmit = async () => {
    if (!apartmentId) {
      Alert.alert("Error", "Apartment ID missing");
      return;
    }
    if (!flatId) {
      Alert.alert("Error", "Please select a flat or apartment.");
      return;
    }

    if (!eventPurpose.trim() || !expectedCount) {
      Alert.alert("Error", "Please fill all required fields.");
      return;
    }

    // validate time & dates
    if (isMultipleDays) {
      if (!fromDate || !toDate) {
        Alert.alert(
          "Error",
          "Please provide from/to dates for multi-day event."
        );
        return;
      }
      if (!isValidTime(fromTime) || !isValidTime(toTime)) {
        Alert.alert(
          "Error",
          "Please provide valid from/to time (15-min steps)."
        );
        return;
      }
    } else {
      if (!visitDate) {
        Alert.alert("Error", "Please provide visit date.");
        return;
      }
      if (!isValidTime(fromTime) || !isValidTime(toTime)) {
        Alert.alert(
          "Error",
          "Please provide valid from/to time (15-min steps)."
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const payload: any = {
        apartmentId,
        flatId,
        eventPurpose,
        expectedCount,
        notes,
        isMultipleDays,
      };

      if (isMultipleDays) {
        payload.fromDate = fromDate;
        payload.toDate = toDate;
        payload.fromTime = fromTime.trim();
        payload.toTime = toTime.trim();
      } else {
        payload.visitDate = visitDate;
        payload.fromTime = fromTime.trim();
        payload.toTime = toTime.trim();
      }

      const res = await fetch(`${api_url}visitor/add/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      const data = (() => {
        try {
          return JSON.parse(text);
        } catch {
          return null;
        }
      })();

      if (!res.ok) {
        const msg = data?.message || text || "Server error";
        Alert.alert("Error", msg);
        return;
      }

      // success
      Alert.alert("Success", "Flat bulk visitor entry added!");
      // navigate back to bulk list (adjust route name to your app)
      navigation.navigate?.("BulkVisitors" as any);
      // reset
      setFlatId("apartment");
      setEventPurpose("");
      setExpectedCount(1);
      setVisitDate("");
      setFromDate("");
      setToDate("");
      setFromTime("");
      setToTime("");
      setNotes("");
    } catch (err) {
      console.error("submit error", err);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (!apartmentId) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#6b7280" }}>Apartment ID missing.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Scope Selection */}
      <View style={styles.row}>
        <TouchableOpacity style={styles.radio} onPress={() => setFlatId("")}>
          <Text style={styles.radioText}>Particular Flat</Text>
        </TouchableOpacity>

        {roleName !== "occupants" && (
          <TouchableOpacity
            style={styles.radio}
            onPress={() => setFlatId("apartment")}
          >
            <Text style={styles.radioText}>Entire Apartment</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Flat Selector */}
      {flatId !== "apartment" && (
        <View style={{ marginBottom: 12 }}>
          <Text style={styles.label}>Select Flat</Text>
          {flats.length === 1 ? (
            <View style={styles.readonlyBox}>
              <Text>
                {flats[0].flatName} - {flats[0].blockName}
              </Text>
            </View>
          ) : (
            <View style={styles.pickerWrap}>
              <TextInput
                placeholder="Type or paste flat id (or use a picker component)"
                value={flatId}
                onChangeText={setFlatId}
                style={styles.input}
              />
            </View>
          )}
        </View>
      )}

      {/* Purpose */}
      <View style={{ marginBottom: 12 }}>
        <Text style={styles.label}>Purpose of Visit</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Birthday, Puja"
          value={eventPurpose}
          onChangeText={setEventPurpose}
        />
      </View>

      {/* Expected Count */}
      <View style={{ marginBottom: 12 }}>
        <Text style={styles.label}>Expected Number of Visitors</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={String(expectedCount)}
          onChangeText={(t) => {
            const n = parseInt(t || "0", 10);
            setExpectedCount(isNaN(n) ? 1 : Math.max(1, n));
          }}
        />
      </View>

      {/* Multi-day toggle */}
      <View style={[styles.row, { alignItems: "center", marginBottom: 12 }]}>
        <TouchableOpacity
          onPress={() => setIsMultipleDays((s) => !s)}
          style={[
            styles.checkbox,
            isMultipleDays ? styles.checkboxChecked : undefined,
          ]}
        >
          <Text style={{ color: isMultipleDays ? "#fff" : "#000" }}>
            {isMultipleDays ? "✓" : ""}
          </Text>
        </TouchableOpacity>
        <Text style={{ marginLeft: 8 }}>This is a multi-day event</Text>
      </View>

      {/* Dates & Times */}
      {isMultipleDays ? (
        <>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1, marginBottom: 12 }}>
              <Text style={styles.label}>From Date</Text>
              <TouchableOpacity
                style={styles.inputLike}
                onPress={() => setShowDatePickerFor("from")}
              >
                <Text>{fromDate || formatISODate(new Date())}</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1, marginBottom: 12 }}>
              <Text style={styles.label}>To Date</Text>
              <TouchableOpacity
                style={styles.inputLike}
                onPress={() => setShowDatePickerFor("to")}
              >
                <Text>{toDate || formatISODate(new Date())}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <TimeSelector
                label="From Time"
                time={fromTime}
                setTime={setFromTime}
              />
            </View>
            <View style={{ flex: 1 }}>
              <TimeSelector label="To Time" time={toTime} setTime={setToTime} />
            </View>
          </View>
        </>
      ) : (
        <>
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Date of Visit</Text>
            <TouchableOpacity
              style={styles.inputLike}
              onPress={() => setShowDatePickerFor("visit")}
            >
              <Text>{visitDate || formatISODate(new Date())}</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <TimeSelector
                label="From Time"
                time={fromTime}
                setTime={setFromTime}
              />
            </View>
            <View style={{ flex: 1 }}>
              <TimeSelector label="To Time" time={toTime} setTime={setToTime} />
            </View>
          </View>
        </>
      )}

      {/* DateTimePicker fallback (native) */}
      {showDatePickerFor && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Notes */}
      <View style={{ marginTop: 12 }}>
        <Text style={styles.label}>Special Instructions (Optional)</Text>
        <TextInput
          style={[styles.input, { height: 100, textAlignVertical: "top" }]}
          placeholder="Mention any guidelines or notes"
          value={notes}
          onChangeText={setNotes}
          multiline
        />
      </View>

      {/* Buttons */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 20,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate?.("Visitors" as any)}
          style={[styles.btn, styles.cancelBtn]}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting}
          style={[
            styles.btn,
            styles.submitBtn,
            submitting ? { opacity: 0.7 } : null,
          ]}
        >
          <Text style={styles.submitText}>
            {submitting ? "Adding..." : "Add Visitor"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#fff" },
  center: { padding: 16, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", gap: 12 },
  radio: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  radioText: { color: "#111" },
  label: { fontSize: 13, color: "#374151", marginBottom: 6, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  readonlyBox: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e6e9ee",
  },
  inputLike: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  checkbox: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: "#1eb88c", borderColor: "#1eb88c" },
  btn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999 },
  cancelBtn: {
    borderWidth: 1,
    borderColor: "#9ca3af",
    backgroundColor: "#fff",
  },
  cancelText: { color: "#374151" },
  submitBtn: { backgroundColor: "#1eb88c" },
  submitText: { color: "#fff", fontWeight: "700" },
});
