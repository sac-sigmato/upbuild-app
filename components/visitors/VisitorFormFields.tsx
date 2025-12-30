// components/VisitorFormFields.tsx
import React, { useEffect } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import VisitorFormLeftColumn from "./VisitorFormLeftColumn";
import VisitorFormRightColumn from "./VisitorFormRightColumn";
import type { VisitorFormFieldsProps } from "./visitorFormTypes";

/**
 * VisitorFormFields (React Native)
 * - props: same shape as web VisitorFormFieldsProps
 * - Renders left & right columns. On narrow screens they stack vertically.
 */
export default function VisitorFormFields(props: VisitorFormFieldsProps) {
  const {
    vehicleType,
    setVehicleNumber,
    setVehiclePhoto,
    setVehiclePhotoPreview,
    visitorType,
  } = props;

  // Reset vehicle fields if type is "None" - matches web behavior
  useEffect(() => {
    if (vehicleType === "None") {
      setVehicleNumber?.("");
      setVehiclePhoto?.(null);
      setVehiclePhotoPreview?.(null);
    }
  }, [vehicleType, setVehicleNumber, setVehiclePhoto, setVehiclePhotoPreview]);

  const isForApartment = visitorType === "For Apartment";

  const { width } = useWindowDimensions();
  const isWide = width >= 768; // md breakpoint equivalent

  return (
    <View style={styles.page}>
      <View style={styles.card}>
        {/* <Text style={styles.cardTitle}>Add Visitor</Text> */}

        <View style={[styles.container, isWide ? styles.row : styles.column]}>
          <View style={[isWide ? styles.half : styles.full]}>
            <VisitorFormLeftColumn {...props} />
          </View>

          <View style={[isWide ? styles.half : styles.full]}>
            <VisitorFormRightColumn
              {...props}
              isForApartment={isForApartment}
            />
          </View>
        </View>

        {/* <TouchableOpacity style={styles.submitBtn}>
          <Text style={styles.submitText}>Create Visitor</Text>
        </TouchableOpacity> */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
  },
  column: {
    flexDirection: "column",
  },
  half: {
    flex: 1,
  },
  full: {
    width: "100%",
  },
  page: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    margin: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 16,
  },

  submitBtn: {
    marginTop: 24,
    backgroundColor: "#1EB88C",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  submitText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
