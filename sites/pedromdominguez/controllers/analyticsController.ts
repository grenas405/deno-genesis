// /controllers/analyticsController.ts
import { Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { AnalyticsService } from "../services/analyticsService.ts";

export const getSiteAnalytics = async (ctx: Context) => {
  try {
    const stats = await AnalyticsService.getAnalytics();

    ctx.response.status = 200;
    ctx.response.body = stats;
  } catch (error) {
    console.error("❌ [AnalyticsController] Error:", error.message);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
};