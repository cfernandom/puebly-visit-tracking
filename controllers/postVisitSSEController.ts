import { SSEStreamingApi } from "jsr:@hono/hono@^4.5.1/streaming";
import { Subject } from "npm:rxjs@7.8.1";
import { cleanupSubscription } from "../utilities/subscription.ts";
import sql from "../config/db.ts";
import { createSSEStream, streamSSEData } from "../utilities/sse.ts";

const visitsSubject = new Subject<number>();

export const postVisitSSEController = async (stream: SSEStreamingApi) => {
    let controller: ReadableStreamDefaultController<number> | undefined;

    const subscription = visitsSubject.subscribe((newVisits) => {
        if (stream.aborted) {
            cleanupSubscription(subscription, controller, stream);
            return;
        }
        if (controller) {
            controller.enqueue(newVisits);
        }
    });

    const sseStream = createSSEStream((ctrl) => {
        controller = ctrl;
    });

    await streamSSEData(sseStream, stream, "post-user-visits-changed");
};

async function fetchVisits(): Promise<number> {
    const result = await sql`SELECT COUNT(*) FROM post_user_visits`;
    return result[0].count;
}

async function handleVisitsNotification() {
    const visits = await fetchVisits();
    visitsSubject.next(visits);
}

async function initializeVisitsListener() {
    await sql.listen("post_user_visits_channel",
        handleVisitsNotification,
    );
}

initializeVisitsListener();