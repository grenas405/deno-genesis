import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import {
  submitContactMessage,
  fetchContactMessages,
  deleteContactMessage,
} from "../controllers/contactController.ts";
import { verifyAdminToken } from "../middleware/authMiddleware.ts";

const router = new Router();

// === ROUTES ===

// 🔓 Public: Submit a contact form message
router.post("/", submitContactMessage);

// 🔒 Admin: Fetch all contact messages
router.get("/", fetchContactMessages);

// 🔒 Admin: Delete a contact message by ID
router.delete("/:id", verifyAdminToken, deleteContactMessage);

export default router;
