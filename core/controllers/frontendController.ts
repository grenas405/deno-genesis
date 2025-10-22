// controllers/frontendController.ts
// =============================================================
// 🎨 DenoGenesis Frontend Controller (Minimal Mode)
// =============================================================

import { send } from "https://deno.land/x/oak@v12.6.1/mod.ts";

/**
 * Serve the homepage
 */
export async function serveHome(ctx: any) {
  await send(ctx, "/public/pages/home/index.html", {
    root: Deno.cwd(),
  });
}
