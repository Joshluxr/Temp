/**
 * Typed read-only API client for the Kita customer mobile surface.
 *
 * Two structural guarantees, both enforced by TypeScript and re-checked at
 * runtime in __tests__/no-money-mutation.test.tsx:
 *   1. The public surface is a closed map of GET operations only. There is no
 *      `method`, no body parameter, no Idempotency-Key plumbing and no way for
 *      a caller to reach a mutation path.
 *   2. No method can mint money. Nothing here calls createWalletTopup,
 *      createQuote/acceptTransfer, createFundingSession, refund/cancellation
 *      intake, admin outcome setters, or any sandbox/"simulate" helper — those
 *      capabilities do not exist on this surface at all.
 */

import { secretStore } from "../storage/secretStore";
import type { EventList, Problem, Quote, Transfer } from "../contracts/types";

/** Re-exported for screens and tests; `EventList` is the frozen timeline response. */
export type { EventList, NotificationPreferences, Quote, Transfer } from "../contracts/types";

/** Frozen contract server (kita-v1.yaml `info.version` 1.0.0-plan.2026-11-09). */
export const CUSTOMER_API_BASE_URL = "https://api.kita.example";

/** Operation IDs mirrored from kita-v1.yaml; names match the OpenAPI exactly. */
export const READ_OPERATIONS = {
  getQuote: "getQuote",
  listTransfers: "listTransfers",
  getTransfer: "getTransfer",
  getTransferTimeline: "getTransferTimeline",
} as const;

export type ReadOperationId = (typeof READ_OPERATIONS)[keyof typeof READ_OPERATIONS];

export interface ReadonlyApiClientConfig {
  readonly baseUrl?: string;
  /** Injectable for tests and for a future auth-exchange wiring; when omitted
   * the access token is read from expo-secure-store per request. */
  readonly accessTokenProvider?: () => Promise<string | null>;
  readonly fetchImpl?: typeof fetch;
}

export class ApiError extends Error {
  readonly status: number;
  readonly problem: Problem | null;

  constructor(status: number, problem: Problem | null) {
    super(problem?.title ?? `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.problem = problem;
  }

  /** F2: only transport-level retries are ordinary; ambiguity is not a business retry. */
  get retryable(): boolean {
    return this.problem?.retryable === true || this.status === 429 || this.status === 503;
  }
}

export interface ListTransfersParams {
  readonly cursor?: string;
  readonly limit?: number;
}

export interface TimelineParams {
  readonly cursor?: string;
  readonly limit?: number;
}

/** Keyset pages cap at 100 (F1); clamp rather than silently sending an invalid limit. */
const MAX_PAGE_LIMIT = 100;

/** Keyset pagination `(createdAt,id)`, max 100, with as-of snapshot (F1). */
export interface PageEnvelope<T> {
  readonly items: readonly T[];
  readonly asOf: string;
  readonly nextCursor?: string;
}

/** components/schemas/TransferList and components/schemas/EventList share this envelope shape. */
export type TransferPage = PageEnvelope<Transfer>;
export type TimelinePage = PageEnvelope<import("../contracts/types").Event>;

export interface KitaReadonlyApiClient {
  readonly operationIds: typeof READ_OPERATIONS;
  getQuote(input: { readonly quoteId: string }): Promise<Quote>;
  listTransfers(input?: ListTransfersParams): Promise<TransferPage>;
  getTransfer(input: { readonly transferId: string }): Promise<Transfer>;
  getTransferTimeline(input: {
    readonly transferId: string;
    readonly cursor?: string;
    readonly limit?: number;
  }): Promise<TimelinePage>;
  /**
   * NOT WIRED: kita-v1.yaml exposes notification preferences only through PUT
   * /v1/notification-preferences (`updateNotificationPreferences`). There is no
   * frozen GET operation, and this surface must not issue mutations. Reads are
   * served from the locally persisted draft instead; see CONTRACT-GAPS.md.
   * This is an explicit no-op returning null — it exists so the preference
   * screen has one obvious, auditable source of "no server read yet".
   */
  getNotificationPreferences(): Promise<null>;
}

function buildUrl(baseUrl: string, path: string, query: Readonly<Record<string, string | undefined>>) {
  const url = new URL(path, baseUrl);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) url.searchParams.set(key, value);
  }
  return url.toString();
}

function clampLimit(limit: number | undefined): string | undefined {
  if (limit === undefined) return undefined;
  return String(Math.min(Math.max(1, Math.trunc(limit)), MAX_PAGE_LIMIT));
}

async function resolveToken(provider: (() => Promise<string | null>) | undefined): Promise<string | null> {
  return provider ? provider() : secretStore.readAccessToken();
}

export function createReadonlyApiClient(config: ReadonlyApiClientConfig = {}): KitaReadonlyApiClient {
  const baseUrl = config.baseUrl ?? CUSTOMER_API_BASE_URL;
  const doFetch = config.fetchImpl ?? fetch;

  async function getRequest<T>(path: string, query: Record<string, string | undefined> = {}): Promise<T> {
    const token = await resolveToken(config.accessTokenProvider);
    const headers: Record<string, string> = {
      Accept: "application/json",
      // Private projections must never be cached or replayed offline as truth (F1/D9).
      "Cache-Control": "no-cache",
    };
    if (token !== null) headers.Authorization = `Bearer ${token}`;

    const response = await doFetch(buildUrl(baseUrl, path, query), {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      let problem: Problem | null = null;
      try {
        problem = (await response.json()) as Problem;
      } catch {
        problem = null;
      }
      throw new ApiError(response.status, problem);
    }
    return (await response.json()) as T;
  }

  /* Read-only surface: every request below is a GET. There is intentionally no
   * shared helper that accepts a method or a request body, so a mutation cannot
   * be added by accident at this call site. */

  return {
    operationIds: READ_OPERATIONS,
    getQuote({ quoteId }) {
      return getRequest<Quote>(`/v1/quotes/${quoteId}`);
    },
    listTransfers(input = {}) {
      return getRequest<TransferPage>("/v1/transfers", {
        cursor: input.cursor,
        limit: clampLimit(input.limit),
      });
    },
    getTransfer({ transferId }) {
      return getRequest<Transfer>(`/v1/transfers/${transferId}`);
    },
    getTransferTimeline({ transferId, cursor, limit }) {
      return getRequest<TimelinePage>(`/v1/transfers/${transferId}/timeline`, {
        cursor,
        limit: clampLimit(limit),
      });
    },
    async getNotificationPreferences() {
      // No-op: frozen contract has no GET for preferences and mobile issues no
      // mutations; the screen renders the secure-store draft until T-CONTRACT-01
      // adds a read projection.
      return null;
    },
  };
}
