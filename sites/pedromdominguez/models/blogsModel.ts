// /models/blogsModel.ts
import { db } from "../database/client.ts";
import { SITE_KEY } from "../config/env.ts";
import { BlogInput, BlogRecord } from "../types/blogs.d.ts";

export class BlogsModel {
  static async getAllBlogs(): Promise<BlogRecord[]> {
    const result = await db.execute(
      "SELECT * FROM blogs WHERE site_key = ? ORDER BY created_at DESC",
      [SITE_KEY],
    );
    return result.rows as BlogRecord[] ?? [];
  }

  static async createBlog(data: BlogInput): Promise<void> {
    await db.execute(
      `INSERT INTO blogs (site_key, title, author, summary, content)
       VALUES (?, ?, ?, ?, ?)`,
      [SITE_KEY, data.title, data.author, data.summary, data.content],
    );
  }

  static async updateBlog(id: string, data: BlogInput): Promise<number> {
    const result = await db.execute(
      `UPDATE blogs
       SET title = ?, author = ?, summary = ?, content = ?, updated_at = NOW()
       WHERE id = ? AND site_key = ?`,
      [data.title, data.author, data.summary, data.content, id, SITE_KEY],
    );
    return result.affectedRows || 0;
  }

  static async deleteBlog(id: string): Promise<number> {
    const result = await db.execute(
      "DELETE FROM blogs WHERE id = ? AND site_key = ?",
      [id, SITE_KEY],
    );
    return result.affectedRows || 0;
  }
}
