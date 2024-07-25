import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import { cors } from "hono/cors";
import { streamSSE } from "hono/streaming";
import { Subject } from "npm:rxjs@7.8.1";

interface Visit {
  hmac: string;
  uuid: string;
  post_id: string;
  conversion_type: string;
}

const app = new Hono();
const env = await load();

const sql = postgres("", {
  user: env.DB_USER,
  port: Number(env.DB_PORT),
  database: env.DB_NAME,
  password: env.DB_PASS,
  hostname: env.DB_HOST,
  publications: "alltables",
});

app.use("*", cors());

app.get("/", serveStatic({ path: "./index.html" }));

app.post("/visits", async (c) => {
  try {
    const { hmac, uuid, post_id, conversion_type } = await c.req.json<Visit>();

    // TODO: check hmac

    const user = await sql`
      SELECT * 
      FROM users 
      WHERE uuid = ${uuid}
    `;
    if (user.length === 0) {
      await sql`
        INSERT INTO users 
          (uuid)
        VALUES 
          (${uuid})
      `;
    }
    const post = await sql`
      SELECT *
      FROM posts
      WHERE id = ${post_id}
    `;

    if (post.length === 0) {
      await sql`
        INSERT INTO posts
          (id)
        VALUES
          (${post_id})
      `;
    }

    const now = new Date().toISOString();
    await sql`
      INSERT INTO user_visits
        (time, user_id, post_id)
      VALUES 
        (${now}, ${uuid}, ${post_id})
    `;
    return c.json({ message: "ok" });
  } catch (error) {
    return c.json({ error: error.message }, 400);
  }
});

const visitsSubject = new Subject();

await sql.listen("user_visits", async (_) => {
  const result = await sql`SELECT COUNT(*) FROM user_visits`;
  visitsSubject.next(result[0].count);
});

app.get("/visits", (c) => {
  return streamSSE(c, async (stream) => {
    let controller: ReadableStreamDefaultController | undefined;

    const subscription = visitsSubject.subscribe((newvisits) => {
      if (stream.aborted) {
        controller = undefined;
        subscription.unsubscribe();
        stream.close();
      }
      if (controller) {
        controller.enqueue(newvisits);
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
  });
});

Deno.addSignalListener("SIGINT", async () => {
  console.log(`Received SIGINT, closing database connection...`);
  await sql.end();
  console.log("Database connection closed. Exiting...");
  Deno.exit();
});
Deno.addSignalListener("SIGTERM", async () => {
  console.log(`Received SIGTERM, closing database connection...`);
  await sql.end();
  console.log("Database connection closed. Exiting...");
  Deno.exit();
});

Deno.serve(app.fetch);
