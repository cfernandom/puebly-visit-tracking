import { Subscription } from "npm:rxjs@7.8.1";
import { SSEStreamingApi } from "jsr:@hono/hono@^4.5.1/streaming";

export function cleanupSubscription(
    subscription: Subscription,
    controller: ReadableStreamDefaultController| undefined,
    stream: SSEStreamingApi,
) {
    if (controller) {
        controller = undefined;
    }
    subscription.unsubscribe();
    stream.close();
}
