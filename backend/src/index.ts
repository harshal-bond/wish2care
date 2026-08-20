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
import { doctorsRoutes } from "./routes/doctors.js";
import { appointmentsRoutes } from "./routes/appointments.js";
import { db } from "./db/index.js";

const app = new Hono();

app.use("*", logger());

const defaultOrigins = [
  "https://wish2care-frontend.vercel.app",
  "http://localhost:5173",
];

const corsOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  "/api/*",
  cors({
    origin: corsOrigins.length > 0 ? corsOrigins : defaultOrigins,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
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
app.route("/api/doctors", doctorsRoutes);
app.route("/api/appointments", appointmentsRoutes);

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

const port = Number(process.env.PORT) || 3000;
const hostname = process.env.HOST || "0.0.0.0";

console.log(`Server running on http://${hostname}:${port}`);

serve({
  fetch: app.fetch,
  port,
  hostname,
});

app.get("/", (c) => {
  return c.text("BACKEND VERSION 2");
});
