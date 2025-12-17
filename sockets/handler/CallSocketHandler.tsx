// sockets/handler/CallSocketHandler.tsx
import { socketInstance } from "@/sockets/socketInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function CallSocketHandler() {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const initSocket = async () => {
      try {
        const rawSession = await AsyncStorage.getItem("upbuild_user_store");
        if (!rawSession || !isMounted) return;

        const session = JSON.parse(rawSession);
        const user = session?.state?.user;

        if (user?._id && user?.apartment && user?.userType) {
          const payload = {
            userId: user._id,
            apartmentId: user.apartment,
            userType: user.userType,
          };

          // ✅ Register user with socket
          socketInstance.emit("register-user", payload);

          // ✅ Listen for incoming call
          const onOffer = ({ from, offer }: any) => {
            console.log("📞 Incoming call:", from);

        //     router.push(
        //       `/apartment/call/incoming?userId=${from.userId}&apartmentId=${from.apartmentId}&userType=${from.userType}`
        //     );
          };

          socketInstance.on("offer", onOffer);

          // cleanup handler reference
          return () => {
            socketInstance.off("offer", onOffer);
          };
        }
      } catch (err) {
        console.error("❌ CallSocketHandler error:", err);
      }
    };

    const cleanupPromise = initSocket();

    return () => {
      isMounted = false;
      cleanupPromise?.then((cleanup) => cleanup?.());
    };
  }, []);

  return null;
}
