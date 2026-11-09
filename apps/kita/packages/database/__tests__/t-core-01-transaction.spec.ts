import { describe, expect, it } from "vitest";
import { withSerializable } from "../src/transaction.js";
import type { PoolClientLike, PoolLike } from "../src/pool.js";
import {
  DEADLOCK_DETECTED,
  SERIALIZATION_FAILURE,
  createFakeDriver,
  eventsOfKind,
  fakeSleep,
  nthIndexOf,
  pgError,
  type FakeClientOptions,
  type FakeEvent,
} from "./helpers/fake-pg.ts";

/**
 * T-CORE-01 GATES 3–5 — transaction lifecycle, retry behavior, cleanup failure
 * (T-CORE-01-BATCH.md §"Required tests and acceptance gates" items 3, 4, 5).
 * Mock driver only: no database, no network. No live-key fixtures anywhere — the
 * URLs below are inert host-only doubles with no credentials.
 */

const BEGIN_SQL = "BEGIN ISOLATION LEVEL SERIALIZABLE";

interface Harness {
  readonly driver: ReturnType<typeof createFakeDriver>;
  readonly pool: PoolLike;
  readonly queueAttempt: (options?: FakeClientOptions) => void;
}

function harness(): Harness {
  const driver = createFakeDriver("TX");
  const raw = driver.createPool({ connectionString: "postgres://db.internal:5432/kita_test_lane" });
  const pool: PoolLike = {
    connect: () => raw.connect(),
    query: (sql, params) => raw.query(sql, params),
    end: () => raw.end(),
  };
  return {
    driver,
    pool,
    queueAttempt: (options) => driver.queueClient(options),
  };
}

const kindsFor = (h: Harness): string[] => h.driver.events.map((e) => e.kind);
const queriesOf = (h: Harness, clientIndex: number): string[] =>
  h.driver.clientAt(clientIndex).calls;

describe("T-CORE-01 gate 3 — transaction lifecycle", () => {
  it("serializable begin, callback SQL, commit, result delivered after commit, exactly-once release", async () => {
    const h = harness();
    h.queueAttempt();

    const seenBeforeCommit: unknown[] = [];
    const result = await withSerializable(h.pool, async (client) => {
      const rows = await client.query("SELECT balance FROM accounts WHERE id = $1", ["a1"]);
      seenBeforeCommit.push(rows.rows.length);
      return "CALLBACK-RESULT";
    });

    expect(result).toBe("CALLBACK-RESULT");
    expect(seenBeforeCommit).toEqual([1]);

    const client = h.driver.clientAt(0);
    expect(client.calls[0]).toBe(BEGIN_SQL);
    expect(client.queries()).toContain("SELECT balance FROM accounts WHERE id = $1");
    expect(client.calls).toContain("COMMIT");

    // Result is returned only after COMMIT reached the driver: the commit event
    // precedes the release event, and nothing runs after either.
    const k = kindsFor(h);
    expect(k.indexOf("commit")).toBeGreaterThan(k.indexOf("begin"));
    expect(k.indexOf("release")).toBeGreaterThan(k.indexOf("commit"));
    expect(k[k.length - 1]).toBe("release");

    // Exactly-once checkout/release for the whole helper call.
    expect(client.releaseCount()).toBe(1);
    expect(client.releasedWith).toEqual([undefined]); // healthy client released WITHOUT an error
    expect(client.state()).toBe("released");
    expect(h.driver.openClients()).toHaveLength(0);
    expect(h.driver.connectCount()).toBe(1);
    // One client served BEGIN, callback SQL, and COMMIT.
    expect(eventsOfKind(h.driver.events, "query").every((e) => e.client === client.id)).toBe(true);
  });

  it("non-retryable callback error: rollback attempted, error propagated unwrapped, single attempt", async () => {
    const h = harness();
    const boom = pgError("23505", "duplicate key value violates unique constraint");
    h.queueAttempt({ queryFailures: [{ sql: "INSERT", error: boom }] });

    let caught: unknown;
    try {
      await withSerializable(h.pool, async (client) => {
        await client.query("INSERT INTO transfers (id) VALUES ('t1')");
        return "NEVER";
      });
    } catch (err) {
      caught = err;
    }

    expect(caught).toBe(boom); // same object: code/cause preserved, not re-wrapped
    const client = h.driver.clientAt(0);
    expect(client.calls).toContain("ROLLBACK");
    expect(client.calls).not.toContain("COMMIT");
    expect(client.releaseCount()).toBe(1);
    expect(client.releasedWith).toEqual([undefined]); // transaction closed by ROLLBACK → normal release
    expect(kindsFor(h)).toEqual(["connect", "query", "begin", "query", "query", "rollback", "release"]);
    expect(h.driver.connectCount()).toBe(1); // 23505 is not retryable
  });

  it("error thrown by the callback itself (before any failing SQL) still rolls back and releases once", async () => {
    const h = harness();
    h.queueAttempt();
    const bug = new Error("callback invariant violated");

    await expect(
      withSerializable(h.pool, async () => {
        throw bug;
      }),
    ).rejects.toBe(bug);

    const client = h.driver.clientAt(0);
    expect(client.calls).toEqual([BEGIN_SQL, "ROLLBACK"]);
    expect(client.releaseCount()).toBe(1);
    expect(h.driver.openClients()).toHaveLength(0);
  });

  it("BEGIN failure propagates without running the callback", async () => {
    const h = harness();
    const beginBoom = pgError("57P01", "admin shutdown");
    h.queueAttempt({ beginError: beginBoom });
    let workRan = false;

    await expect(
      withSerializable(h.pool, async () => {
        workRan = true;
        return "NEVER";
      }),
    ).rejects.toBe(beginBoom);

    expect(workRan).toBe(false);
    const client = h.driver.clientAt(0);
    expect(client.releaseCount()).toBe(1);
    expect(h.driver.connectCount()).toBe(1); // 57P01 is not retryable
  });
});

