import { Hono } from "hono";
import { logPostVisit, getPostVisits, getTotalPostVisits } from "../controllers/postVisitController.ts";
import { streamSSE } from "hono/streaming";
import { getChargedPostInteractions, logPostInteraction } from "../controllers/postInteractionsController.ts";
import { postInteractionsSSEController } from "../controllers/postInteractionsSSEController.ts";
import { totalPostInteractionsSSEController } from "../controllers/totalPostInteractionsSSEController.ts";
import { postVisitSSEController } from "../controllers/postVisitSSEController.ts";
import { totalVisitsSSEController } from "../controllers/totalVisitsSSEController.ts";

const postTrackingRouter = new Hono();

postTrackingRouter.post("/log-post-visit", logPostVisit);
postTrackingRouter.get("/post-visits", getPostVisits);
postTrackingRouter.get("/charged-post-interactions", getChargedPostInteractions);
postTrackingRouter.get("/total-post-visits", getTotalPostVisits);
postTrackingRouter.post("/log-post-interaction", logPostInteraction);
postTrackingRouter.get("/post-interactions-stream", (c) => streamSSE(c, postInteractionsSSEController));
postTrackingRouter.get("/total-post-interactions-stream", (c) => streamSSE(c, totalPostInteractionsSSEController));
postTrackingRouter.get("/post-log-stream", (c) => streamSSE(c, postVisitSSEController));
postTrackingRouter.get("/post-log-kv-stream", (c) => streamSSE(c, totalVisitsSSEController));

export default postTrackingRouter;