// components/FillFormLeftColumn.native.tsx
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

interface FillFormLeftColumnProps {
  phoneNumber: string;
  setPhoneNumber: (val: string) => void;
  name: string;
  setName: (val: string) => void;
  gender: string;
  setGender: (val: string) => void;
  address: string;
  setAddress: (val: string) => void;
  photo: { uri: string; name?: string; size?: number } | null;
  setPhoto: (val: { uri: string; name?: string; size?: number } | null) => void;
  previewUrl: string | null;
  setPreviewUrl: (val: string | null) => void;
}

const toast = (msg: string) => {
  if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
  else Alert.alert("", msg);
};

export default function FillFormLeftColumn({
  phoneNumber,
  setPhoneNumber,
  name,
  setName,
  gender,
  setGender,
  address,
  setAddress,
  photo,
  setPhoto,
  previewUrl,
  setPreviewUrl,
}: FillFormLeftColumnProps) {
  // Validation regexes
  const nameRegex = /^[A-Za-z ]*$/;
  const phoneRegex = /^[0-9\b]+$/;
  const addressRegex = /^[A-Za-z0-9 ,.\n-]*$/;

  // Request media permission on mount
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

  const handleNameChange = (value: string) => {
    if (value.length <= 30 && nameRegex.test(value)) {
      setName(value);
    } else if (value === "") {
      setName("");
    }
  };

  const handlePhoneChange = (value: string) => {
    // allow paste, remove non-digits
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 10 && phoneRegex.test(digits)) {
      setPhoneNumber(digits);
    } else if (digits === "") {
      setPhoneNumber("");
    }
  };

  const handleAddressChange = (value: string) => {
    if (value.length <= 250 && addressRegex.test(value)) {
      setAddress(value);
    } else if (value === "") {
      setAddress("");
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.cancelled) return;

      // On web result has different shape; on native we get uri
      // result as any — check for 'uri' or 'assets' (newer SDK returns assets array)
      let uri: string | undefined;
      let fileSize: number | undefined;
      let fileName: string | undefined;

      // Expo SDK 48+ returns assets array
      if ((result as any).assets && (result as any).assets.length > 0) {
        const asset = (result as any).assets[0];
        uri = asset.uri;
        fileSize = asset.fileSize;
        fileName = asset.fileName || asset.uri?.split("/").pop();
      } else {
        // older shape
        uri = (result as any).uri;
        // file size isn't available — skip size check if unknown
      }

      if (!uri) {
        toast("Failed to pick image");
        return;
      }

      // Try to get file size on native platforms using fetch HEAD
      if (!fileSize && Platform.OS !== "web") {
        try {
          const resp = await fetch(uri);
          const blob = await resp.blob();
          fileSize = blob.size;
        } catch (err) {
          // ignore size check if fetch fails
          console.warn("Could not determine file size:", err);
        }
      }

      const maxBytes = 5 * 1024 * 1024;
      if (fileSize && fileSize > maxBytes) {
        toast(
          `Photo exceeds 5MB limit (${(fileSize / (1024 * 1024)).toFixed(
            2
          )} MB).`
        );
        return;
      }

      setPhoto({ uri, name: fileName, size: fileSize });
      setPreviewUrl(uri);
    } catch (err) {
      console.error("pickImage error", err);
      toast("Error picking image.");
    }
  };

  const takePhoto = async () => {
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

      if (result.cancelled) return;

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
          `Photo exceeds 5MB limit (${(fileSize / (1024 * 1024)).toFixed(
            2
          )} MB).`
        );
        return;
      }

      setPhoto({ uri, name: fileName, size: fileSize });
      setPreviewUrl(uri);
    } catch (err) {
      console.error("takePhoto error", err);
      toast("Error capturing photo.");
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPreviewUrl(null);
  };

  return (
    <View style={styles.container}>
      {/* Visitor Name */}
      <View style={styles.field}>
        <Text style={styles.label}>*Visitor Name</Text>
        <TextInput
          value={name}
          onChangeText={handleNameChange}
          placeholder="Enter visitor name"
          style={styles.input}
          maxLength={30}
          autoCapitalize="words"
        />
        <Text style={styles.helper}>
          Max 30 characters. Letters and spaces only.
        </Text>
      </View>

      {/* Phone Number */}
      <View style={styles.field}>
        <Text style={styles.label}>*Visitor Phone Number</Text>
        <TextInput
          value={phoneNumber}
          onChangeText={handlePhoneChange}
          placeholder="Enter phone number"
          style={styles.input}
          keyboardType="number-pad"
          maxLength={10}
        />
        <Text style={styles.helper}>
          10 digits only. No symbols or letters.
        </Text>
      </View>

      {/* Gender */}
      <View style={styles.field}>
        <Text style={styles.label}>Gender</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.option, gender === "Male" && styles.optionActive]}
            onPress={() => setGender("Male")}
          >
            <Text
              style={
                gender === "Male" ? styles.optionTextActive : styles.optionText
              }
            >
              Male
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.option, gender === "Female" && styles.optionActive]}
            onPress={() => setGender("Female")}
          >
            <Text
              style={
                gender === "Female"
                  ? styles.optionTextActive
                  : styles.optionText
              }
            >
              Female
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.option, gender === "Other" && styles.optionActive]}
            onPress={() => setGender("Other")}
          >
            <Text
              style={
                gender === "Other" ? styles.optionTextActive : styles.optionText
              }
            >
              Other
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Address */}
      <View style={styles.field}>
        <Text style={styles.label}>*Visitor Address</Text>
        <TextInput
          value={address}
          onChangeText={handleAddressChange}
          placeholder="Enter address"
          style={[styles.input, styles.textarea]}
          multiline
          numberOfLines={4}
          maxLength={250}
        />
        <Text style={styles.helper}>{address.length}/250 characters</Text>
      </View>

      {/* Visitor Photo */}
      <View style={styles.field}>
        <Text style={styles.label}>Visitor Photo</Text>
        <View style={styles.photoRow}>
          <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
            <Text style={styles.photoBtnText}>Pick from gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
            <Text style={styles.photoBtnText}>Take photo</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.helper}>Max upload 5MB. JPG, PNG, WEBP only.</Text>

        {previewUrl ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: previewUrl }} style={styles.preview} />
            <TouchableOpacity
              onPress={handleRemovePhoto}
              style={styles.removeBtn}
            >
              <Text style={styles.removeText}>Remove Photo</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12, backgroundColor: "#fff" },
  field: { marginBottom: 14 },
  label: { fontSize: 14, color: "#374151", marginBottom: 6, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    fontSize: 14,
  },
  textarea: { height: 100, textAlignVertical: "top", paddingTop: 12 },
  helper: { fontSize: 12, color: "#6b7280", marginTop: 6 },
  row: { flexDirection: "row", gap: 8 },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    marginRight: 8,
  },
  optionActive: { backgroundColor: "#1eb88c", borderColor: "#1eb88c" },
  optionText: { color: "#111" },
  optionTextActive: { color: "#fff", fontWeight: "700" },
  photoRow: { flexDirection: "row", gap: 8, marginBottom: 6 },
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