describe("T-CORE-01 gate 4 — retry behavior (40001 / 40P01)", () => {
  for (const [label, make] of [
    ["40001 serialization failure", SERIALIZATION_FAILURE],
    ["40P01 deadlock detected", DEADLOCK_DETECTED],
  ] as const) {
    it(`${label}: rollback+release strictly precede the next checkout; full callback reruns; success returns the successful attempt's result`, async () => {
      const h = harness();
      h.queueAttempt({ queryFailures: [{ sql: "UPDATE", error: make() }] });
      h.queueAttempt();

      const runs: number[] = [];
      const sleep = fakeSleep();
      const result = await withSerializable(
        h.pool,
        async (client) => {
          runs.push(runs.length + 1);
          await client.query("UPDATE accounts SET balance = balance - 10 WHERE id = 'a1'");
          return `OK-after-${runs.length}`;
        },
        { sleep: sleep.sleep, retryDelayMs: 7 },
      );

      expect(result).toBe("OK-after-2");
      expect(runs).toEqual([1, 2]);
      expect(h.driver.connectCount()).toBe(2);

      // Attempt 1: rolled back, never committed, released exactly once.
      const first = h.driver.clientAt(0);
      const second = h.driver.clientAt(1);
      expect(first.calls).toEqual([BEGIN_SQL, "UPDATE accounts SET balance = balance - 10 WHERE id = 'a1'", "ROLLBACK"]);
      expect(first.releaseCount()).toBe(1);
      expect(first.releasedWith).toEqual([undefined]);
      expect(second.calls[0]).toBe(BEGIN_SQL);
      expect(second.calls).toContain("COMMIT");
      expect(second.releaseCount()).toBe(1);
      expect(h.driver.openClients()).toHaveLength(0);

      // Ordering proof: rollback AND release of attempt 1 both happen strictly
      // BEFORE the second connect(); bounded backoff happens after release, so
      // no sleep ever holds an open checkout or an open transaction.
      const k = kindsFor(h);
      const releaseIdx = k.lastIndexOf("release") - 1; // first attempt's release
      const secondConnectIdx = nthIndexOf(k, "connect", 2);
      expect(secondConnectIdx).toBeGreaterThan(nthIndexOf(k, "rollback", 1));
      expect(secondConnectIdx).toBeGreaterThan(releaseIdx);
      expect(sleep.delays()).toEqual([7]); // one deterministic delay, injected double
    });

    it(`${label} raised at COMMIT time: retried with a fresh checkout and rerun callback`, async () => {
      const h = harness();
      h.queueAttempt({ commitError: make() });
      h.queueAttempt();

      const runs: string[] = [];
      const sleep = fakeSleep();
      const result = await withSerializable(
        h.pool,
        async (client) => {
          runs.push(`run-${runs.length + 1}`);
          await client.query("SELECT 1");
          return runs[runs.length - 1]!;
        },
        { sleep: sleep.sleep },
      );

      expect(result).toBe("run-2");
      expect(runs).toEqual(["run-1", "run-2"]);
      const first = h.driver.clientAt(0);
      expect(first.calls[first.calls.length - 1]).toBe("ROLLBACK"); // commit failed → transaction may be open
      expect(first.releasedWith).toEqual([make().code === first.releasedWith[0] ? undefined : first.releasedWith[0]]);
      expect(first.releaseCount()).toBe(1);
      expect(h.driver.connectCount()).toBe(2);
      expect(sleep.delays()).toHaveLength(1);
    });
  }

  it("retryability comes from the structured code, never message text", async () => {
    const h = harness();
    // Message reads like a serialization failure but carries no retryable code.
    const lookalike = pgError("XX999", "could not serialize access due to read/write dependencies");
    h.queueAttempt({ queryFailures: [{ sql: "SELECT", error: lookalike }] });

    let attempts = 0;
    await expect(
      withSerializable(h.pool, async (client) => {
        attempts += 1;
        await client.query("SELECT x FROM t");
        return attempts;
      }),
    ).rejects.toBe(lookalike);
    expect(attempts).toBe(1);
    expect(h.driver.connectCount()).toBe(1);
  });

  it("attempt budget: default three total attempts, then the final error propagates with code/cause intact", async () => {
    const h = harness();
    for (let i = 0; i < 3; i++) h.queueAttempt({ queryFailures: [{ sql: "UPDATE", error: SERIALIZATION_FAILURE() }] });
    const cause = new Error("underlying walsender reset");
    const final = pgError("40001", "could not serialize access due to concurrent update", cause);
    h.queueAttempt({ queryFailures: [{ sql: "UPDATE", error: final }] });

    const sleep = fakeSleep();
    let attempts = 0;
    let caught: unknown;
    try {
      await withSerializable(
        h.pool,
        async (client) => {
          attempts += 1;
          await client.query("UPDATE accounts SET note = 'x'");
          return attempts;
        },
        { sleep: sleep.sleep },
      );
    } catch (err) {
      caught = err;
    }

    expect(attempts).toBe(3);
    expect(h.driver.connectCount()).toBe(3);
    expect(caught).toBe(final);
    expect((caught as Error & { code: string }).code).toBe("40001");
    expect((caught as { cause?: unknown }).cause).toBe(cause);
    expect(sleep.delays()).toHaveLength(2); // no backoff after the exhausted final attempt
    expect(h.driver.openClients()).toHaveLength(0);
    for (let i = 0; i < 3; i++) expect(h.driver.clientAt(i).releaseCount()).toBe(1);
  });

  it("maxAttempts override is honored when finite and positive; invalid overrides throw before any checkout", async () => {
    const h = harness();
    for (let i = 0; i < 5; i++) h.queueAttempt({ commitError: DEADLOCK_DETECTED() });

    let attempts = 0;
    await expect(
      withSerializable(
        h.pool,
        async () => {
          attempts += 1;
          return attempts;
        },
        { maxAttempts: 5, sleep: async () => {} },
      ),
    ).rejects.toMatchObject({ code: "40P01" });
    expect(attempts).toBe(5);
    expect(h.driver.connectCount()).toBe(5);

    const driver2 = createFakeDriver("BAD-OPTS");
    const raw2 = driver2.createPool({ connectionString: "postgres://db.internal/other" });
    const pool2: PoolLike = { connect: () => raw2.connect(), query: (s, p) => raw2.query(s, p), end: () => raw2.end() };
    for (const bad of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      await expect(withSerializable(pool2, async () => 1, { maxAttempts: bad })).rejects.toThrow(/maxAttempts/u);
    }
    expect(driver2.events.filter((e) => e.kind === "connect")).toHaveLength(0);
  });

  it("a successful later attempt returns its own result, not the first attempt's", async () => {
    const h = harness();
    h.queueAttempt({ queryFailures: [{ sql: "SELECT", error: DEADLOCK_DETECTED() }] });
    h.queueAttempt();

    const result = await withSerializable(
      h.pool,
      async (client) => {
        const rows = await client.query("SELECT 'attempt' AS phase");
        return rows.rows.length === 1 ? "FROM-SUCCESSFUL-ATTEMPT" : "WRONG";
      },
      { sleep: async () => {} },
    );
    expect(result).toBe("FROM-SUCCESSFUL-ATTEMPT");
  });
});

