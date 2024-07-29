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

async function testConnection() {
  try {
    await sql`SELECT 1`; // Consulta de prueba
    console.log("Conexión exitosa a PostgreSQL");
  } catch (error) {
    console.error("Error conectando a la base de datos:", error.message);
  }
}

testConnection();

export default sql;