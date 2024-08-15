import { SSEStreamingApi } from "jsr:@hono/hono@^4.5.1/streaming";

export async function streamSSEData(
    sseStream: ReadableStream,
    stream: SSEStreamingApi,
    eventName: string,
) {
    for await (const data of sseStream) {
        await stream.writeSSE({
            data: JSON.stringify({ data }),
            event: eventName,
        });
    }
}

export function createSSEStream(
    onStart: (ctrl: ReadableStreamDefaultController) => void,
) {
    return new ReadableStream({
        start(ctrl) {
            onStart(ctrl);
        },
        cancel() {
            onStart(undefined!);
        },
    });
}