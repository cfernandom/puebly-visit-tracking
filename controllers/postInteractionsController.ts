import { Context } from "hono";
import validateHmac from "../utilities/hmac.ts";
import { IPostInteractionLog } from "../interfaces/IPostInteractionLog.ts";
import kv from "../config/kv.ts";
import sql from "../config/db.ts";

const logPostInteractionToKv = async (uuid: string, post_id: number, type: string) => {
  await kv.atomic()
    .sum(["interactions", type, "posts", post_id], 1n)
    .sum(["interactions", type, "users", uuid], 1n)
    .sum(["interactions", type, "total"], 1n)
    .commit();
}

const billPostInteraction = async (uuid: string, post_id: number, type: string) => {
  await sql.begin(async (sql) => {
    const interactedRecently = await sql`
      SELECT EXISTS (
          SELECT 1
          FROM post_user_interactions
          WHERE time > now() - INTERVAL '12 hours'
          AND user_id = ${uuid}
          AND post_id = ${post_id}
          AND type = ${type}
      ) AS has_interacted;
    `;

    if (!interactedRecently[0].has_interacted) {
      await sql`INSERT INTO post_user_interactions (time, user_id, post_id, type)
      VALUES (now(), ${uuid}, ${post_id}, ${type});`
    }
  });
}

export const logPostInteraction = async (c: Context) => {
  try {
    const {hmac, uuid, post_id, type} = await c.req.json<IPostInteractionLog>();
    if (!hmac || !uuid || !post_id || !type) {
      return c.json({ error: "missing parameters" }, 400);
    }

    if (!validateHmac(uuid, hmac)) {
      return c.json({ error: "invalid data" }, 400);
    }

    await logPostInteractionToKv(uuid, post_id, type);

    await billPostInteraction(uuid, post_id, type);

    return c.json({ message: "ok" });
  } catch (error) {
    console.log(error);
    return c.json({ error: error.message }, 400);     
  }
}

export const getChargedPostInteractions = async (c: Context) => {
  try {
    const interactions = await sql`
    SELECT 
        type,
        COUNT(*) AS total
    FROM 
        post_user_interactions
    GROUP BY 
        type;
    `;
    return c.json({ interactions: interactions });
  } catch (error) {
    return c.json({ error: error.message }, 400);
  }
}