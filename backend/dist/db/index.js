import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
// Setup postgres client
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/wish2care';
const client = postgres(connectionString);
// Create drizzle instance
export const db = drizzle(client, { schema });
//# sourceMappingURL=index.js.map