import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import {
  getAllProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../controllers/projectsController.ts";
import { verifyAdminToken } from "../middleware/authMiddleware.ts";
import { parseProjectFormData } from "../middleware/uploadMiddleware.ts";

const router = new Router();

// === ROUTES ===

// 🔓 Public: Get all projects
router.get("/", getAllProjects);

// 🔒 Admin: Create new project with file upload
router.post("/", verifyAdminToken, parseProjectFormData, createProject);

// 🔒 Admin: Update project with optional file upload
router.put("/:id", verifyAdminToken, parseProjectFormData, updateProject);

// 🔒 Admin: Delete project
router.delete("/:id", verifyAdminToken, deleteProject);

export default router;