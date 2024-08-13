import { SSEStreamingApi } from "jsr:@hono/hono@^4.5.1/streaming";
import sql from "../config/db.ts";
import { Subject } from "npm:rxjs@7.8.1";
import { IInteraction } from "../interfaces/IInteraction.ts";
import { cleanupSubscription } from "../utilities/subscription.ts";

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

    await streamSSEData(sseStream, stream);
};

function createSSEStream(
    onStart: (ctrl: ReadableStreamDefaultController<IInteraction[]>) => void,
) {
    return new ReadableStream<IInteraction[]>({
        start(ctrl) {
            onStart(ctrl);
        },
        cancel() {
            onStart(undefined!);
        },
    });
}

async function streamSSEData(
    sseStream: ReadableStream<IInteraction[]>,
    stream: SSEStreamingApi,
) {
    for await (const interactions of sseStream) {
        await stream.writeSSE({
            data: JSON.stringify({ interactions }),
            event: "post-user-interactions-changed",
        });
    }
}

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
