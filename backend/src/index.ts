import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { authRoutes } from "./routes/auth.js";
import { studentsRoutes } from "./routes/students.js";
import { schoolsRoutes } from "./routes/schools.js";
import { exportRoutes } from "./routes/export.js";
import { healthRecordsRoutes } from "./routes/healthRecords.js";

const app = new Hono();

app.use("*", logger());

app.use(
  "/api/*",
  cors({
    origin: [
      "https://wish2care-frontend.vercel.app",
      "http://localhost:5173",
    ],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  })
);

app.get("/api/health", (c) =>
  c.json({
    status: "ok",
    time: new Date().toISOString(),
  })
);

app.route("/api/auth", authRoutes);
app.route("/api/schools", schoolsRoutes);
app.route("/api/students", studentsRoutes);
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

const port = Number(process.env.PORT) || 3000;

console.log(`Server running on ${port}`);

serve({
  fetch: app.fetch,
  port,
});
