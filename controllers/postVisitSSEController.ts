import { SSEStreamingApi } from "jsr:@hono/hono@^4.5.1/streaming";
import { Subject } from "npm:rxjs@7.8.1";
import { cleanupSubscription } from "../utilities/subscription.ts";
import sql from "../config/db.ts";

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

    await streamSSEData(sseStream, stream);
};

function createSSEStream(
    onStart: (ctrl: ReadableStreamDefaultController<number>) => void,
) {
    return new ReadableStream<number>({
        start(ctrl) {
            onStart(ctrl);
        },
        cancel() {
            onStart(undefined!);
        },
    });
}

async function streamSSEData(
    sseStream: ReadableStream<number>,
    stream: SSEStreamingApi,
) {
    for await (const visits of sseStream) {
        await stream.writeSSE({
            data: JSON.stringify({ visits: visits }),
            event: "post-user-visits-changed",
        });
    }
}

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