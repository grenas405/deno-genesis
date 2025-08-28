import { registerClient, unregisterClient, broadcast } from "../services/wsService.ts";

export async function websocketHandler(ctx: any) {
  if (ctx.isUpgradable) {
    const ws = await ctx.upgrade();
    console.log("✅ WebSocket connection established.");

    registerClient(ws);

    ws.addEventListener("message", (event) => {
      if (typeof event.data === "string") {
        console.log(`💬 Received: ${event.data}`);
        // Optional: broadcast to all clients
        //broadcast(`📢 Broadcast: ${event.data}`);
      }
    });

    ws.addEventListener("close", () => {
      console.log("❌ WebSocket closed");
      unregisterClient(ws);
      console.log("🗑️ Client unregistered.");
    });

    ws.addEventListener("error", (err) => {
      console.error(`WebSocket error:`, err);
    });
  } else {
    ctx.throw(400, "WebSocket upgrade required");
  }
}
