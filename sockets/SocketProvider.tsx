// sockets/SocketProvider.tsx
import { socketInstance } from "@/sockets/socketInstance";
import { useEffect } from "react";

import VisitorSocketHandler from "@/sockets/handler/VisitorSocketHandler";
// import BulkVisitorSocketHandler from "@/sockets/handler/BulkVisitorSocketHandler";
import CallSocketHandler from "@/sockets/handler/CallSocketHandler";
import NotificationSocketHandler from "@/sockets/handler/notificationSocketHandler";

export default function SocketProvider() {
  useEffect(() => {
    // 🔌 Connect socket
    socketInstance.connect();

    const onConnect = () => {
      console.log("✅ Socket connected:", socketInstance.id);
    };

    const onDisconnect = () => {
      console.warn("⚠️ Socket disconnected");
    };

    const onConnectError = (err: any) => {
      console.error("❌ Socket connection error:", err);
    };

    socketInstance.on("connect", onConnect);
    socketInstance.on("disconnect", onDisconnect);
    socketInstance.on("connect_error", onConnectError);

    return () => {
      socketInstance.off("connect", onConnect);
      socketInstance.off("disconnect", onDisconnect);
      socketInstance.off("connect_error", onConnectError);

      socketInstance.disconnect();
    };
  }, []);

  return (
    <>
      <VisitorSocketHandler />
      {/* <BulkVisitorSocketHandler /> */}
      <CallSocketHandler />
      <NotificationSocketHandler />
    </>
  );
}
