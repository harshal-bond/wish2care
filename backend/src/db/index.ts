import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

// Prefer Neon pooled URL (-pooler) in production to avoid connection exhaustion.
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/wish2care';
const isProduction = process.env.NODE_ENV === 'production';
const usesPooler =
  connectionString.includes('-pooler') || connectionString.includes('pgbouncer=true');

// Railway/Neon: one Node process + pooler → keep max low (NOT "more connections").
// Direct Postgres on a small Railway plan: still cap to avoid exhausting the DB.
const poolMax = Number(process.env.DB_POOL_MAX) || (usesPooler ? 5 : isProduction ? 10 : 20);

const client = postgres(connectionString, {
  max: poolMax,
  idle_timeout: 60,
  connect_timeout: 30,
  max_lifetime: 60 * 30,
  // Required when DATABASE_URL points at PgBouncer / Neon pooler (transaction mode)
  prepare: !usesPooler,
});

export const db = drizzle(client, { schema });
