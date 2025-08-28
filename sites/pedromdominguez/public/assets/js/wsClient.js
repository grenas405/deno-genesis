// /assets/js/wsClient.js

import { showNotification } from './notifications.js';

let socket = null;

/**
 * Initialize the WebSocket connection
 */
export function initializeWebSocket(url = "wss://pedromdominguez.com/api/ws") {
  socket = new WebSocket(url);

  socket.onopen = () => {
    console.log("✅ WebSocket connected!");
    socket.send("Hello from client!");
  };

  socket.onmessage = (event) => {
    console.log("📩 Message from server:", event.data);

    let payload;

    try {
      // ✅ Parse if the message is valid JSON
      payload = JSON.parse(event.data);
    } catch (err) {
      console.warn("⚠️ Message is not JSON, using raw string.");
      payload = event.data;
    }

    // ✅ Decide how to display: if payload is an object, extract properties
    if (typeof payload === "object" && payload !== null) {
      const notifType = payload.type || "info";
      const notifMessage = payload.message || JSON.stringify(payload);
      const emoji =
        notifType === "success" ? "✅"
        : notifType === "info" ? "ℹ️"
        : notifType === "warning" ? "⚠️"
        : "❌";

      showNotification(`${emoji} ${notifMessage}`, notifType);
    } else {
      // ✅ If it's a plain string, just show it
      showNotification(payload, "info");
    }
  };

  socket.onclose = () => {
    console.log("❌ WebSocket disconnected.");
  };

  socket.onerror = (error) => {
    console.error("⚠️ WebSocket error:", error);
  };
}

/**
 * Send a WebSocket message
 * @param {string|object} message
 */
export function sendWebSocketMessage(message) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    let payload;

    // ✅ If object, stringify before sending
    if (typeof message === "object") {
      payload = JSON.stringify(message);
    } else {
      payload = message;
    }

    socket.send(payload);
    console.log(`🚀 Sent WebSocket message: ${payload}`);
  } else {
    console.warn("⚠️ WebSocket is not connected. Message not sent.");
  }
}
