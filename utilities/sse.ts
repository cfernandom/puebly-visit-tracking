import { Subject } from "npm:rxjs@7.8.1";
import sql from "../config/db.ts";
import { SSEStreamingApi } from "jsr:@hono/hono@^4.5.1/streaming";

const visitsSubject = new Subject<number>();

await sql.listen("user_visits", async (_) => {
  const result = await sql`SELECT COUNT(*) FROM user_visits`;
  visitsSubject.next(result[0].count);
});

export const createSSEStream = async (stream: SSEStreamingApi) => {
  let controller: ReadableStreamDefaultController | undefined;

  const subscription = visitsSubject.subscribe((newVisits) => {
    if (stream.aborted) {
      controller = undefined;
      subscription.unsubscribe();
      stream.close();
      return;
    }
    if (controller) {
      controller.enqueue(newVisits);
    }
  });

  const sseStream = new ReadableStream({
    start(ctrl) {
      controller = ctrl;
    },
    cancel() {
      controller = undefined;
    },
  });

  for await (const visits of sseStream) {
    await stream.writeSSE({
      data: JSON.stringify({ visits: visits }),
      event: "visits-changed",
    });

  }
};