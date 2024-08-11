import { SSEStreamingApi } from "jsr:@hono/hono@^4.5.1/streaming";
import { IInteraction } from "../interfaces/IInteraction.ts";
import kv from "../config/kv.ts";

export const totalPostInteractionsSSEController = async (
    stream: SSEStreamingApi,
) => {
    const watcher = kv.watch([
        ["interactions", "call", "total"],
        ["interactions", "whatsapp", "total"],
        ["interactions", "location", "total"],
    ]);
    for await (const entries of watcher) {
        if (entries != null) {
            const interactions: IInteraction[] = [
                {
                    type: "call",
                    total: (entries[0].value as bigint).toString(),
                },
                {
                    type: "whatsapp",
                    total: (entries[1].value as bigint).toString(),
                },
                {
                    type: "location",
                    total: (entries[2].value as bigint).toString(),
                },
            ]
            await stream.writeSSE({
                data: JSON.stringify({
                    interactions,
                }),
                event: "total-interactions-changed",
            });
        }
    }
};
