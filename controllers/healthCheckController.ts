import { Context } from "hono";

export const healthCheck = (c: Context) => {
  return c.json({ status: "ok" });
};