// components/FillFormRightColumn.native.tsx
import * as ImagePicker from "expo-image-picker";
import React, { useEffect } from "react";
import {
        Alert,
        Image,
        Platform,
        StyleSheet,
        Text,
        TextInput,
        ToastAndroid,
        TouchableOpacity,
        View,
} from "react-native";

type Props = {
  vehicleType: string;
  setVehicleType: (val: string) => void;
  vehicleNumber: string;
  setVehicleNumber: (val: string) => void;
  vehiclePhoto: { uri: string; name?: string; size?: number } | null;
  setVehiclePhoto: (
    file: { uri: string; name?: string; size?: number } | null
  ) => void;
  vehiclePhotoPreview: string | null;
  setVehiclePhotoPreview: (val: string | null) => void;
  status: string;
  setStatus?: (val: string) => void; // optional as it's readonly on the UI
};

const toast = (msg: string) => {
  if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
  else Alert.alert("", msg);
};

export default function FillFormRightColumn({
  vehicleType,
  setVehicleType,
  vehicleNumber,
  setVehicleNumber,
  vehiclePhoto,
  setVehiclePhoto,
  vehiclePhotoPreview,
  setVehiclePhotoPreview,
  status,
}: Props) {
  const vehicleNumberRegex = /^[A-Z0-9]*$/;

  // Request permissions on mount for image picker
  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          toast("Permission to access media library is required.");
        }
      }
    })();
  }, []);

  const handleVehicleNumberChange = (input: string) => {
    const value = input.toUpperCase();
    // strip invalid chars
    const sanitized = value.replace(/[^A-Z0-9]/g, "");
    if (sanitized.length <= 10 && vehicleNumberRegex.test(sanitized)) {
      setVehicleNumber(sanitized);
    } else if (sanitized === "") {
      setVehicleNumber("");
    }
  };

  const pickVehicleImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if ((result as any).cancelled) return;

      let uri: string | undefined;
      let fileSize: number | undefined;
      let fileName: string | undefined;

      if ((result as any).assets && (result as any).assets.length > 0) {
        const asset = (result as any).assets[0];
        uri = asset.uri;
        fileSize = asset.fileSize;
        fileName = asset.fileName || asset.uri?.split("/").pop();
      } else {
        uri = (result as any).uri;
      }

      if (!uri) {
        toast("Failed to pick image");
        return;
      }

      if (!fileSize && Platform.OS !== "web") {
        try {
          const resp = await fetch(uri);
          const blob = await resp.blob();
          fileSize = blob.size;
        } catch (err) {
          console.warn("Could not determine file size", err);
        }
      }

      const maxBytes = 5 * 1024 * 1024;
      if (fileSize && fileSize > maxBytes) {
        toast(
          `Vehicle photo exceeds 5MB (${(fileSize / (1024 * 1024)).toFixed(
            2
          )} MB).`
        );
        return;
      }

      setVehiclePhoto({ uri, name: fileName, size: fileSize });
      setVehiclePhotoPreview(uri);
    } catch (err) {
      console.error("pickVehicleImage error", err);
      toast("Error picking image.");
    }
  };

  const takeVehiclePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        toast("Camera permission is required.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if ((result as any).cancelled) return;

      let uri: string | undefined;
      let fileSize: number | undefined;
      let fileName: string | undefined;

      if ((result as any).assets && (result as any).assets.length > 0) {
        const asset = (result as any).assets[0];
        uri = asset.uri;
        fileSize = asset.fileSize;
        fileName = asset.fileName || asset.uri?.split("/").pop();
      } else {
        uri = (result as any).uri;
      }

      if (!uri) {
        toast("Failed to capture photo");
        return;
      }

      if (!fileSize && Platform.OS !== "web") {
        try {
          const resp = await fetch(uri);
          const blob = await resp.blob();
          fileSize = blob.size;
        } catch (err) {}
      }

      const maxBytes = 5 * 1024 * 1024;
      if (fileSize && fileSize > maxBytes) {
        toast(
          `Vehicle photo exceeds 5MB (${(fileSize / (1024 * 1024)).toFixed(
            2
          )} MB).`
        );
        return;
      }

      setVehiclePhoto({ uri, name: fileName, size: fileSize });
      setVehiclePhotoPreview(uri);
    } catch (err) {
      console.error("takeVehiclePhoto error", err);
      toast("Error capturing photo.");
    }
  };

  const handleRemoveVehiclePhoto = () => {
    setVehiclePhoto(null);
    setVehiclePhotoPreview(null);
  };

  return (
    <View style={styles.container}>
      {/* Vehicle Type */}
      <View style={styles.field}>
        <Text style={styles.label}>Vehicle Type</Text>
        <View style={styles.row}>
          {["Car", "Cab", "2-Wheeler", "None"].map((vt) => (
            <TouchableOpacity
              key={vt}
              style={[styles.option, vehicleType === vt && styles.optionActive]}
              onPress={() => setVehicleType(vt)}
            >
              <Text
                style={
                  vehicleType === vt
                    ? styles.optionTextActive
                    : styles.optionText
                }
              >
                {vt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Vehicle Number & Photo - show only if not "None" */}
      {vehicleType !== "None" && (
        <>
          <View style={styles.field}>
            <Text style={styles.label}>Vehicle Number</Text>
            <View style={styles.vehicleNumberRow}>
              <View style={styles.prefix}>
                <Text style={styles.prefixText}>IN</Text>
              </View>
              <TextInput
                value={vehicleNumber}
                onChangeText={handleVehicleNumberChange}
                placeholder="KA01AB1234"
                style={[styles.input, { flex: 1 }]}
                maxLength={10}
                autoCapitalize="characters"
              />
            </View>
            <Text style={styles.helper}>
              Max 10 characters. Letters & numbers only.
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Vehicle Photo</Text>
            <View style={styles.photoButtonsRow}>
              <TouchableOpacity
                style={styles.photoBtn}
                onPress={pickVehicleImage}
              >
                <Text style={styles.photoBtnText}>Pick from gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.photoBtn}
                onPress={takeVehiclePhoto}
              >
                <Text style={styles.photoBtnText}>Take photo</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.helper}>
              Max upload 5MB. JPG, PNG, WEBP only.
            </Text>

            {vehiclePhotoPreview ? (
              <View style={styles.previewWrap}>
                <Image
                  source={{ uri: vehiclePhotoPreview }}
                  style={styles.preview}
                />
                <TouchableOpacity
                  onPress={handleRemoveVehiclePhoto}
                  style={styles.removeBtn}
                >
                  <Text style={styles.removeText}>Remove Vehicle Photo</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </>
      )}

      {/* Status (readonly) */}
      <View style={styles.field}>
        <Text style={styles.label}>*Status</Text>
        <TextInput
          value={status || "Awaiting"}
          editable={false}
          style={[styles.input, styles.disabledInput]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: "#fff" },
  field: { marginBottom: 14 },
  label: { fontSize: 14, color: "#374151", marginBottom: 6, fontWeight: "600" },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap" as const },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    marginRight: 8,
    marginBottom: 8,
  },
  optionActive: { backgroundColor: "#1eb88c", borderColor: "#1eb88c" },
  optionText: { color: "#111" },
  optionTextActive: { color: "#fff", fontWeight: "700" },
  vehicleNumberRow: { flexDirection: "row", alignItems: "center" },
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
  prefixText: { color: "#374151", fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    fontSize: 14,
  },
  disabledInput: { backgroundColor: "#f3f4f6", color: "#6b7280" },
  helper: { fontSize: 12, color: "#6b7280", marginTop: 6 },
  photoButtonsRow: { flexDirection: "row", gap: 8 },
  photoBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  photoBtnText: { color: "#065f46", fontWeight: "700" },
  previewWrap: { marginTop: 10 },
  preview: {
    width: 160,
    height: 160,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e6e9ee",
  },
  removeBtn: { marginTop: 8 },
  removeText: {
    color: "#ef4444",
    fontSize: 13,
    textDecorationLine: "underline",
  },
});
