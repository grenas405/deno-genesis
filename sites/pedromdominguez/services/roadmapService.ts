// /services/roadmapService.ts
import { RoadmapModel } from "../models/roadmapModel.ts";
import { RoadmapItem, RoadmapItemInput } from "../types/roadmap.d.ts";

export class RoadmapService {
  static async getAll(): Promise<RoadmapItem[]> {
    return await RoadmapModel.getAll();
  }

  static async create(data: RoadmapItemInput): Promise<RoadmapItem> {
    return await RoadmapModel.create(data);
  }

  static async update(id: string, updates: Partial<RoadmapItemInput>): Promise<number> {
    return await RoadmapModel.update(id, updates);
  }

  static async delete(id: string): Promise<number> {
    return await RoadmapModel.delete(id);
  }
}