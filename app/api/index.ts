// @ts-nocheck
import { handle } from "hono/vercel";
import app from "../dist/boot.js";

// Export the Hono application handler for all HTTP methods supported on Vercel
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const OPTIONS = handle(app);
export const PATCH = handle(app);
