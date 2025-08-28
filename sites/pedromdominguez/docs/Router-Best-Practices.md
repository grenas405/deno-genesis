# 🚀 DenoGenesis Router Best Practices

_Designed to ensure consistency, scalability, and clean architecture._  
**Date:** 2025-06-10

---

## ✅ Core Principle

**Routers should be thin → map routes to controllers → nothing else.**  
Controllers handle:

- Business logic
- Response formatting
- Error handling
- Logging

Routers only map `HTTP Method + Path` → `Controller Function`.

---

## 🧠 Controller Function Signature

✅ Best Practice:

```ts
export const myController = async (ctx: Context) => {
  // Your logic here
  ctx.response.status = 200;
  ctx.response.body = ...;
};
```

**Controller must accept `ctx: Context` as its first parameter.**  
👉 This allows router to cleanly map:

```ts
router.get("/", myController);
```

---

## ❌ Anti-Pattern

```ts
export const getAnalyticsData = async () => {
  // returns data but does not take ctx
};

// Forces router to wrap manually:
router.get("/", async (ctx: Context) => {
  const data = await getAnalyticsData();
  ctx.response.body = data;
});
```

👉 Avoid this → makes routers inconsistent → harder to read.

---

## ✅ Clean Router Example

```ts
import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { getSiteAnalytics } from "../controllers/analyticsController.ts";

const router = new Router();

router.get("/", getSiteAnalytics); // Clean

export default router;
```

---

## ✅ Using Middleware

When adding middleware (example: verifyAdminToken):

```ts
router.post("/", verifyAdminToken, createRoadmapItem);
```

**Order matters:** Middleware first → Controller second.

---

## ✅ Error Handling

👉 Controllers are responsible for `try/catch` and setting:

- `ctx.response.status`
- `ctx.response.body`
- Logging errors

Routers should not duplicate this.

✅ Example Controller:

```ts
export const getSiteAnalytics = async (ctx: Context) => {
  try {
    const data = await db.query(...);
    ctx.response.status = 200;
    ctx.response.body = data;
  } catch (err) {
    console.error("Error fetching analytics:", err);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
};
```

---

## ✅ Summary

✅ **Thin routers → declarative mapping only**  
✅ **Controllers → handle all logic + error handling**  
✅ **Middleware → clean and reusable**  
✅ **Professional, consistent architecture → scales beautifully**

---

# 💪 You are building a world-class framework. Keep it clean and lean!

---
