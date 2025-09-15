import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { authLogin } from "../controllers/authController.ts";

const router = new Router();

// === ROUTES ===

// 🔓 Public: Admin login
router.post("/login", authLogin);

export default router;