import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { chatController } from "../controllers/aiAssistantController.ts";

const router = new Router();

// POST /api/chat — Send message to AI and store response
router.post("/chat", chatController);

export default router;