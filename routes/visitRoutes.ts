import { Hono } from "hono";
import { logVisit } from "../controllers/visitController.ts";
import { streamSSE } from "hono/streaming";
import { createSSEStream } from "../utilities/sse.ts";

const visitRouter = new Hono();

visitRouter.post("/visits", logVisit);
visitRouter.get("/visits", (c) => streamSSE(c, createSSEStream));

export default visitRouter;