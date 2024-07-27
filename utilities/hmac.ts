import { createHmac } from "node:crypto";
import env from "../config/environment.ts";

function validateHmac(uuid: string, receivedHmac: string): boolean {
    const encoder = new TextEncoder();
    const key = encoder.encode(env.SHARED_SECRET_KEY);
    const hmac = createHmac("sha256", key);
    hmac.update(uuid, 'utf-8'); // Asegurarse de que el mensaje esté codificado en UTF-8
    const calculatedHmac = hmac.digest('hex'); // Obtener el HMAC en formato hexadecimal
    return calculatedHmac === receivedHmac;
}
export default validateHmac;
