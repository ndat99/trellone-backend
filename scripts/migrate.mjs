import 'dotenv/config';
import { runner } from 'node-pg-migrate';
import { fileURLToPath } from 'node:url';

const requiredVariables = ['DB_HOST', 'DB_NAME', 'DB_USER'];

for (const name of requiredVariables) {
    if (!process.env[name]) {
        throw new Error(`Missing environment variable: ${name}`);
    }
}

try {
    await runner({
        databaseUrl: {
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT || '5432'),
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        },
        dir: fileURLToPath(new URL('../migrations/', import.meta.url)),
        schema: 'public',
        migrationsSchema: 'public',
        migrationsTable: 'pgmigrations',
        direction: 'up',
        singleTransaction: true,
        dryRun: process.argv.includes('--dry-run')
    });
} catch (error) {
    console.error('Migration failed:', error);
    process.exitCode = 1;
}