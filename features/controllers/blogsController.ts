// /controllers/blogsController.ts
import { Context } from "https://deno.land/x/oak/mod.ts";
import { BlogsService } from "../services/blogsService.ts";
import { BlogInput } from "../types/blogs.d.ts";

export const getAllBlogs = async (ctx: Context) => {
  try {
    const blogs = await BlogsService.getAll();
    ctx.response.status = 200;
    ctx.response.body = blogs;
  } catch (err) {
    console.error("❌ Error fetching blogs:", err.message);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
};

export const createBlogPost = async (ctx: Context) => {
  try {
    const { value } = await ctx.request.body({ type: "json" });
    const { title, author, summary, content } = await value;

    if (!title || !author || !summary || !content) {
      ctx.response.status = 400;
      ctx.response.body = { error: "All fields are required." };
      return;
    }

    const blogData: BlogInput = { title, author, summary, content };
    await BlogsService.create(blogData);

    ctx.response.status = 201;
    ctx.response.body = { message: "Blog post created successfully." };
  } catch (err) {
    console.error("❌ Error creating blog:", err.message);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
};

export const updateBlogPost = async (ctx: Context) => {
  const blogId = ctx.params.id;

  try {
    const { value } = await ctx.request.body({ type: "json" });
    const { title, author, summary, content } = await value;

    if (!title || !author || !summary || !content) {
      ctx.response.status = 400;
      ctx.response.body = { error: "All fields are required." };
      return;
    }

    const blogData: BlogInput = { title, author, summary, content };
    const affected = await BlogsService.update(blogId!, blogData);

    if (affected === 0) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Blog post not found." };
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = { message: "Blog post updated successfully." };
  } catch (err) {
    console.error("❌ Error updating blog:", err.message);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
};

export const deleteBlogPost = async (ctx: Context) => {
  const blogId = ctx.params.id;

  try {
    const affected = await BlogsService.delete(blogId!);

    if (affected === 0) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Blog post not found or already deleted." };
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = { message: "Blog post deleted successfully." };
  } catch (err) {
    console.error("❌ Error deleting blog:", err.message);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
};