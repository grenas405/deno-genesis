// /backend/routes/searchRoutes.ts
// ============================================
// 🔍 Search Routes - Dominguez Tech Solutions
// ============================================
// ✅ Handles public-facing search endpoint
// ✅ Connects to the thin controller, service, and model
// ✅ Follows clean modular architecture
// ============================================

import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { searchSite } from "../controllers/searchController.ts";

const router = new Router();

// === Public Search Endpoint ===
// Example: GET /api/search?q=your+query
router.get("/", searchSite);

// ✅ You could add POST or advanced filters in the future
// router.post("/", advancedSearch);

export default router;
