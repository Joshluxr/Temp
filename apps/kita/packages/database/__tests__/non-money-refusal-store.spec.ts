import { describe, expect, it } from "vitest";

import type { PoolClientLike, PoolLike } from "../src/pool.js";
import { recordNonMoneyRefusal } from "../src/non-money-refusal-store.ts";
import { pgError } from "./helpers/fake-pg.ts";

const VALID_KEY = "aaaaaaaaaaaaaaaa";
const VALID_TAG = "tag-1";
const STORED = {
  ok: false,
  error: {
    code: "CAPABILITY_UNAVAILABLE",
    status: 503,
    retryable: false,
    detail: "Command execution is unavailable.",
  },
};

function poolThatReturns(body: unknown): PoolLike {
  const client: PoolClientLike = {
    async query(sql: string) {
      if (sql.startsWith("BEGIN") || sql.startsWith("COMMIT") || sql.startsWith("ROLLBACK")) {
        return { rows: [] };
      }
      return { rows: [{ body }] };
    },
    release() {},
  };
  return {
    connect: async () => client,
    query: async () => ({ rows: [] }),
    end: async () => {},
  };
}

function poolThatThrows(err: unknown): PoolLike {
  const client: PoolClientLike = {
    async query(sql: string) {
      if (sql.startsWith("BEGIN")) return { rows: [] };
      if (sql.startsWith("ROLLBACK")) return { rows: [] };
      throw err;
    },
    release() {},
  };
  return {
    connect: async () => client,
    query: async () => ({ rows: [] }),
    end: async () => {},
  };
}

describe("recordNonMoneyRefusal — input validation", () => {
  it("rejects missing extra unicode and short keys before checkout", async () => {
    const pool: PoolLike = {
      connect: async () => {
        throw new Error("must not checkout");
      },
      query: async () => {
        throw new Error("must not query");
      },
      end: async () => {},
    };
    const cases: unknown[] = [
      null,
      [],
      { idempotencyKey: VALID_KEY },
      { idempotencyKey: VALID_KEY, requestTag: VALID_TAG, extra: true },
      { idempotencyKey: "short", requestTag: VALID_TAG },
      { idempotencyKey: VALID_KEY, requestTag: "bad tag" },
      { idempotencyKey: `${VALID_KEY}é`, requestTag: VALID_TAG },
    ];
    for (const input of cases) {
      await expect(recordNonMoneyRefusal(pool, input)).resolves.toEqual({
        ok: false,
        error: {
          code: "invalid_request",
          status: 400,
          retryable: false,
          detail: "Invalid refusal-record request.",
        },
      });
    }
  });
});

describe("recordNonMoneyRefusal — stored refusal after commit", () => {
  it("returns the frozen CAPABILITY_UNAVAILABLE envelope", async () => {
    await expect(
      recordNonMoneyRefusal(poolThatReturns(STORED), {
        idempotencyKey: VALID_KEY,
        requestTag: VALID_TAG,
      }),
    ).resolves.toEqual(STORED);
  });
});

describe("recordNonMoneyRefusal — SQLSTATE mapping", () => {
  it("maps 22023 KRF01 KRF02 KRF03 and unknown failures", async () => {
    await expect(
      recordNonMoneyRefusal(poolThatThrows(pgError("22023", "bad")), {
        idempotencyKey: VALID_KEY,
        requestTag: VALID_TAG,
      }),
    ).resolves.toMatchObject({ error: { code: "invalid_request", status: 400 } });
    await expect(
      recordNonMoneyRefusal(poolThatThrows(pgError("KRF01", "scope")), {
        idempotencyKey: VALID_KEY,
        requestTag: VALID_TAG,
      }),
    ).resolves.toMatchObject({ error: { code: "unauthorized", status: 403 } });
    await expect(
      recordNonMoneyRefusal(poolThatThrows(pgError("KRF02", "mismatch")), {
        idempotencyKey: VALID_KEY,
        requestTag: VALID_TAG,
      }),
    ).resolves.toMatchObject({ error: { code: "IDEMPOTENCY_MISMATCH", status: 409 } });
    await expect(
      recordNonMoneyRefusal(poolThatThrows(pgError("KRF03", "integrity")), {
        idempotencyKey: VALID_KEY,
        requestTag: VALID_TAG,
      }),
    ).resolves.toMatchObject({
      error: { code: "dependency_unavailable", status: 503, retryable: false },
    });
    await expect(
      recordNonMoneyRefusal(poolThatThrows(pgError("57P01", "crash")), {
        idempotencyKey: VALID_KEY,
        requestTag: VALID_TAG,
      }),
    ).resolves.toMatchObject({
      error: { code: "dependency_unavailable", status: 503, retryable: true },
    });
  });
});
