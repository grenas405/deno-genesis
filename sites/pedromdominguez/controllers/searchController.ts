// controllers/searchController.ts

import { Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { SearchService } from "../services/searchService.ts";

export async function searchSite(ctx: Context) {
  try {
    const url = ctx.request.url;
    const query = url.searchParams.get("q") || "";

    if (!query) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Missing search query ?q=..." };
      return;
    }

    const results = await SearchService.searchSite(query);

    ctx.response.status = 200;
    ctx.response.type = "json";
    ctx.response.body = results;
  } catch (err) {
    console.error("❗ Search error:", err);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal Server Error" };
  }
}
