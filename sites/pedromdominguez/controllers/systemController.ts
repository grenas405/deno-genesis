import { RouterContext } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { getSystemInfo as fetchSystemInfo } from "../services/systemService.ts";

export const getSystemInfo = async (ctx: RouterContext) => {
  const info = await fetchSystemInfo();
  ctx.response.status = 200;
  ctx.response.type = "application/json";
  ctx.response.body = info;
};