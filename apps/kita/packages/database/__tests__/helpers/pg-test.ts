import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Pool, type PoolClient } from "pg";
import { MIGRATIONS_DIR, migrate } from "../src/migrate.js";

/**
 * TEST-PLAT-02 harness ONLY — never production code. Boots an isolated PostgreSQL 18
 * container (docker-compose.test.yml), no seeded money, and exposes fresh-install runs.
 */

const ADMIN_URL = process.env.KITA_TEST_PG_ADMIN_URL ?? "postgres://kita_owner:kita_owner@localhost:55432/postgres";
const OWNER_URL = process.env.KITA_TEST_PG_URL ?? "postgres://kita_owner:kita_owner@localhost:55432/kita_plan_test";

export const templateSql = async (): Promise<string> =>
  readFile(join(MIGRATIONS_DIR, "001_core.sql"), "utf8");

export async function adminPool(): Promise<Pool> {
  return new Pool({ connectionString: ADMIN_URL, max: 2 });
}

export async function ownerPool(): Promise<Pool> {
  return new Pool({ connectionString: OWNER_URL, max: 4 });
}

/** Recreate the empty test database; guarantees a fresh target for every install run. */
export async function resetTestDatabase(pool: Pool): Promise<void> {
  await pool.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='kita_plan_test' AND pid<>pg_backend_pid()`);
  await pool.query(`DROP DATABASE IF EXISTS kita_plan_test`);
  await pool.query(`CREATE DATABASE kita_plan_test OWNER kita_owner`);
}

export async function withFreshInstall(fn: (client: PoolClient) => Promise<void>): Promise<void> {
  const admin = await adminPool();
  try {
    await resetTestDatabase(admin);
    const owner = await ownerPool();
    try {
      const client = await owner.connect();
      try {
        await migrate(client);
        await fn(client);
      } finally {
        await client.release();
      }
    } finally {
      await owner.end();
    }
  } finally {
    await admin.end();
  }
}
