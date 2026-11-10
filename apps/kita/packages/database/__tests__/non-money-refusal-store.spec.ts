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

const UNCONFIRMED = {
  ok: false as const,
  error: {
    code: "dependency_unavailable",
    status: 503,
    retryable: true,
    detail: "Refusal persistence is unconfirmed; retry the same key.",
  },
};

type QueryFn = (sql: string, params?: readonly unknown[]) => Promise<{ rows: unknown[] }>;

function instrumentedPool(options: {
  onQuery: QueryFn;
  release?: (err?: unknown) => void;
  rollback?: QueryFn;
}): { pool: PoolLike; stats: { checkouts: number; releases: number; releaseErrors: unknown[] } } {
  const stats = { checkouts: 0, releases: 0, releaseErrors: [] as unknown[] };
  const pool: PoolLike = {
    connect: async () => {
      stats.checkouts += 1;
      const client: PoolClientLike = {
        async query(sql: string, params?: readonly unknown[]) {
          if (sql.startsWith("ROLLBACK") && options.rollback) {
            return options.rollback(sql, params);
          }
          return options.onQuery(sql, params);
        },
        release(err?: unknown) {
          stats.releases += 1;
          if (err !== undefined) stats.releaseErrors.push(err);
          options.release?.(err);
        },
      };
      return client;
    },
    query: async () => ({ rows: [] }),
    end: async () => {},
  };
  return { pool, stats };
}

describe("recordNonMoneyRefusal — COMMIT ordering and unconfirmed persistence", () => {
  it("does not settle the application promise until COMMIT resolves", async () => {
    let releaseCommit: (() => void) | undefined;
    const commitHeld = new Promise<void>((resolve) => {
      releaseCommit = resolve;
    });
    let commitEntered = false;
    const { pool } = instrumentedPool({
      async onQuery(sql) {
        if (sql.startsWith("BEGIN")) return { rows: [] };
        if (sql.includes("record_non_money_refusal")) return { rows: [{ body: STORED }] };
        if (sql.startsWith("COMMIT")) {
          commitEntered = true;
          await commitHeld;
          return { rows: [] };
        }
        return { rows: [] };
      },
    });
    let settled: unknown;
    const pending = recordNonMoneyRefusal(pool, {
      idempotencyKey: VALID_KEY,
      requestTag: VALID_TAG,
    }).then((value) => {
      settled = value;
      return value;
    });
    await expect.poll(() => commitEntered).toBe(true);
    expect(settled).toBeUndefined();
    releaseCommit?.();
    await expect(pending).resolves.toEqual(STORED);
  });

  it("returns the unconfirmed envelope when COMMIT is never sent", async () => {
    const { pool, stats } = instrumentedPool({
      async onQuery(sql) {
        if (sql.startsWith("BEGIN")) return { rows: [] };
        if (sql.includes("record_non_money_refusal")) return { rows: [{ body: STORED }] };
        if (sql.startsWith("COMMIT")) {
          throw new Error("injected: COMMIT never sent");
        }
        if (sql.startsWith("ROLLBACK")) return { rows: [] };
        return { rows: [] };
      },
    });
    await expect(
      recordNonMoneyRefusal(pool, { idempotencyKey: VALID_KEY, requestTag: VALID_TAG }),
    ).resolves.toEqual(UNCONFIRMED);
    expect(stats.checkouts).toBe(1);
    expect(stats.releases).toBe(1);
  });

  it("returns the unconfirmed envelope after simulated COMMIT completion is withheld", async () => {
    const { pool, stats } = instrumentedPool({
      async onQuery(sql) {
        if (sql.startsWith("BEGIN")) return { rows: [] };
        if (sql.includes("record_non_money_refusal")) return { rows: [{ body: STORED }] };
        if (sql.startsWith("COMMIT")) {
          const completed = { rows: [] };
          void completed;
          throw Object.assign(new Error("injected: COMMIT acknowledgment withheld"), {
            name: "InjectedTransportFailure",
          });
        }
        if (sql.startsWith("ROLLBACK")) return { rows: [] };
        return { rows: [] };
      },
    });
    await expect(
      recordNonMoneyRefusal(pool, { idempotencyKey: VALID_KEY, requestTag: VALID_TAG }),
    ).resolves.toEqual(UNCONFIRMED);
    expect(stats.checkouts).toBe(1);
    expect(stats.releases).toBe(1);
  });

  it("rolls back and releases once when the function call fails before COMMIT", async () => {
    const { pool, stats } = instrumentedPool({
      async onQuery(sql) {
        if (sql.startsWith("BEGIN")) return { rows: [] };
        if (sql.includes("record_non_money_refusal")) {
          throw Object.assign(new Error("injected: function failed"), { code: "57P01" });
        }
        if (sql.startsWith("COMMIT")) {
          throw new Error("COMMIT must not run");
        }
        if (sql.startsWith("ROLLBACK")) return { rows: [] };
        return { rows: [] };
      },
    });
    await expect(
      recordNonMoneyRefusal(pool, { idempotencyKey: VALID_KEY, requestTag: VALID_TAG }),
    ).resolves.toEqual(UNCONFIRMED);
    expect(stats.checkouts).toBe(1);
    expect(stats.releases).toBe(1);
    expect(stats.releaseErrors).toEqual([]);
  });

  it("keeps the primary failure when rollback cannot confirm usability", async () => {
    const primary = Object.assign(new Error("injected: transport lost"), {
      name: "InjectedTransportFailure",
      code: "ECONNRESET",
    });
    const { pool, stats } = instrumentedPool({
      async onQuery(sql) {
        if (sql.startsWith("BEGIN")) return { rows: [] };
        if (sql.includes("record_non_money_refusal")) return { rows: [{ body: STORED }] };
        if (sql.startsWith("COMMIT")) throw primary;
        return { rows: [] };
      },
      async rollback() {
        throw new Error("injected: rollback unusable");
      },
    });
    await expect(
      recordNonMoneyRefusal(pool, { idempotencyKey: VALID_KEY, requestTag: VALID_TAG }),
    ).resolves.toEqual(UNCONFIRMED);
    expect(stats.checkouts).toBe(1);
    expect(stats.releases).toBe(1);
    expect(stats.releaseErrors).toHaveLength(1);
    expect(stats.releaseErrors[0]).toBe(primary);
  });

  it("retries structured 40001 at most three times then maps unconfirmed", async () => {
    const { pool, stats } = instrumentedPool({
      async onQuery(sql) {
        if (sql.startsWith("BEGIN")) return { rows: [] };
        if (sql.includes("record_non_money_refusal")) {
          throw Object.assign(new Error("serialization"), { code: "40001" });
        }
        if (sql.startsWith("ROLLBACK")) return { rows: [] };
        return { rows: [] };
      },
    });
    await expect(
      recordNonMoneyRefusal(pool, { idempotencyKey: VALID_KEY, requestTag: VALID_TAG }),
    ).resolves.toEqual(UNCONFIRMED);
    expect(stats.checkouts).toBe(3);
    expect(stats.releases).toBe(3);
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
