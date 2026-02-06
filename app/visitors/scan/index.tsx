import {
        BarcodeScanningResult,
        CameraView,
        useCameraPermissions,
} from "expo-camera";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
        ActivityIndicator,
        StyleSheet,
        Text,
        TouchableOpacity,
        View,
} from "react-native";

import UpdateBulkVisitorStatusModal from "@/components/visitors/bulkVisitor/fillForm/UpdateBulkVisitorStatusModal";
import UpdateVisitorStatusModal from "@/components/visitors/UpdateVisitorStatusModal";

export default function VisitorQrScannerPage() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraActive, setCameraActive] = useState(true);

  const [selectedVisitorId, setSelectedVisitorId] = useState<string | null>(
    null,
  );
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showVisitorModal, setShowVisitorModal] = useState(false);

  const scanningLocked = useRef(false);

  /* ---------- Permissions ---------- */
  useEffect(() => {
    (async () => {
      const status = await requestPermission();
      setHasPermission(status.granted);
    })();
  }, []);

  /* ---------- QR HANDLER ---------- */
  const onBarcodeScanned = (result: BarcodeScanningResult) => {
    if (scanningLocked.current) return;

    scanningLocked.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const parsed = JSON.parse(result.data);
      console.log("📦 QR payload:", parsed);

      if (parsed.bulkId && parsed.visitorId) {
        setSelectedVisitorId(parsed.visitorId);
        setShowBulkModal(true);
        setCameraActive(false);
      } else if (parsed.logId && parsed.visitorId) {
        setSelectedVisitorId(parsed.logId); // ✅ SAME AS WEB
        setShowVisitorModal(true);
        setCameraActive(false);
      } else {
        scanningLocked.current = false;
      }
    } catch (e) {
      console.warn("❌ Invalid QR:", result.data);
      scanningLocked.current = false;
    }
  };

  /* ---------- RESET ---------- */
  const resetAndRescan = () => {
    setShowBulkModal(false);
    setShowVisitorModal(false);
    setSelectedVisitorId(null);

    scanningLocked.current = false;
    setCameraActive(true);
  };

  /* ---------- STATES ---------- */
  if (hasPermission === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1eb88c" />
        <Text>Requesting camera permission…</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Text>Camera permission denied</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {cameraActive && !showBulkModal && !showVisitorModal && (
        <View style={styles.scannerCard}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
            onBarcodeScanned={onBarcodeScanned}
          />

          {/* Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.backBtn]}
              onPress={() => router.back()}
            >
              <Text style={styles.btnText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.scanBtn]}
              onPress={resetAndRescan}
            >
              <Text style={styles.btnText}>Scan Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* BULK VISITOR MODAL */}
      {selectedVisitorId && showBulkModal && (
        <UpdateBulkVisitorStatusModal
          visitorId={selectedVisitorId}
          isOpen={showBulkModal}
          onClose={resetAndRescan}
          onStatusChange={resetAndRescan}
        />
      )}

      {/* NORMAL VISITOR MODAL */}
      {selectedVisitorId && showVisitorModal && (
        <UpdateVisitorStatusModal
          visitorId={selectedVisitorId}
          isOpen={showVisitorModal}
          onClose={resetAndRescan}
          onStatusChange={resetAndRescan}
        />
      )}
    </View>
  );
}

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f6f7",
    justifyContent: "center",
    alignItems: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  scannerCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    width: "90%",
    maxWidth: 380,
  },
  camera: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
  },
  backBtn: {
    backgroundColor: "#ef4444",
  },
  scanBtn: {
    backgroundColor: "#1eb88c",
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
  },
});
