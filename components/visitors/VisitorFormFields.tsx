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
    <View style={[styles.container, isWide ? styles.row : styles.column]}>
      <View style={[isWide ? styles.half : styles.full]}>
        <VisitorFormLeftColumn {...props} />
      </View>

      <View style={[isWide ? styles.half : styles.full]}>
        <VisitorFormRightColumn {...props} isForApartment={isForApartment} />
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
});
