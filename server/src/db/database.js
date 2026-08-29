import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Uses cloud database in production, falls back to local file in development
const isProd = process.env.NODE_ENV === 'production' || !!process.env.TURSO_DATABASE_URL;

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN
});

// SQLite Promise-compatible helpers
export const query = {
  async run(sql, params = []) {
    const result = await client.execute({ sql, args: params });
    return { lastID: Number(result.lastInsertRowid), changes: result.rowsAffected };
  },

  async get(sql, params = []) {
    const result = await client.execute({ sql, args: params });
    return result.rows[0] || null;
  },

  async all(sql, params = []) {
    const result = await client.execute({ sql, args: params });
    return result.rows || [];
  },

  async exec(sql) {
    await client.executeMultiple(sql);
  }
};

export async function initDb() {
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
  await query.exec(schemaSql);
  console.log('Database schema successfully initialized.');
}

export default client;