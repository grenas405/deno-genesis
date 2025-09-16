// /services/projectsService.ts
import { ProjectsModel } from "../models/projectsModel.ts";
import { ProjectInput, ProjectUpdateInput, ProjectRecord } from "../types/projects.d.ts";

export class ProjectsService {
  static async getAll(): Promise<ProjectRecord[]> {
    return await ProjectsModel.getAll();
  }

  static async create(data: ProjectInput): Promise<void> {
    await ProjectsModel.create(data);
  }

  static async update(id: string, data: ProjectUpdateInput): Promise<number> {
    return await ProjectsModel.update(id, data);
  }

  static async delete(id: string): Promise<number> {
    return await ProjectsModel.delete(id);
  }
}