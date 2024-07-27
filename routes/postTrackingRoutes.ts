import { Hono } from "hono";
import { logPostVisit, getPostVisits } from "../controllers/postVisitController.ts";
import { streamSSE } from "hono/streaming";
import { createSSEStream } from "../utilities/sse.ts";

const postTrackingRouter = new Hono();

postTrackingRouter.post("/log-post-visit", logPostVisit);
postTrackingRouter.get("/post-visits", getPostVisits);
postTrackingRouter.get("/post-log-stream", (c) => streamSSE(c, createSSEStream));

export default postTrackingRouter;