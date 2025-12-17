// sockets/AuthenticatedSocketHandlers.tsx
import CallSocketHandler from "@/sockets/handler/CallSocketHandler";
import NotificationSocketHandler from "@/sockets/handler/notificationSocketHandler";
import VisitorSocketHandler from "@/sockets/handler/VisitorSocketHandler";

export default function AuthenticatedSocketHandlers() {
  return (
    <>
      <VisitorSocketHandler />
      <CallSocketHandler />
      <NotificationSocketHandler />
    </>
  );
}
