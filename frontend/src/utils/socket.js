import { io } from "socket.io-client";

// Get socket URL from env or fallback to localhost
const SOCKET_URL = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace("/api", "")
    : "http://localhost:5000";

// Connect to socket server
const socket = io(SOCKET_URL, {
    autoConnect: false, // Don't connect until multiplayer is opened
});

export default socket;
