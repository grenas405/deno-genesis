import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import {
  submitAppointment,
  fetchAppointments,
  deleteAppointment,
} from "../controllers/appointmentController.ts";
import { verifyAdminToken } from "../middleware/authMiddleware.ts";

const router = new Router();

// === ROUTES ===

// 🔓 Public: Submit an appointment
router.post("/", submitAppointment);

// 🔒 Admin: Fetch all appointments
router.get("/", verifyAdminToken, fetchAppointments);

// 🔒 Admin: Delete an appointment by ID
router.delete("/:id", verifyAdminToken, deleteAppointment);

export default router;
