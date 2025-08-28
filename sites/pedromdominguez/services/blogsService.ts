// /services/blogsService.ts
import { BlogsModel } from "../models/blogsModel.ts";
import { BlogInput, BlogRecord } from "../types/blogs.d.ts";

export class BlogsService {
  static async getAll(): Promise<BlogRecord[]> {
    return await BlogsModel.getAllBlogs();
  }

  static async create(data: BlogInput): Promise<void> {
    return await BlogsModel.createBlog(data);
  }

  static async update(id: string, data: BlogInput): Promise<number> {
    return await BlogsModel.updateBlog(id, data);
  }

  static async delete(id: string): Promise<number> {
    return await BlogsModel.deleteBlog(id);
  }
}