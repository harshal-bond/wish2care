import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

// Prefer Neon pooled URL (-pooler) in production to avoid connection exhaustion.
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/wish2care';
const client = postgres(connectionString, {
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
