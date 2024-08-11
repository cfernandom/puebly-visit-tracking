import { Context } from "hono";
import sql from "../config/db.ts";
import kv from "../config/kv.ts";
import validateHmac from "../utilities/hmac.ts";
import { IPostVisitLog } from "../interfaces/IPostVisitLog.ts";

const billPostVisit = async (uuid: string, post_id: number, title?: string) => {
  await sql.begin(async (sql) => {
    await sql`
      INSERT INTO users (uuid)
      VALUES (${uuid})
      ON CONFLICT (uuid) DO NOTHING;
    `;

    await sql`
      INSERT INTO posts (id, title)
      VALUES (${post_id}, ${title || 'Sin título'})
      ON CONFLICT (id) DO NOTHING;
    `;

    const visitedRecently = await sql`
      SELECT EXISTS (
          SELECT 1
          FROM post_user_visits
          WHERE time > now() - INTERVAL '12 hours'
          AND user_id = ${uuid}
          AND post_id = ${post_id}
      ) AS has_visited;
    `;

    if (!visitedRecently[0].has_visited) {
      await sql`
        INSERT INTO post_user_visits (time, user_id, post_id)
        VALUES (now(), ${uuid}, ${post_id});
      `;
    }
  });
}

const logPostVisitToKv = async (uuid: string, post_id: number, title?: string) => {
  await kv.atomic()
    .sum(["visits", "posts", post_id], 1n)
    .sum(["visits", "users", uuid], 1n)
    .sum(["visits", "total"], 1n)
    .set(["posts", post_id, "title"], title || "Sin título")
    .commit();
};

export const logPostVisit = async (c: Context) => {
  try {
    const { hmac, uuid, post_id, post_title } = await c.req.json<IPostVisitLog>();

    if (!hmac || !uuid || !post_id) {
      return c.json({ error: "missing parameters" }, 400);
    }

    if (!validateHmac(uuid, hmac)) {
      return c.json({ error: "invalid data" }, 400);
    }
    
    await logPostVisitToKv(uuid, post_id, post_title);
    
    await billPostVisit(uuid, post_id, post_title);

    return c.json({ message: "ok" });
  } catch (error) {
    return c.json({ error: error.message }, 400);
  }
};

export const getPostVisits = async (c: Context) => {
  try {
    const visits = await sql`
      SELECT COUNT(*) AS visits
      FROM post_user_visits
    `;
    return c.json({ visits: visits[0].visits });
  } catch (error) {
    return c.json({ error: error.message }, 400);
  }
};

export const getTotalPostVisits = async (c: Context) => {
  try {
    const visits = await kv.get(["visits", "total"]);
    const totalVisits = visits.value ?? 0n;
    return c.json({ visits: totalVisits.toString() });
  } catch (error) {
    return c.json({ error: error.message }, 400);
  }
}