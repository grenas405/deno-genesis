// roadmapRoutes.ts
import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import {
  getRoadmapItems,
  createRoadmapItem,
  updateRoadmapItem,
  deleteRoadmapItem,
} from "../controllers/roadmapController.ts";
import { verifyAdminToken } from "../middleware/authMiddleware.ts";

const router = new Router();

router
  .get("/", getRoadmapItems) // ✅ Public: View all roadmap items
  .post("/", verifyAdminToken, createRoadmapItem) // 🔒 Protected: Create
  .put("/:id", verifyAdminToken, updateRoadmapItem) // 🔒 Protected: Update
  .delete("/:id", verifyAdminToken, deleteRoadmapItem); // 🔒 Protected: Delete

export default router;
