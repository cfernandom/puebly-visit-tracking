import { randomBytes } from "node:crypto";

const key = randomBytes(32);

const secretKey = key.toString('base64');

console.log("Clave secreta:", secretKey);
// Deno.env.set("SECRET_KEY", secretKey);
