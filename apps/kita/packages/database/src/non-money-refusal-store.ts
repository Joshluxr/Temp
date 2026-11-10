/**
 * Non-money refusal-record store (T-CORE-02 limited slice).
 * Records permanently rejected command_keys only. Never ok:true.
 * No executeCommand, sessions, or money_operations.
 */

import type { PoolLike } from "./pool.js";
import { withSerializable } from "./transaction.js";

const KEY_RE = /^[A-Za-z0-9_-]{16,128}$/;
const TAG_RE = /^[A-Za-z0-9_-]{1,64}$/;
const STORED_REFUSAL = Object.freeze({
  ok: false as const,
  error: Object.freeze({
    code: "CAPABILITY_UNAVAILABLE",
    status: 503,
    retryable: false,
    detail: "Command execution is unavailable.",
  }),
});

export type RefusalRecordFailure = {
  readonly ok: false;
  readonly error: {
    readonly code: string;
    readonly status: number;
    readonly retryable: boolean;
    readonly detail: string;
  };
};

export type RecordNonMoneyRefusalInput = {
  readonly idempotencyKey: string;
  readonly requestTag: string;
};

function sqlStateOf(err: unknown): string | undefined {
  const code = (err as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

function invalid(): RefusalRecordFailure {
  return {
    ok: false,
    error: {
      code: "invalid_request",
      status: 400,
      retryable: false,
      detail: "Invalid refusal-record request.",
    },
  };
}

function unauthorized(): RefusalRecordFailure {
  return {
    ok: false,
    error: {
      code: "unauthorized",
      status: 403,
      retryable: false,
      detail: "Refusal-record scope is unavailable.",
    },
  };
}

function mismatch(): RefusalRecordFailure {
  return {
    ok: false,
    error: {
      code: "IDEMPOTENCY_MISMATCH",
      status: 409,
      retryable: false,
      detail: "Idempotency key is bound to a different request.",
    },
  };
}

function integrity(): RefusalRecordFailure {
  return {
    ok: false,
    error: {
      code: "dependency_unavailable",
      status: 503,
      retryable: false,
      detail: "Refusal-record integrity is unavailable.",
    },
  };
}

function unconfirmed(): RefusalRecordFailure {
  return {
    ok: false,
    error: {
      code: "dependency_unavailable",
      status: 503,
      retryable: true,
      detail: "Refusal persistence is unconfirmed; retry the same key.",
    },
  };
}

function isPlainDataObject(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function validateInput(input: unknown): RefusalRecordFailure | RecordNonMoneyRefusalInput {
  if (!isPlainDataObject(input)) {
    return invalid();
  }
  const keys = Object.keys(input);
  if (keys.length !== 2 || !keys.includes("idempotencyKey") || !keys.includes("requestTag")) {
    return invalid();
  }
  const idempotencyKey = input.idempotencyKey;
  const requestTag = input.requestTag;
  if (typeof idempotencyKey !== "string" || typeof requestTag !== "string") {
    return invalid();
  }
  if (!KEY_RE.test(idempotencyKey) || !TAG_RE.test(requestTag)) {
    return invalid();
  }
  return { idempotencyKey, requestTag };
}

function mapSqlFailure(err: unknown): RefusalRecordFailure {
  const state = sqlStateOf(err);
  if (state === "22023") return invalid();
  if (state === "KRF01" || state === "42501") return unauthorized();
  if (state === "KRF02") return mismatch();
  if (state === "KRF03") return integrity();
  return unconfirmed();
}

function parseStored(row: unknown): RefusalRecordFailure {
  if (
    row &&
    typeof row === "object" &&
    (row as { ok?: unknown }).ok === false &&
    (row as { error?: { code?: unknown } }).error &&
    (row as { error: { code: unknown } }).error.code === "CAPABILITY_UNAVAILABLE"
  ) {
    return STORED_REFUSAL;
  }
  return integrity();
}

export async function recordNonMoneyRefusal(
  pool: PoolLike,
  input: unknown,
): Promise<RefusalRecordFailure> {
  const validated = validateInput(input);
  if ("error" in validated && validated.ok === false) {
    return validated;
  }
  const { idempotencyKey, requestTag } = validated as RecordNonMoneyRefusalInput;
  try {
    const stored = await withSerializable(
      pool,
      async (client) => {
        const result = await client.query("SELECT kita.record_non_money_refusal($1,$2) AS body", [
          idempotencyKey,
          requestTag,
        ]);
        return result.rows[0]?.body;
      },
      { maxAttempts: 3, retryDelayMs: 50 },
    );
    return parseStored(stored);
  } catch (err) {
    return mapSqlFailure(err);
  }
}
