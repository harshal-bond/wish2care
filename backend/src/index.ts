import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { sql } from "drizzle-orm";

import { authRoutes } from "./routes/auth.js";
import { studentsRoutes } from "./routes/students.js";
import { schoolsRoutes } from "./routes/schools.js";
import { exportRoutes } from "./routes/export.js";
import { healthRecordsRoutes } from "./routes/healthRecords.js";
import { staffRoutes } from "./routes/staff.js";
import { db } from "./db/index.js";
import { corsOriginHeader, buildAllowedOrigins } from "./lib/cors.js";

const app = new Hono();

app.use("*", logger());

console.log("[CORS] Allowed origins:", buildAllowedOrigins().join(", "));
console.log("[CORS] Also allowing *.vercel.app and localhost dev ports");

app.use(
  "*",
  cors({
    origin: (origin) => {
      const allowed = corsOriginHeader(origin);
      if (origin && !allowed) {
        console.warn("[CORS] Blocked request from origin:", origin);
      }
      return allowed;
    },
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Type"],
    maxAge: 86400,
    credentials: false,
  })
);

/** Liveness — no DB. Use for Railway process keepalive. */
app.get("/api/health", (c) =>
  c.json({
    status: "ok",
    version: "2",
    time: new Date().toISOString(),
  })
);

/**
 * Readiness + Neon keepalive.
 * Point an external cron (every 4–5 min) at this URL to reduce free-tier suspend latency.
 */
app.get("/api/health/db", async (c) => {
  try {
    await db.execute(sql`select 1`);
    return c.json({
      status: "ok",
      db: "up",
      time: new Date().toISOString(),
    });
  } catch (err: any) {
    return c.json(
      {
        status: "error",
        db: "down",
        error: err?.message || "db check failed",
        time: new Date().toISOString(),
      },
      503
    );
  }
});

app.route("/api/auth", authRoutes);
app.route("/api/schools", schoolsRoutes);
app.route("/api/students", studentsRoutes);
app.route("/api/staff", staffRoutes);
app.route("/api/health-records", healthRecordsRoutes);
app.route("/api/export", exportRoutes);

app.onError((err, c) => {
  console.error(err);

  return c.json(
    {
      success: false,
      error: err.message,
    },
    500
  );
});

app.get("/", (c) => {
  return c.text("BACKEND VERSION 2");
});

const port = Number(process.env.PORT) || 3000;
const hostname = process.env.HOST || "0.0.0.0";

console.log(`Server running on http://${hostname}:${port}`);

serve({
  fetch: app.fetch,
  port,
  hostname,
});
