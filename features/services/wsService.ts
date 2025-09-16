// services/wsService.ts

// ✅ In-memory store of active WebSocket clients
const clients = new Set<WebSocket>();

/**
 * Register a WebSocket client
 * @param ws WebSocket connection
 */
export function registerClient(ws: WebSocket) {
  clients.add(ws);
  console.log(`➕ Client registered. Total clients: ${clients.size}`);

  ws.addEventListener("close", () => {
    unregisterClient(ws);
  });

  ws.addEventListener("error", (err) => {
    console.error(`⚠️ WS client error:`, err);
    unregisterClient(ws);
  });
}

/**
 * Unregister a WebSocket client
 * @param ws WebSocket connection
 */
export function unregisterClient(ws: WebSocket) {
  if (clients.has(ws)) {
    clients.delete(ws);
    console.log(`➖ Client unregistered. Total clients: ${clients.size}`);
  }
}

/**
 * Broadcast a payload to all connected clients.
 * Always stringify payload to avoid [object Object] bugs.
 * @param payload The message payload to broadcast
 */
export function broadcast(payload: Record<string, unknown> | string) {
  let message: string;

  // ✅ If it's already a string, use it directly
  if (typeof payload === "string") {
    message = payload;
  } else {
    // ✅ Otherwise, convert to JSON string
    message = JSON.stringify(payload);
  }

  console.log(`📢 Broadcasting to ${clients.size} clients: ${message}`);

  for (const ws of clients) {
    try {
      ws.send(message);
    } catch (err) {
      console.error(`⚠️ Error sending message to client: ${err}`);
      unregisterClient(ws);
    }
  }
}

/**
 * Get the number of currently connected WebSocket clients
 */
export function getConnectedClientCount(): number {
  return clients.size;
}