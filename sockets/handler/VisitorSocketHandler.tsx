// sockets/handler/VisitorSocketHandler.tsx
import OccupantResponseModal from "@/components/visitors/OccupantResponseModal";
import { socketInstance } from "@/sockets/socketInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import Toast from "react-native-toast-message";

export default function VisitorSocketHandler() {
  const [showOccupantModal, setShowOccupantModal] = useState(false);
  const [occupantModalVisitorId, setOccupantModalVisitorId] = useState<
    string | null
  >(null);

  const modalOpenRef = useRef(false);
  modalOpenRef.current = showOccupantModal;

  /* ⏱ Auto-close after 60 seconds */
  useEffect(() => {
    let autoCloseTimer: ReturnType<typeof setTimeout>;

    if (showOccupantModal && occupantModalVisitorId) {
      autoCloseTimer = setTimeout(() => {
        setShowOccupantModal(false);
        setOccupantModalVisitorId(null);

        Toast.show({
          type: "info",
          text1: "Visitor modal closed",
          text2: "Closed after 1 minute of inactivity",
        });
      }, 60000);
    }

    return () => {
      if (autoCloseTimer) clearTimeout(autoCloseTimer);
    };
  }, [showOccupantModal, occupantModalVisitorId]);

  /* 🔌 Socket registration + listeners */
  useEffect(() => {
    let isMounted = true;

    const initSocket = async () => {
      try {
        const rawSession = await AsyncStorage.getItem("upbuild_user_store");
        if (!rawSession || !isMounted) return;

        const session = JSON.parse(rawSession);
        const user = session?.state?.user;

        if (!user?.flat || !user?.apartment || !user?._id) return;

        socketInstance.emit(
          "register-flat",
          {
            apartmentId: user.apartment,
            flatId: user.flat,
            userId: user._id,
          },
          (res: { success: boolean; reason?: string }) => {
            if (!res.success) {
              console.warn("❌ Not registered for flat:", res.reason);
              return;
            }

            /* 🧍 New Visitor */
            const onNewVisitor = ({
              visitorLogId,
              flatId,
              apartmentId,
            }: any) => {
              if (user.flat === flatId && user.apartment === apartmentId) {
                setOccupantModalVisitorId(visitorLogId);
                setShowOccupantModal(true);
              }
            };

            /* ✅ Visitor responded by someone else */
            const onVisitorResponseRecorded = ({ response }: any) => {
              if (modalOpenRef.current) {
                setShowOccupantModal(false);
                setOccupantModalVisitorId(null);

                Toast.show({
                  type: "success",
                  text1: "Visitor updated",
                  text2: `Visitor ${response.toLowerCase()} by another occupant`,
                });
              }
            };

            socketInstance.on("new-visitor", onNewVisitor);
            socketInstance.on(
              "visitor-response-recorded",
              onVisitorResponseRecorded
            );

            // cleanup references
            return () => {
              socketInstance.off("new-visitor", onNewVisitor);
              socketInstance.off(
                "visitor-response-recorded",
                onVisitorResponseRecorded
              );
            };
          }
        );
      } catch (err) {
        console.error("❌ VisitorSocketHandler error:", err);
      }
    };

    const cleanupPromise = initSocket();

    return () => {
      isMounted = false;
      cleanupPromise?.then((cleanup) => cleanup?.());
    };
  }, []);

  return (
    <OccupantResponseModal
      visitorId={occupantModalVisitorId ?? ""}
      isOpen={showOccupantModal}
      onClose={() => {
        setShowOccupantModal(false);
        setOccupantModalVisitorId(null);
      }}
      onStatusChange={() => {}}
    />
  );
}
