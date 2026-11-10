/**
 * Isolated PostgreSQL 18 harness for the non-money refusal-record slice.
 * Requires an explicit KITA_REFUSAL_TEST_OWNER_URL. No default credentials.
 */

const PINNED_HOST = "127.0.0.1";
const PINNED_PORT = "54339";
const PINNED_USER = "kita_test";
const PINNED_DB = "kita_core_test";

export function requireRefusalOwnerUrl(): string {
  const urlText = process.env.KITA_REFUSAL_TEST_OWNER_URL;
  if (typeof urlText !== "string" || urlText.length === 0) {
    throw new Error("KITA_REFUSAL_TEST_OWNER_URL is required");
  }
  let parsed: URL;
  try {
    parsed = new URL(urlText);
  } catch {
    throw new Error("KITA_REFUSAL_TEST_OWNER_URL is not a valid URL");
  }
  if (parsed.hostname !== PINNED_HOST) {
    throw new Error("KITA_REFUSAL_TEST_OWNER_URL host is not the pinned test host");
  }
  if (parsed.port !== PINNED_PORT) {
    throw new Error("KITA_REFUSAL_TEST_OWNER_URL port is not the pinned test port");
  }
  if (parsed.username !== PINNED_USER) {
    throw new Error("KITA_REFUSAL_TEST_OWNER_URL login is not the pinned test owner");
  }
  const database = parsed.pathname.replace(/^\//, "");
  if (database !== PINNED_DB) {
    throw new Error("KITA_REFUSAL_TEST_OWNER_URL database is not the pinned test database");
  }
  return urlText;
}

export function postgresSuiteSelected(): boolean {
  return process.env.KITA_REFUSAL_PG_TEST === "1";
}
