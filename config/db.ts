import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";
import env from "./environment.ts";

const sql = postgres("", {
  user: env.DB_USER,
  port: Number(env.DB_PORT),
  database: env.DB_NAME,
  password: env.DB_PASS,
  hostname: env.DB_HOST,
  publications: "alltables",
});

export default sql;