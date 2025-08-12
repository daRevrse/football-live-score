// src/services/socket.js
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000"; // adapte si besoin

// singleton socket pour toute l'application
export const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  // autoConnect: false, // décommenter si tu veux connecter manuellement
});

export default socket;
