import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { websocketHandler } from "../controllers/wsController.ts";

const wsRouter = new Router();

// WebSocket endpoint → handles WebSocket upgrade requests
wsRouter.get("/api/ws", websocketHandler);

export default wsRouter;
