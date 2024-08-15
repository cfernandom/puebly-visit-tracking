import { SSEStreamingApi } from "jsr:@hono/hono@^4.5.1/streaming";
import sql from "../config/db.ts";
import { Subject } from "npm:rxjs@7.8.1";
import { IInteraction } from "../interfaces/IInteraction.ts";
import { cleanupSubscription } from "../utilities/subscription.ts";
import { createSSEStream, streamSSEData } from "../utilities/sse.ts";

const interactionsSubject = new Subject<IInteraction[]>();

export const postInteractionsSSEController = async (
    stream: SSEStreamingApi,
) => {
    let controller: ReadableStreamDefaultController<IInteraction[]> | undefined;

    const subscription = interactionsSubject.subscribe((newInteractions) => {
        if (stream.aborted) {
            cleanupSubscription(subscription, controller, stream);
            return;
        }
        if (controller) {
            controller.enqueue(newInteractions);
        }
    });

    const sseStream = createSSEStream((ctrl) => {
        controller = ctrl;
    });

    await streamSSEData(sseStream, stream, "post-user-interactions-changed");
};

async function fetchInteractions(): Promise<IInteraction[]> {
    const result = await sql`
        SELECT 
            type,
            COUNT(*) AS total
        FROM 
            post_user_interactions
        GROUP BY 
            type;
    `;
    return result.map(({ type, total }) => ({ type, total }));
}

async function handleInteractionNotification() {
    const interactions = await fetchInteractions();
    interactionsSubject.next(interactions);
}

async function initializeInteractionListener() {
    await sql.listen(
        "post_user_interactions_channel",
        handleInteractionNotification,
    );
}

await initializeInteractionListener();
