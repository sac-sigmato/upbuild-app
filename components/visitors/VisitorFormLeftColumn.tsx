// components/VisitorFormLeftColumn.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { api_url, img_url } from "../../utils/apiLocalhost";

export type VisitorFormLeftProps = {
  phoneNumber: string;
  setPhoneNumber: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  gender: string;
  setGender: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  photo: any | null;
  setPhoto: (p: any | null) => void;
  previewUrl: string | null;
  setPreviewUrl: (u: string | null) => void;
  visitorType: string;
  setVisitorType: (v: string) => void;
  customVisitorType: string;
  setCustomVisitorType: (v: string) => void;
};

export default function VisitorFormLeftColumn(props: VisitorFormLeftProps) {
  const {
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
    visitorType,
    setVisitorType,
    customVisitorType,
    setCustomVisitorType,
  } = props;

  const [matchedVisitors, setMatchedVisitors] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [roleName, setRoleName] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const phoneInputRef = useRef<TextInput>(null);

  // load roleName from AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const store = await AsyncStorage.getItem("upbuild_user_store");
        if (store) {
          const parsed = JSON.parse(store);
          setRoleName(parsed?.state?.user?.roleName || null);
        }
      } catch (err) {
        console.error("Failed to parse upbuild_user_store:", err);
      }
    })();
  }, []);

  // fetch matching visitors when phoneNumber changes
  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(async () => {
      try {
        const storedData = await AsyncStorage.getItem("upbuild_user_store");
        const apartmentId = storedData
          ? JSON.parse(storedData)?.state?.user?.apartment
          : null;
        const token = await AsyncStorage.getItem("token");

        if (!apartmentId) {
          console.error("Apartment ID missing");
          setMatchedVisitors([]);
          setShowSuggestions(false);
          return;
        }

        if (phoneNumber.length >= 1 && apartmentId && !isSelecting) {
          console.log("Fetching visitors for:", phoneNumber);
          const res = await fetch(`${api_url}visitor/search`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ apartmentId, phoneNumber }),
          });

          const text = await res.text();
          console.log("Raw API response:", text);

          const data = (() => {
            try {
              return JSON.parse(text);
            } catch {
              return null;
            }
          })();

          if (!res.ok) {
            console.error("API Error:", data || text);
            if (!mounted) return;
            setMatchedVisitors([]);
            setShowSuggestions(false);
            return;
          }

          if (!mounted) return;

          const visitors = data?.visitors || data?.data || data || [];
          console.log("Processed visitors:", visitors);

          setMatchedVisitors(Array.isArray(visitors) ? visitors : []);
          setShowSuggestions(Array.isArray(visitors) && visitors.length > 0);
          setHighlightedIndex(-1);
        } else {
          setMatchedVisitors([]);
          setShowSuggestions(false);
          setHighlightedIndex(-1);

          if (phoneNumber === "") {
            setName("");
            setGender("");
            setAddress("");
            setPhoto(null);
            setPreviewUrl(null);
            setVisitorType("");
            setCustomVisitorType("");
          }
        }
      } catch (err) {
        console.error("Error fetching visitors:", err);
        if (!mounted) return;
        setMatchedVisitors([]);
        setShowSuggestions(false);
      }
    }, 500);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [
    phoneNumber,
    setName,
    setGender,
    setAddress,
    setPhoto,
    setPreviewUrl,
    setVisitorType,
    setCustomVisitorType,
    isSelecting,
  ]);

  const nativeToast = (msg: string) => {
    if (Platform.OS === "android") {
      const ToastAndroid = require("react-native").ToastAndroid;
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    } else {
      Alert.alert("", msg);
    }
  };

  const pickImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        nativeToast("Permission to access photos is required.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        const name = uri.split("/").pop() || `photo_${Date.now()}.jpg`;
        const match = /\.(\w+)$/.exec(name);
        const ext = match ? match[1].toLowerCase() : "jpg";
        let type = "image/jpeg";
        if (ext === "png") type = "image/png";

        const fileInfo = await fetch(uri);
        const blob = await fileInfo.blob();
        const fileSizeMB = blob.size / (1024 * 1024);
        const maxSizeMB = 5;

        if (fileSizeMB > maxSizeMB) {
          nativeToast(`Photo exceeds 5MB limit (${fileSizeMB.toFixed(2)} MB).`);
          return;
        }

        const picked = { uri, name, type };
        setPhoto(picked);
        setPreviewUrl(uri);
      }
    } catch (err) {
      console.error("Image picker error:", err);
      nativeToast("Failed to pick image");
    }
  };

  const handleVisitorSelect = (visitor: any) => {
    console.log("Selected visitor:", visitor);
    setIsSelecting(true);

    setPhoneNumber(visitor.phoneNumber || "");
    setName(visitor.name || "");
    setAddress(visitor.address || "");
    setGender(visitor.gender || "");

    if (visitor.photo && visitor.photo.trim() !== "") {
      const fullPhotoUrl = `${img_url}${visitor.photo}`;
      console.log("Setting photo URL:", fullPhotoUrl);
      setPreviewUrl(fullPhotoUrl);
    } else {
      console.log("No photo available for visitor");
      setPreviewUrl(null);
    }

    setPhoto(null);
    setMatchedVisitors([]);
    setShowSuggestions(false);
    setHighlightedIndex(-1);

    setTimeout(() => {
      setIsSelecting(false);
    }, 1000);

    Keyboard.dismiss();
  };

  const handleKeyPress = (e: any) => {
    if (e.nativeEvent.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        Math.min(prev + 1, matchedVisitors.length - 1)
      );
    } else if (e.nativeEvent.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.nativeEvent.key === "Enter" && highlightedIndex >= 0) {
      handleVisitorSelect(matchedVisitors[highlightedIndex]);
    }
  };

  const handlePhoneFocus = () => {
    if (matchedVisitors.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Handle suggestion item press
  const handleSuggestionPress = (item: any) => {
    console.log("Tapped visitor:", item);
    handleVisitorSelect(item);
  };

  // Render suggestions using regular View instead of FlatList
  const renderSuggestions = () => {
    if (!showSuggestions || matchedVisitors.length === 0) return null;

    return (
      <View style={styles.suggestionsContainer}>
        <ScrollView
          style={styles.suggestionsScrollView}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled"
        >
          {matchedVisitors.map((item, index) => (
            <TouchableOpacity
              key={item._id || index}
              onPress={() => handleSuggestionPress(item)}
              onPressIn={() => setHighlightedIndex(index)}
              style={[
                styles.suggestionItem,
                index === highlightedIndex
                  ? styles.suggestionHighlighted
                  : null,
              ]}
              delayPressIn={0}
              activeOpacity={0.6}
            >
              <Text style={styles.suggestionText}>
                {item.name} - {item.phoneNumber}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Phone Number Field */}
      <View style={styles.phoneFieldContainer}>
        <Text style={styles.label}>*Visitor Phone Number</Text>
        <TextInput
          ref={phoneInputRef}
          style={styles.input}
          value={phoneNumber}
          onChangeText={(text) => {
            const cleanedText = text.replace(/[^0-9]/g, "").slice(0, 10);
            setPhoneNumber(cleanedText);
            setHighlightedIndex(-1);
            setIsSelecting(false);
          }}
          onKeyPress={handleKeyPress}
          onFocus={handlePhoneFocus}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
          maxLength={10}
        />

        {/* Suggestions Dropdown */}
        {renderSuggestions()}
      </View>

      {/* Rest of the form fields */}
      <View style={styles.formFieldsContainer}>
        {/* Visitor Name */}
        <View style={styles.field}>
          <Text style={styles.label}>*Visitor Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter visitor name"
          />
        </View>

        {/* Gender */}
        {/* Gender */}
        <View style={styles.field}>
          <Text style={styles.label}>*Gender</Text>

          <View style={styles.pillRow}>
            {["Male", "Female", "Others"].map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.pill, gender === g && styles.pillActive]}
                onPress={() => setGender(g)}
              >
                <Text
                  style={[
                    styles.pillText,
                    gender === g && styles.pillTextActive,
                  ]}
                >
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Address */}
        <View style={styles.field}>
          <Text style={styles.label}>*Visitor Address</Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            value={address}
            onChangeText={setAddress}
            placeholder="Enter address"
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Visitor Photo */}
        <View style={styles.field}>
          <Text style={styles.label}>Visitor Photo</Text>
          <View style={styles.row}>
            <TouchableOpacity style={styles.smallBtn} onPress={pickImage}>
              <Text style={styles.smallBtnText}>Pick Photo</Text>
            </TouchableOpacity>

            {previewUrl ? (
              <View style={styles.previewWrap}>
                <Image source={{ uri: previewUrl }} style={styles.preview} />
                <TouchableOpacity
                  onPress={() => {
                    setPhoto(null);
                    setPreviewUrl(null);
                  }}
                  style={{ marginTop: 6 }}
                >
                  <Text style={styles.removeText}>Remove Photo</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>

        {/* Visitor Type */}
        {/* Visitor Type */}
        <View style={styles.field}>
          <Text style={styles.label}>*Visitor Type</Text>

          <View style={styles.pillRow}>
            {["Visitor", "Delivery", "Service", "Others"].map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.pill, visitorType === t && styles.pillActive]}
                onPress={() => setVisitorType(t)}
              >
                <Text
                  style={[
                    styles.pillText,
                    visitorType === t && styles.pillTextActive,
                  ]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  phoneFieldContainer: {
    marginBottom: 12,
    position: "relative",
    zIndex: 1000,
  },
  formFieldsContainer: {
    zIndex: 1,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: "#374151",
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
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 as any },
  smallBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#1eb88c",
    borderRadius: 8,
  },
  smallBtnText: { color: "#fff", fontWeight: "700" },
  previewWrap: { marginLeft: 12, alignItems: "center" },
  preview: { width: 96, height: 96, borderRadius: 8 },
  removeText: { color: "#ef4444", fontSize: 13 },

  // Suggestions styles
  suggestionsContainer: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    zIndex: 1001,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 15,
    maxHeight: 200,
    marginTop: 4,
  },
  suggestionsScrollView: {
    maxHeight: 200,
  },
  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  suggestionHighlighted: {
    backgroundColor: "#e6f0ff",
  },
  suggestionText: {
    color: "#111827",
    fontSize: 14,
  },

  pickerWrap: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  pillRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },

  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
  },

  pillActive: {
    backgroundColor: "#1EB88C",
  },

  pillText: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "500",
  },

  pillTextActive: {
    color: "#FFFFFF",
  },

  uploadBtn: {
    backgroundColor: "#1EB88C",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },

  uploadText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
});
