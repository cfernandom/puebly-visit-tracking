import { SSEStreamingApi } from "jsr:@hono/hono@^4.5.1/streaming";
import kv from "../config/kv.ts";

export const totalVisitsSSEController = async (stream: SSEStreamingApi) => {
    const watcher = kv.watch([["visits", "total"]]);
    
    for await (const [entry] of watcher) {
      const visits = entry.value;
  
      if (visits != null) {
        await stream.writeSSE({
          data: JSON.stringify({ visits: visits.toString() }),
          event: "total-visits-changed",
        });
      }
    }
  }