// /controllers/projectsController.ts
import { Context } from "https://deno.land/x/oak/mod.ts";
import { ProjectsService } from "../services/projectsService.ts";
import { ProjectInput, ProjectUpdateInput } from "../types/projects.d.ts";

export const getAllProjects = async (ctx: Context) => {
  try {
    const projects = await ProjectsService.getAll();
    console.log(`📦 ${projects.length} projects retrieved.`);
    ctx.response.status = 200;
    ctx.response.body = projects;
  } catch (error) {
    console.error("❌ Error fetching projects:", error.message);
    ctx.response.status = 500;
    ctx.response.body = { message: "Failed to fetch projects." };
  }
};

export const createProject = async (ctx: Context) => {
  try {
    const form = ctx.state.formData || {};
    const { title, description, image } = form;

    if (!title || !description || !image) {
      ctx.response.status = 400;
      ctx.response.body = {
        message: "Title, description, and image are required.",
      };
      return;
    }

    const projectData: ProjectInput = { title, description, image };
    await ProjectsService.create(projectData);

    console.log("✅ Project created:", title);
    ctx.response.status = 201;
    ctx.response.body = { message: "Project created successfully." };
  } catch (error) {
    console.error("❌ Error creating project:", error.message);
    ctx.response.status = 500;
    ctx.response.body = { message: "Failed to create project." };
  }
};

export const updateProject = async (ctx: Context) => {
  try {
    const id = ctx.params.id!;
    const form = ctx.state.formData || {};
    const { title, description, image } = form;

    if (!title || !description) {
      ctx.response.status = 400;
      ctx.response.body = { message: "Title and description are required." };
      return;
    }

    const projectData: ProjectUpdateInput = { title, description };
    if (image) projectData.image = image;

    const affected = await ProjectsService.update(id, projectData);

    if (affected === 0) {
      ctx.response.status = 404;
      ctx.response.body = { message: "Project not found or site key mismatch." };
      return;
    }

    console.log("✏️ Project updated:", id);
    ctx.response.status = 200;
    ctx.response.body = { message: "Project updated successfully." };
  } catch (error) {
    console.error("❌ Error updating project:", error.message);
    ctx.response.status = 500;
    ctx.response.body = { message: "Failed to update project." };
  }
};

export const deleteProject = async (ctx: Context) => {
  try {
    const id = ctx.params.id!;
    const affected = await ProjectsService.delete(id);

    if (affected === 0) {
      ctx.response.status = 404;
      ctx.response.body = { message: "Project not found or site key mismatch." };
      return;
    }

    console.log("🗑️ Project deleted:", id);
    ctx.response.status = 200;
    ctx.response.body = { message: "Project deleted successfully." };
  } catch (error) {
    console.error("❌ Error deleting project:", error.message);
    ctx.response.status = 500;
    ctx.response.body = { message: "Failed to delete project." };
  }
};