import { Hono } from "hono";
import { logPostVisit, getPostVisits, getTotalPostVisits } from "../controllers/postVisitController.ts";
import { streamSSE } from "hono/streaming";
import { createKvSSEStream, createSSEStream } from "../utilities/sse.ts";

const postTrackingRouter = new Hono();

postTrackingRouter.post("/log-post-visit", logPostVisit);
postTrackingRouter.get("/post-visits", getPostVisits);
postTrackingRouter.get("/total-post-visits", getTotalPostVisits);
postTrackingRouter.get("/post-log-stream", (c) => streamSSE(c, createSSEStream));
postTrackingRouter.get("/post-log-kv-stream", (c) => streamSSE(c, createKvSSEStream));

export default postTrackingRouter;