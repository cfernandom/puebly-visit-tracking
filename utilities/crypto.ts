import { randomBytes } from "node:crypto";

function generateSecretKey(): string {
    const key = randomBytes(32);
    const secretKey = key.toString("base64");
    console.log("Clave secreta:", secretKey);
    // Deno.env.set("SHARED_SECRET_KEY", secretKey);
    return secretKey;
}

export default generateSecretKey;
