// /models/projectsModel.ts
import { db } from "../database/client.ts";
import { SITE_KEY } from "../config/env.ts";
import { ProjectInput, ProjectUpdateInput, ProjectRecord } from "../types/projects.d.ts";

export class ProjectsModel {
  static async getAll(): Promise<ProjectRecord[]> {
    const result = await db.execute(
      "SELECT * FROM projects WHERE site_key = ? ORDER BY created_at DESC",
      [SITE_KEY],
    );
    return result.rows as ProjectRecord[] ?? [];
  }

  static async create(data: ProjectInput): Promise<void> {
    await db.execute(
      `INSERT INTO projects (site_key, title, image, description, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [SITE_KEY, data.title, data.image, data.description],
    );
  }

  static async update(id: string, data: ProjectUpdateInput): Promise<number> {
    const query = data.image
      ? `UPDATE projects SET title = ?, image = ?, description = ?, updated_at = NOW()
         WHERE id = ? AND site_key = ?`
      : `UPDATE projects SET title = ?, description = ?, updated_at = NOW()
         WHERE id = ? AND site_key = ?`;

    const params = data.image
      ? [data.title, data.image, data.description, id, SITE_KEY]
      : [data.title, data.description, id, SITE_KEY];

    const result = await db.execute(query, params);
    return result.affectedRows || 0;
  }

  static async delete(id: string): Promise<number> {
    const result = await db.execute(
      "DELETE FROM projects WHERE id = ? AND site_key = ?",
      [id, SITE_KEY],
    );
    return result.affectedRows || 0;
  }
}
