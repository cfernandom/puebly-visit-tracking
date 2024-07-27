import { Context } from "hono";
import sql from "../config/db.ts";
import validateHmac from "../utilities/hmac.ts";
import { IPostVisitLog } from "../interfaces/IPostVisitLog.ts";

export const logPostVisit = async (c: Context) => {
  try {
    const { hmac, uuid, post_id, post_title } = await c.req.json<IPostVisitLog>();

    if (!hmac || !uuid || !post_id) {
      return c.json({ error: "missing parameters" }, 400);
    }

    if (!validateHmac(uuid, hmac)) {
      return c.json({ error: "invalid hmac" }, 400);
    }

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
            (id, title)
          VALUES
            (${post_id}, ${post_title || 'Sin título'})
        `;
    }

    const now = new Date().toISOString();
    await sql`
        INSERT INTO post_user_visits
          (time, user_id, post_id)
        VALUES 
          (${now}, ${uuid}, ${post_id})
      `;

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
}