import { Context } from "hono";
import sql from "../config/db.ts";

export const logVisit = async (c: Context) => {
  try {
    const { hmac, uuid, post_id, conversion_type } = await c.req.json();

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
};
