import app from "./routes/index.ts";
import sql from "./config/db.ts";

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

export default app;
