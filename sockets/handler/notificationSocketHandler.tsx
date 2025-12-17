// sockets/handler/notificationSocketHandler.tsx
import { socketInstance } from "@/sockets/socketInstance";
import { useEffect } from "react";

export default function NotificationSocketHandler() {
  useEffect(() => {
    const onNotificationChanged = (payload: {
      notificationId?: string;
      [key: string]: any;
    }) => {
      console.log("🔔 Notification changed:", payload);

      // 👉 Trigger global refetch / Zustand / Redux / React Query here
    };

    socketInstance.on("notification:changed", onNotificationChanged);

    return () => {
      socketInstance.off("notification:changed", onNotificationChanged);
    };
  }, []);

  return null;
}
