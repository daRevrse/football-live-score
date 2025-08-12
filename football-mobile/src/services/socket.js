// src/services/socket.js
import { io } from "socket.io-client";

const SOCKET_URL = "http://192.168.1.65:5000"; // <--- adapte si besoin (IP de ton PC pour test device)

const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  autoConnect: true,
});

socket.on("connect", () => {
  console.log("Socket connected", socket.id);
});
socket.on("connect_error", (err) => {
  console.warn("Socket connect_error", err.message || err);
});
socket.on("reconnect_attempt", () => {
  console.log("Socket reconnecting...");
});

export default socket;
