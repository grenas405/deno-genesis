// /models/roadmapModel.ts
import { Bson } from "https://deno.land/x/mongo@v0.31.1/mod.ts";
import { roadmapCollection } from "../config/mongo.ts";
import { RoadmapItem, RoadmapItemInput } from "../types/roadmap.d.ts";

export class RoadmapModel {
  static async getAll(): Promise<RoadmapItem[]> {
    return await roadmapCollection.find({}).toArray();
  }

  static async create(data: RoadmapItemInput): Promise<RoadmapItem> {
    const newItem = {
      ...data,
      status: data.status || "planned",
      priority: data.priority || "medium",
      targetRelease: data.targetRelease || "TBD",
      tags: data.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const insertId = await roadmapCollection.insertOne(newItem);
    return { _id: insertId, ...newItem };
  }

  static async update(id: string, updates: Partial<RoadmapItemInput>): Promise<number> {
    const { matchedCount } = await roadmapCollection.updateOne(
      { _id: new Bson.ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } },
    );
    return matchedCount;
  }

  static async delete(id: string): Promise<number> {
    const deleteCount = await roadmapCollection.deleteOne({
      _id: new Bson.ObjectId(id),
    });
    return deleteCount;
  }
}
