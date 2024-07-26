import app from "./app.ts";

console.log("Starting server on http://localhost:8000");

Deno.serve(app.fetch);
