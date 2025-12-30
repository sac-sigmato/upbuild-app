"use client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { api_url } from "../../utils/apiLocalhost";
import VisitorFormFields from "./VisitorFormFields";

// Helper toast
const nativeToast = (msg: string) => {
  if (Platform.OS === "android") {
    const ToastAndroid = require("react-native").ToastAndroid;
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  } else {
    Alert.alert("", msg);
  }
};

const getCurrentISTISOString = (): string => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 330 - now.getTimezoneOffset());
  return now.toISOString();
};

export default function AddVisitorForm() {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState("");
  const [visitorType, setVisitorType] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("KA");
  const [flatId, setFlatId] = useState("");
  const [clockInTime, setClockInTime] = useState(getCurrentISTISOString());
  const [photo, setPhoto] = useState<any | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [vehiclePhoto, setVehiclePhoto] = useState<any | null>(null);
  const [vehiclePhotoPreview, setVehiclePhotoPreview] = useState<string | null>(
    null
  );
  const [flats, setFlats] = useState<any[]>([]);
  const [status, setStatus] = useState("Awaiting");
  const [purpose, setPurpose] = useState("");
  const [customVisitorType, setCustomVisitorType] = useState("");
  const [scheduleDate, setScheduleDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [scheduleFrom, setScheduleFrom] = useState("");
  const [scheduleTo, setScheduleTo] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  // fetch flats using AsyncStorage token + persisted store (upbuild_user_store)
  useEffect(() => {
    const fetchFlats = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const storedData = await AsyncStorage.getItem("upbuild_user_store");
        const apartmentId = storedData
          ? JSON.parse(storedData)?.state?.user?.apartment
          : null;

        if (!apartmentId) {
          nativeToast("Apartment ID missing");
          return;
        }

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

        if (!res.ok) {
          const message = data?.message || text || `Status ${res.status}`;
          throw new Error(message);
        }

        setFlats(data?.flats || []);
      } catch (err: any) {
        console.error("Failed to load flats:", err);
        nativeToast("Failed to load flats");
      }
    };

    fetchFlats();
  }, []);

  // image picker helpers - useCallback to prevent re-renders
  const pickImage = useCallback(
    async (
      setImage: (img: any | null) => void,
      setPreview: (url: string | null) => void
    ) => {
      // request permissions
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        nativeToast("Permission to access media is required!");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        const name = uri.split("/").pop() ?? `photo_${Date.now()}.jpg`;
        const match = /\.(\w+)$/.exec(name);
        const ext = match ? match[1].toLowerCase() : "jpg";
        let type = "image/jpeg";
        if (ext === "png") type = "image/png";

        const imageObject = { uri, name, type };
        setImage(imageObject);
        setPreview(uri);
      }
    },
    []
  );

  // Handle preview URLs when photos are set
  useEffect(() => {
    if (photo?.uri) {
      setPreviewUrl(photo.uri);
    }
  }, [photo]);

  useEffect(() => {
    if (vehiclePhoto?.uri) {
      setVehiclePhotoPreview(vehiclePhoto.uri);
    }
  }, [vehiclePhoto]);

  const handleSubmit = async () => {
    console.log({
      name,
      flatId,
      visitorType,
      phoneNumber,
      address,
      ...(visitorType === "Other" && { customVisitorType }),
    });

    if (
      !name ||
      !visitorType ||
      !phoneNumber ||
      !address ||
      (visitorType === "Other" && !customVisitorType.trim()) ||
      (visitorType !== "For Apartment" && !flatId)
    ) {
      nativeToast("Please fill in all required fields.");
      return;
    }

    try {
      if (loading) return;
      setLoading(true);

      const token = await AsyncStorage.getItem("token");
      const storedData = await AsyncStorage.getItem("upbuild_user_store");
      const apartmentId = storedData
        ? JSON.parse(storedData)?.state?.user?.apartment
        : null;
      if (!apartmentId) {
        nativeToast("Apartment ID missing");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("name", name);
      formData.append("phoneNumber", phoneNumber);
      formData.append("address", address);
      formData.append("gender", gender);
      formData.append(
        "visitorType",
        visitorType === "Other" ? customVisitorType : visitorType
      );
      formData.append("vehicleType", vehicleType);
      formData.append("vehicleNumber", vehicleNumber);
      if (visitorType !== "For Apartment") {
        formData.append("flatId", flatId);
      }
      formData.append("clockInTime", clockInTime);
      formData.append("apartmentId", apartmentId);
      formData.append("status", status);
      formData.append("purpose", purpose);

      console.log("scheduleDate", scheduleDate);

      if (scheduleDate) formData.append("scheduleDate", scheduleDate);
      if (scheduleFrom) formData.append("scheduleFrom", scheduleFrom);
      if (scheduleTo) formData.append("scheduleTo", scheduleTo);

      if (photo) {
        formData.append("photo", {
          uri: photo.uri,
          name: photo.name,
          type: photo.type,
        } as any);
      }
      if (vehiclePhoto) {
        formData.append("vehiclePhoto", {
          uri: vehiclePhoto.uri,
          name: vehiclePhoto.name,
          type: vehiclePhoto.type,
        } as any);
      }

      // console.log(
      //   "Submitting Visitor Form:",
      //   Object.fromEntries(
      //     Array.from(formData.entries()).map(([key, value]) => [
      //       key,
      //       value instanceof Object
      //         ? `File: ${value.name || "unknown"}`
      //         : value,
      //     ])
      //   )
      // );

      const res = await fetch(`${api_url}visitor/add`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "Content-Type": "multipart/form-data",
        },
        body: formData,
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
        const message = data?.message || text || `Status ${res.status}`;
        nativeToast(message);
        console.error("Backend Error:", data || text);
        setLoading(false);
        return;
      }

      nativeToast("Visitor added successfully");

      // Reset all fields (matching web behavior)
      setName("");
      setPhoneNumber("");
      setAddress("");
      setGender("");
      setVisitorType("");
      setVehicleType("");
      setVehicleNumber("KA");
      setFlatId("");
      setClockInTime(getCurrentISTISOString());
      setPhoto(null);
      setPreviewUrl(null);
      setVehiclePhoto(null);
      setVehiclePhotoPreview(null);
      setPurpose("");
      setScheduleDate(new Date().toISOString().split("T")[0]);
      setScheduleFrom("");
      setScheduleTo("");
      setCustomVisitorType("");

      router.push("/visitors");
    } catch (err: any) {
      console.error("Request Error:", err);
      nativeToast("Something went wrong while adding visitor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <VisitorFormFields
        name={name}
        setName={setName}
        phoneNumber={phoneNumber}
        setPhoneNumber={setPhoneNumber}
        address={address}
        setAddress={setAddress}
        gender={gender}
        setGender={setGender}
        visitorType={visitorType}
        setVisitorType={setVisitorType}
        vehicleType={vehicleType}
        setVehicleType={setVehicleType}
        vehicleNumber={vehicleNumber}
        setVehicleNumber={setVehicleNumber}
        flatId={flatId}
        setFlatId={setFlatId}
        clockInTime={clockInTime}
        setClockInTime={setClockInTime}
        photo={photo}
        setPhoto={setPhoto}
        previewUrl={previewUrl}
        setPreviewUrl={setPreviewUrl}
        vehiclePhoto={vehiclePhoto}
        setVehiclePhoto={setVehiclePhoto}
        vehiclePhotoPreview={vehiclePhotoPreview}
        setVehiclePhotoPreview={setVehiclePhotoPreview}
        flats={flats}
        status={status}
        setStatus={setStatus}
        purpose={purpose}
        setPurpose={setPurpose}
        scheduleDate={scheduleDate}
        setScheduleDate={setScheduleDate}
        scheduleFrom={scheduleFrom}
        setScheduleFrom={setScheduleFrom}
        scheduleTo={scheduleTo}
        setScheduleTo={setScheduleTo}
        customVisitorType={customVisitorType}
        setCustomVisitorType={setCustomVisitorType}
        pickImage={pickImage}
      />

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.btn, styles.btnOutline]}
        >
          <Text style={styles.btnOutlineText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={[styles.btn, loading ? styles.btnDisabled : styles.btnPrimary]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Add Visitor</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // padding: 16,
    paddingBottom: 80,
    backgroundColor: "#f3f6f7",
  },
  label: {
    fontSize: 13,
    color: "#374151",
    marginTop: 12,
    marginBottom: 6,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  smallBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#1eb88c",
    borderRadius: 8,
  },
  smallBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginLeft: 8,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
    gap: 8,
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 999,
    minWidth: 110,
    alignItems: "center",
    justifyContent: "center",
  },
  btnOutline: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#3b414e",
  },
  btnOutlineText: {
    color: "#3b414e",
    fontWeight: "700",
    fontSize: 14,
  },
  btnPrimary: {
    backgroundColor: "#1eb88c",
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  btnDisabled: {
    opacity: 0.6,
    backgroundColor: "#9ca3af",
  },
});