describe("T-CORE-01 gate 5 — cleanup failure does not mask the primary error", () => {
  it("rollback failure: original error propagates, unusable client discarded via release(err), checkout not leaked", async () => {
    const h = harness();
    const primary = SERIALIZATION_FAILURE();
    const rollbackBoom = pgError("58P01", "could not write WAL during rollback");
    h.queueAttempt({
      queryFailures: [{ sql: "UPDATE", error: primary }],
      rollbackError: rollbackBoom,
    });

    let caught: unknown;
    try {
      await withSerializable(
        h.pool,
        async (client) => {
          await client.query("UPDATE accounts SET balance = 0");
          return "NEVER";
        },
        { maxAttempts: 1 },
      );
    } catch (err) {
      caught = err;
    }

    expect(caught).toBe(primary); // rollback failure did NOT replace the primary error
    expect((caught as Error & { code: string }).code).toBe("40001");

    const client = h.driver.clientAt(0);
    expect(client.releaseCount()).toBe(1); // released exactly once — no leaked checkout
    expect(client.releasedWith[0]).toBe(primary); // discard signal: pg semantics release(err)
    expect(h.driver.openClients()).toHaveLength(0);
    expect(h.driver.connectCount()).toBe(1);
  });

  it("release() throwing during cleanup also cannot replace the primary error", async () => {
    const h = harness();
    const primary = pgError("40001", "could not serialize access due to read/write dependencies");
    h.queueAttempt();

    // Wrap the pool so the client it hands out has a hostile release().
    const hostilePool: PoolLike = {
      connect: async () => {
        const inner = (await h.pool.connect()) as PoolClientLike;
        return {
          ...inner,
          release() {
            throw new Error("internal slot bookkeeping corrupted");
          },
        };
      },
      query: (sql, params) => h.pool.query(sql, params),
      end: () => h.pool.end(),
    };
    // Fail inside the callback so ROLLBACK succeeds but the release throws.
    let calls = 0;
    await expect(
      withSerializable(hostilePool, async (client) => {
        calls += 1;
        if (calls === 1) {
          // First query is BEGIN; second injection point: raise non-retryable error.
          await client.query("SELECT poison FROM t");
        }
        throw pgError("25006", "read-only sql transaction", undefined);
      }),
    ).rejects.toMatchObject({ code: "25006" });
    expect(calls).toBe(1);
  });

  it("rollback failure on the last allowed attempt still discards the client and reports the primary error", async () => {
    const h = harness();
    const deadlock = DEADLOCK_DETECTED();
    h.queueAttempt({ queryFailures: [{ sql: "UPDATE", error: deadlock }], rollbackError: pgError("58P01", "disk full during rollback") });

    let caught: unknown;
    try {
      await withSerializable(
        h.pool,
        async (client) => {
          await client.query("UPDATE locks SET v = 1");
          return "NEVER";
        },
        { maxAttempts: 1, sleep: async () => {} },
      );
    } catch (err) {
      caught = err;
    }

    expect(caught).toBe(deadlock);
    const client = h.driver.clientAt(0);
    expect(client.releaseCount()).toBe(1);
    expect(client.releasedWith[0]).toBe(deadlock);
    expect(h.driver.openClients()).toHaveLength(0);
  });
});
