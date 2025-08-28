// controllers/aiAssistantController.ts

import { Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { AIAssistantService } from "../services/aiAssistantService.ts";

export const chatController = async (ctx: Context) => {
  try {
    const { value } = await ctx.request.body({ type: "json" });
    const request = await value;

    const response = await AIAssistantService.sendChatMessage(request);

    ctx.response.status = 200;
    ctx.response.body = response;
  } catch (error) {
    console.error("❌ AI Error:", error.message);
    ctx.response.status = 500;
    ctx.response.body = { error: "AI processing failed. Please try again later." };
  }
};