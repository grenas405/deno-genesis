import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import {
  getAllBlogs,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from "../controllers/blogController.ts";
import { verifyAdminToken } from "../middleware/authMiddleware.ts";

const router = new Router();

// GET /api/blogs (public)
router.get("/", getAllBlogs);

// POST /api/blogs (admin protected)
router.post("/", verifyAdminToken, createBlogPost);

// PUT /api/blogs/:id (admin protected)
router.put("/:id", verifyAdminToken, updateBlogPost);

// DELETE /api/blogs/:id (admin protected)
router.delete("/:id", verifyAdminToken, deleteBlogPost);

export default router;
