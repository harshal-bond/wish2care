import 'dotenv/config';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/wish2care';

const migrationClient = postgres(connectionString, { max: 1 });
const db = drizzle(migrationClient);

async function main() {
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: 'drizzle' });
  console.log('Migrations complete!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed');
  console.error(err);
  process.exit(1);
});
