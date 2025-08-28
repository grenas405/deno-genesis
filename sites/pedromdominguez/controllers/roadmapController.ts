// /controllers/roadmapController.ts
import { Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { RoadmapService } from "../services/roadmapService.ts";
import { RoadmapItemInput } from "../types/roadmap.d.ts";

export const getRoadmapItems = async (ctx: Context) => {
  try {
    const items = await RoadmapService.getAll();
    ctx.response.status = 200;
    ctx.response.body = items;
  } catch (error) {
    ctx.throw(500, `Error fetching roadmap: ${error.message}`);
  }
};

export const createRoadmapItem = async (ctx: Context) => {
  try {
    const body = await ctx.request.body().value;
    const { title, description, status, priority, targetRelease, tags } = body;

    if (!title || !description) {
      ctx.throw(400, "Title and description are required");
    }

    const input: RoadmapItemInput = { title, description, status, priority, targetRelease, tags };
    const newItem = await RoadmapService.create(input);

    ctx.response.status = 201;
    ctx.response.body = newItem;
  } catch (error) {
    ctx.throw(500, `Failed to create roadmap item: ${error.message}`);
  }
};

export const updateRoadmapItem = async (ctx: Context) => {
  try {
    const id = ctx.params.id!;
    const updates = await ctx.request.body().value;

    const matched = await RoadmapService.update(id, updates);

    if (matched) {
      ctx.response.status = 200;
      ctx.response.body = { message: "Roadmap item updated" };
    } else {
      ctx.throw(404, "Roadmap item not found");
    }
  } catch (error) {
    ctx.throw(500, `Update failed: ${error.message}`);
  }
};

export const deleteRoadmapItem = async (ctx: Context) => {
  try {
    const id = ctx.params.id!;
    const deleted = await RoadmapService.delete(id);

    if (deleted) {
      ctx.response.status = 200;
      ctx.response.body = { message: "Roadmap item deleted" };
    } else {
      ctx.throw(404, "Roadmap item not found");
    }
  } catch (error) {
    ctx.throw(500, `Delete failed: ${error.message}`);
  }
};