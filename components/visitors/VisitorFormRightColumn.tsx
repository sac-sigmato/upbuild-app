// components/VisitorFormRightColumn.tsx
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type VisitorFormRightProps = {
  flats: any[];
  flatId: string;
  setFlatId: (v: string) => void;
  purpose: string;
  setPurpose: (v: string) => void;
  vehicleType: string;
  setVehicleType: (v: string) => void;
  vehicleNumber: string;
  setVehicleNumber: (v: string) => void;
  vehiclePhoto: any | null;
  setVehiclePhoto: (v: any | null) => void;
  vehiclePhotoPreview: string | null;
  setVehiclePhotoPreview: (v: string | null) => void;
  clockInTime: string;
  setClockInTime: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
  isForApartment?: boolean;
  scheduleDate: string;
  setScheduleDate: (v: string) => void;
  scheduleFrom: string;
  setScheduleFrom: (v: string) => void;
  scheduleTo: string;
  setScheduleTo: (v: string) => void;
};

export default function VisitorFormRightColumn(props: VisitorFormRightProps) {
  const {
    flats,
    flatId,
    setFlatId,
    purpose,
    setPurpose,
    vehicleType,
    setVehicleType,
    vehicleNumber,
    setVehicleNumber,
    vehiclePhoto,
    setVehiclePhoto,
    vehiclePhotoPreview,
    setVehiclePhotoPreview,
    clockInTime,
    setClockInTime,
    status,
    setStatus,
    isForApartment,
    scheduleDate,
    setScheduleDate,
    scheduleFrom,
    setScheduleFrom,
    scheduleTo,
    setScheduleTo,
  } = props;

  // When there is exactly 1 flat, auto-select it - MATCHES WEB LOGIC
  useEffect(() => {
    if (flats && flats.length === 1 && flats[0]._id !== flatId) {
      setFlatId(flats[0]._id);
    }
  }, [flats, flatId, setFlatId]);

  // Date picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFromTimePicker, setShowFromTimePicker] = useState(false);
  const [showToTimePicker, setShowToTimePicker] = useState(false);

  // helper — format to yyyy-mm-dd
  const formatISODate = (d: Date) => d.toISOString().split("T")[0];

  // min date: today in local - MATCHES WEB
  const getMinDate = () => formatISODate(new Date());

  // Native toast function
  const nativeToast = (msg: string) => {
    if (Platform.OS === "android") {
      const ToastAndroid = require("react-native").ToastAndroid;
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    } else {
      Alert.alert("", msg);
    }
  };

  // pick vehicle image with file size validation - MATCHES WEB LOGIC
  const pickVehicleImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        nativeToast("Permission to access media is required!");
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
      });

      if (!res.canceled) {
        const uri = res.assets[0].uri;
        const name = uri.split("/").pop() || `vehicle_${Date.now()}.jpg`;
        const match = /\.(\w+)$/.exec(name);
        const ext = match ? match[1].toLowerCase() : "jpg";
        const type = ext === "png" ? "image/png" : "image/jpeg";

        // File size check - MATCHES WEB (5MB limit)
        const fileInfo = await fetch(uri);
        const blob = await fileInfo.blob();
        const fileSizeMB = blob.size / (1024 * 1024);
        const maxSizeMB = 5;

        if (fileSizeMB > maxSizeMB) {
          nativeToast(
            `Vehicle photo exceeds 5MB limit (${fileSizeMB.toFixed(2)} MB).`
          );
          return;
        }

        // set preview and object for FormData
        setVehiclePhoto({ uri, name, type });
        setVehiclePhotoPreview(uri);
      }
    } catch (err) {
      console.error("pickVehicleImage", err);
      nativeToast("Failed to pick image");
    }
  };

  // remove vehicle photo
  const removeVehiclePhoto = () => {
    setVehiclePhoto(null);
    setVehiclePhotoPreview(null);
  };

  // default minimum datetime string — used when showing checked-in time
  const getMinDateTime = (): string => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localTime = new Date(now.getTime() - offset * 60000);
    return localTime.toISOString().slice(0, 16);
  };

  // handle date selection
  const onDateChange = (_: any, selected?: Date) => {
    setShowDatePicker(false);
    if (selected) {
      setScheduleDate(formatISODate(selected));
    }
  };

  // handle time selection - MATCHES WEB TIME INPUTS
  const onFromTimeChange = (_: any, selected?: Date) => {
    setShowFromTimePicker(false);
    if (selected) {
      const hours = selected.getHours().toString().padStart(2, "0");
      const minutes = selected.getMinutes().toString().padStart(2, "0");
      setScheduleFrom(`${hours}:${minutes}`);
    }
  };

  const onToTimeChange = (_: any, selected?: Date) => {
    setShowToTimePicker(false);
    if (selected) {
      const hours = selected.getHours().toString().padStart(2, "0");
      const minutes = selected.getMinutes().toString().padStart(2, "0");
      setScheduleTo(`${hours}:${minutes}`);
    }
  };

  // Format time for display in time picker
  const getTimeFromString = (timeStr: string) => {
    if (!timeStr) return new Date();
    const [hours, minutes] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  return (
    <View style={styles.container}>
      {/* Flat selection (only when visitor is NOT for apartment) */}
      {!isForApartment && (
        <View style={styles.field}>
          <Text style={styles.label}>*Flat</Text>

          {flats && flats.length === 1 ? (
            <>
              {/* Readonly Flat Info - MATCHES WEB */}
              <View style={styles.readonlyBox}>
                <Text style={styles.readonlyText}>
                  {flats[0].flatName} - {flats[0].blockName}
                  {flats[0].ownerStaying
                    ? ` (${flats[0].ownerName}, ${flats[0].ownerPhoneNumber})`
                    : flats[0].tenantDetails
                    ? ` (${flats[0].tenantDetails.tenantName}, ${flats[0].tenantDetails.tenantPhoneNumber})`
                    : ""}
                </Text>
              </View>

              {/* Show schedule pickers when exactly one flat - MATCHES WEB */}
              <View style={{ marginTop: 16 }}>
                <Text style={styles.label}>*Visit Date</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.inputText}>
                    {scheduleDate || formatISODate(new Date())}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={scheduleDate ? new Date(scheduleDate) : new Date()}
                    mode="date"
                    display="default"
                    minimumDate={new Date(getMinDate())}
                    onChange={onDateChange}
                  />
                )}

                <View style={styles.timeRow}>
                  <View style={styles.timeColumn}>
                    <Text style={styles.label}>*From</Text>
                    <TouchableOpacity
                      style={styles.input}
                      onPress={() => setShowFromTimePicker(true)}
                    >
                      <Text style={styles.inputText}>
                        {scheduleFrom || "HH:MM"}
                      </Text>
                    </TouchableOpacity>
                    {showFromTimePicker && (
                      <DateTimePicker
                        value={getTimeFromString(scheduleFrom)}
                        mode="time"
                        display="default"
                        onChange={onFromTimeChange}
                      />
                    )}
                  </View>

                  <View style={styles.timeColumn}>
                    <Text style={styles.label}>*To</Text>
                    <TouchableOpacity
                      style={styles.input}
                      onPress={() => setShowToTimePicker(true)}
                    >
                      <Text style={styles.inputText}>
                        {scheduleTo || "HH:MM"}
                      </Text>
                    </TouchableOpacity>
                    {showToTimePicker && (
                      <DateTimePicker
                        value={getTimeFromString(scheduleTo)}
                        mode="time"
                        display="default"
                        onChange={onToTimeChange}
                      />
                    )}
                  </View>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={flatId}
                onValueChange={(v) => setFlatId(String(v))}
              >
                <Picker.Item label="Select a flat" value="" />
                {flats.map((f: any) => (
                  <Picker.Item
                    key={f._id}
                    label={`${f.flatName} - ${f.blockName}`}
                    value={f._id}
                  />
                ))}
              </Picker>
            </View>
          )}
        </View>
      )}

      {/* Purpose - MATCHES WEB */}
      <View style={styles.field}>
        <Text style={styles.label}>Purpose of Visit</Text>
        <TextInput
          style={styles.input}
          value={purpose}
          onChangeText={setPurpose}
          placeholder="Enter purpose (e.g., Delivery, Guest visit, etc.)"
        />
      </View>

      {/* Vehicle Type - MATCHES WEB */}
      <View style={styles.field}>
        <Text style={styles.label}>Vehicle Type</Text>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={vehicleType}
            onValueChange={(v) => setVehicleType(String(v))}
          >
            <Picker.Item label="Select vehicle type" value="" />
            <Picker.Item label="Car" value="Car" />
            <Picker.Item label="Cab" value="Cab" />
            <Picker.Item label="2-Wheeler" value="2-Wheeler" />
            <Picker.Item label="None" value="None" />
          </Picker>
        </View>
      </View>

      {vehicleType !== "None" && (
        <>
          {/* Vehicle Number - MATCHES WEB (with IN prefix) */}
          <View style={styles.field}>
            <Text style={styles.label}>Vehicle Number</Text>
            <View style={styles.vehicleNumberContainer}>
              <View style={styles.prefix}>
                <Text style={styles.prefixText}>IN</Text>
              </View>
              <TextInput
                style={styles.vehicleNumberInput}
                value={vehicleNumber}
                onChangeText={(t) => {
                  const val = t.toUpperCase().slice(0, 10);
                  setVehicleNumber(val);
                }}
                placeholder="KA01AB1234"
                maxLength={10}
              />
            </View>
          </View>

          {/* Vehicle Photo - MATCHES WEB */}
          <View style={styles.field}>
            <Text style={styles.label}>Vehicle Photo</Text>
            <View style={styles.photoRow}>
              <TouchableOpacity
                style={styles.smallBtn}
                onPress={pickVehicleImage}
              >
                <Text style={styles.smallBtnText}>Pick Photo</Text>
              </TouchableOpacity>

              {vehiclePhotoPreview ? (
                <View style={styles.previewContainer}>
                  <Image
                    source={{ uri: vehiclePhotoPreview }}
                    style={styles.preview}
                  />
                  <TouchableOpacity
                    onPress={removeVehiclePhoto}
                    style={{ marginTop: 6 }}
                  >
                    <Text style={styles.removeText}>Remove Vehicle Photo</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          </View>
        </>
      )}

      {/* Status & Clock-in - MATCHES WEB LOGIC */}
      {isForApartment ? (
        <>
          <View style={styles.field}>
            <Text style={styles.label}>*Status</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value="Check-In"
              editable={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>*Checked-In</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={clockInTime || getMinDateTime()}
              editable={false}
            />
          </View>
        </>
      ) : (
        <View style={styles.field}>
          <Text style={styles.label}>*Status</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value="Awaiting"
            editable={false}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, color: "#374151", marginBottom: 6, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  inputText: { color: "#111" },
  readonlyBox: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e6e9ee",
  },
  readonlyText: { color: "#374151", fontSize: 14 },
  pickerWrap: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  smallBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#1eb88c",
    borderRadius: 8,
  },
  smallBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  preview: { width: 96, height: 96, borderRadius: 8 },
  removeText: { color: "#ef4444", fontSize: 13 },
  prefix: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: "#d1d5db",
    backgroundColor: "#f3f4f6",
  },
  prefixText: { color: "#374151", fontWeight: "600" },
  vehicleNumberContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  vehicleNumberInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderLeftWidth: 0,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    flex: 1,
  },
  photoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  previewContainer: {
    marginLeft: 12,
    alignItems: "center",
  },
  timeRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  timeColumn: {
    flex: 1,
  },
  disabledInput: {
    backgroundColor: "#f3f4f6",
    color: "#6b7280",
  },
});
