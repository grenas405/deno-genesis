import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { getSystemInfo } from "../controllers/systemController.ts";

const systemRouter = new Router();
systemRouter.get("/info", getSystemInfo);

export default systemRouter;
