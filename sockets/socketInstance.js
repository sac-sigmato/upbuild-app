// sockets/socketInstance.ts
import { io } from "socket.io-client";
import { socket_url } from "../utils/apiLocalhost";

export const socketInstance = io(socket_url, {
  autoConnect: false,
  transports: ["websocket"],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});