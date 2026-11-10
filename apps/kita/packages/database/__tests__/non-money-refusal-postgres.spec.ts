import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { recordNonMoneyRefusal } from "../src/non-money-refusal-store.ts";
import {
  postgresSuiteSelected,
  provisionRefusalFixtures,
  type RefusalPgFixtures,
} from "./helpers/non-money-refusal-pg.ts";

const selected = postgresSuiteSelected();
const KEY = "aaaaaaaaaaaaaaaa";
const TAG = "tag-one";
const STORED = {
  ok: false as const,
  error: {
    code: "CAPABILITY_UNAVAILABLE",
    status: 503,
    retryable: false,
    detail: "Command execution is unavailable.",
  },
};

describe.skipIf(!selected)("non-money refusal PostgreSQL 18 evidence", () => {
  let fx: RefusalPgFixtures;

  beforeAll(async () => {
    fx = await provisionRefusalFixtures();
  });

  afterAll(async () => {
    /* Restricted pools close with the process; credentials stay in memory only. */
  });

  it("records a rejected command_keys row and replays the same refusal", async () => {
    const poolA = fx.poolFor(fx.loginA.url);
    const first = await recordNonMoneyRefusal(poolA, {
      idempotencyKey: KEY,
      requestTag: TAG,
    });
    expect(first).toEqual(STORED);
    const second = await recordNonMoneyRefusal(poolA, {
      idempotencyKey: KEY,
      requestTag: TAG,
    });
    expect(second).toEqual(STORED);
  });

  it("rejects a changed tag for the same key without overwriting", async () => {
    const poolA = fx.poolFor(fx.loginA.url);
    const mismatch = await recordNonMoneyRefusal(poolA, {
      idempotencyKey: KEY,
      requestTag: "tag-two",
    });
    expect(mismatch).toEqual({
      ok: false,
      error: {
        code: "IDEMPOTENCY_MISMATCH",
        status: 409,
        retryable: false,
        detail: "Idempotency key is bound to a different request.",
      },
    });
    const replay = await recordNonMoneyRefusal(poolA, {
      idempotencyKey: KEY,
      requestTag: TAG,
    });
    expect(replay).toEqual(STORED);
  });

  it("isolates the same textual key across actors and books", async () => {
    const poolB = fx.poolFor(fx.loginB.url);
    const poolC = fx.poolFor(fx.loginC.url);
    await expect(
      recordNonMoneyRefusal(poolB, { idempotencyKey: KEY, requestTag: TAG }),
    ).resolves.toEqual(STORED);
    await expect(
      recordNonMoneyRefusal(poolC, { idempotencyKey: KEY, requestTag: TAG }),
    ).resolves.toEqual(STORED);
  });

  it("refuses an unbound recorder login without writing", async () => {
    const poolU = fx.poolFor(fx.loginUnbound.url);
    await expect(
      recordNonMoneyRefusal(poolU, { idempotencyKey: KEY, requestTag: TAG }),
    ).resolves.toEqual({
      ok: false,
      error: {
        code: "unauthorized",
        status: 403,
        retryable: false,
        detail: "Refusal-record scope is unavailable.",
      },
    });
  });

  it("denies direct command_keys SELECT from a restricted login", async () => {
    const poolA = fx.poolFor(fx.loginA.url);
    const client = await poolA.connect();
    try {
      await expect(client.query("SELECT id FROM kita.command_keys")).rejects.toMatchObject({
        code: "42501",
      });
    } finally {
      client.release();
    }
  });
});
