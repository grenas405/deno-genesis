import { Router, Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import {
  getAllBlogs,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from "../controllers/blogsController.ts";
import { verifyAdminToken } from "../middleware/authMiddleware.ts";

const router = new Router();

// GET /api/blogs (public)
router.get("/", async (ctx: Context) => {
  await getAllBlogs(ctx);
});

// POST /api/blogs (admin protected)
router.post("/", verifyAdminToken, async (ctx: Context) => {
  await createBlogPost(ctx);
});

// PUT /api/blogs/:id (admin protected)
router.put("/:id", verifyAdminToken, async (ctx: Context) => {
  await updateBlogPost(ctx);
});

// DELETE /api/blogs/:id (admin protected)
router.delete("/:id", verifyAdminToken, async (ctx: Context) => {
  await deleteBlogPost(ctx);
});

export default router;