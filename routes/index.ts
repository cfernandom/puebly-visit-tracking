import { Hono } from "hono";
import { healthCheck } from "../controllers/healthCheckController.ts";
import postTrackingRoutes from "./postTrackingRoutes.ts";
import { serveStatic } from "hono/deno";
import { corsMiddleware } from "../middlewares/corsMiddleware.ts";

const app = new Hono();

app.use("*", corsMiddleware());

app.get("/", serveStatic({ path: "./public/index.html" }));

app.route("/api/v1", postTrackingRoutes);

app.get("/healthz", healthCheck);

export default app;
