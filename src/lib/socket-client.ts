import { io, Socket } from "socket.io-client";
import { ServerToClientEvents, ClientToServerEvents } from "./socket-events";

// Instantiate the strictly typed socket
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
  autoConnect: false, // We connect manually when needed
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});
