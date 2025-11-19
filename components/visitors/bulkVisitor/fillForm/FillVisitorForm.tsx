// screens/FillVisitorForm.native.tsx
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { api_url } from "../../../../utils/apiLocalhost"; // adjust path
import FillFormLeftColumn from "./FillFormLeftColumn"; // adjust path
import FillFormRightColumn from "./FillFormRightColumn"; // adjust path

type FlatType = {
  _id: string;
  flatName?: string;
  blockName?: string;
  additionalDetails?: string;
};

type BulkVisitorInfoType = {
  _id: string;
  bulkVisitorId: string;
  eventPurpose: string;
  isMultipleDays: boolean;
  visitDate?: string;
  fromDate?: string;
  toDate?: string;
  fromTime?: string;
  toTime?: string;
  flatId?: FlatType;
};

export default function FillVisitorForm({
  bulkVisitorInfo = null,
}: {
  bulkVisitorInfo: BulkVisitorInfoType | null;
}) {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("KA");
  const [photo, setPhoto] = useState<{
    uri: string;
    name?: string;
    size?: number;
  } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [vehiclePhoto, setVehiclePhoto] = useState<{
    uri: string;
    name?: string;
    size?: number;
  } | null>(null);
  const [vehiclePhotoPreview, setVehiclePhotoPreview] = useState<string | null>(
    null
  );
  const [status, setStatus] = useState("Awaiting");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Helper to show toast/alert
  const showAlert = (title = "Info", message = "") => {
    if (Platform.OS === "android") {
      // on android use Alert as fallback (or ToastAndroid if you prefer)
      Alert.alert(title, message);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleSubmit = async () => {
    if (!name || !phoneNumber || !address) {
      showAlert("Error", "Please fill in all required fields.");
      return;
    }

    if (!bulkVisitorInfo?._id) {
      showAlert("Error", "Bulk Visitor ID missing");
      return;
    }

    // Build FormData
    const formData = new FormData();
    formData.append("name", name);
    formData.append("phoneNumber", phoneNumber);
    formData.append("address", address);
    formData.append("gender", gender);
    formData.append("vehicleType", vehicleType);
    formData.append("vehicleNumber", vehicleNumber);
    formData.append("status", status);
    formData.append("bulkVisitorId", bulkVisitorInfo._id);

    // Append images (Expo RN expects { uri, name, type })
    if (photo) {
      const nameVal = photo.name || `photo_${Date.now()}.jpg`;
      const type = nameVal.endsWith(".png") ? "image/png" : "image/jpeg";
      formData.append("photo", {
        uri: photo.uri,
        name: nameVal,
        type,
      } as any);
    }
    if (vehiclePhoto) {
      const nameVal = vehiclePhoto.name || `vehicle_${Date.now()}.jpg`;
      const type = nameVal.endsWith(".png") ? "image/png" : "image/jpeg";
      formData.append("vehiclePhoto", {
        uri: vehiclePhoto.uri,
        name: nameVal,
        type,
      } as any);
    }

    setSubmitting(true);

    try {
      // If you require auth, get token:
      // const token = await AsyncStorage.getItem("token");

      const res = await fetch(`${api_url}bulk/visitor/add/info`, {
        method: "POST",
        // DO NOT set 'Content-Type' — let fetch set the multipart boundary
        // headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });

      // backend might return JSON or text; try to parse JSON but handle errors
      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch (e) {
        // not JSON
        data = { message: text };
      }

      if (!res.ok) {
        showAlert("Error", data?.message || "Failed to add visitor");
        console.error("Server error", data);
        return;
      }

      // Success
      setShowSuccessModal(true);
      // Reset fields
      setName("");
      setPhoneNumber("");
      setAddress("");
      setGender("");
      setVehicleType("");
      setVehicleNumber("KA");
      setPhoto(null);
      setPreviewUrl(null);
      setVehiclePhoto(null);
      setVehiclePhotoPreview(null);
    } catch (error) {
      console.error("Request Error:", error);
      showAlert("Error", "Something went wrong while adding visitor");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View contentContainerStyle={styles.container}>
      <View style={styles.grid}>
        <FillFormLeftColumn
          phoneNumber={phoneNumber}
          setPhoneNumber={setPhoneNumber}
          name={name}
          setName={setName}
          gender={gender}
          setGender={setGender}
          address={address}
          setAddress={setAddress}
          photo={photo}
          setPhoto={setPhoto}
          previewUrl={previewUrl}
          setPreviewUrl={setPreviewUrl}
        />

        <FillFormRightColumn
          vehicleType={vehicleType}
          setVehicleType={setVehicleType}
          vehicleNumber={vehicleNumber}
          setVehicleNumber={setVehicleNumber}
          vehiclePhoto={vehiclePhoto}
          setVehiclePhoto={setVehiclePhoto}
          vehiclePhotoPreview={vehiclePhotoPreview}
          setVehiclePhotoPreview={setVehiclePhotoPreview}
          status={status}
          setStatus={setStatus}
        />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting}
          style={[styles.submitBtn, submitting && styles.disabledBtn]}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Submit Form</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Text style={styles.successTitle}>Success!</Text>
            <Text style={styles.successMessage}>
              Visitor form has been submitted successfully.
            </Text>
            <TouchableOpacity
              onPress={() => setShowSuccessModal(false)}
              style={styles.okBtn}
            >
              <Text style={styles.okText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#fff" },
  grid: { flexDirection: "row", gap: 16, flexWrap: "wrap" as const },
  actions: { marginTop: 20, alignItems: "flex-end" as const },
  submitBtn: {
    backgroundColor: "#1eb88c",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
  },
  disabledBtn: { backgroundColor: "#9ea9a0" },
  submitText: { color: "#fff", fontWeight: "700" },
  modalWrap: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
  },
  successTitle: {
    fontSize: 20,
    color: "#16a34a",
    fontWeight: "800",
    marginBottom: 8,
  },
  successMessage: { color: "#374151", textAlign: "center", marginBottom: 16 },
  okBtn: {
    backgroundColor: "#16a34a",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 999,
  },
  okText: { color: "#fff", fontWeight: "700" },
});
