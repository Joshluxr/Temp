/**
 * Presentation helpers for the read-only mobile surfaces. No money arithmetic:
 * @kita/domain exposes no add/sub/mul/div until T-CORE-02, and totals are
 * always taken from the server's Quote terms verbatim (F3).
 */

import { formatMinorUnits, type Money } from "@kita/domain";

import { statusTone, type StatusToneKey } from "../theme/tokens";
import type { TransferCustomerStatus, TransferPayoutState, WireMoney } from "../contracts/types";

export function toDomain(money: WireMoney): Money {
  return { currency: money.currency, minor: BigInt(money.minor) };
}

/** D1: financial figures use tabular lining numerals plus the explicit currency code. */
export function formatMoney(money: WireMoney): string {
  return `${formatMinorUnits(toDomain(money))} ${money.currency}`;
}

/** D4 copy: never imply completion from a local timer or an optimistic state. */
const CUSTOMER_STATUS_TONES: Record<TransferCustomerStatus, StatusToneKey> = {
  action_required: "error",
  under_review: "pending",
  awaiting_funding: "pending",
  processing: "pending",
  delivered: "delivered",
  cancelled: "neutral",
  refund_pending: "pending",
  refunded: "delivered",
  returned: "error",
};

export function customerStatusTone(status: TransferCustomerStatus): StatusToneKey {
  return CUSTOMER_STATUS_TONES[status];
}

const PAYOUT_COPY: Record<TransferPayoutState, string> = {
  not_started: "Not started",
  queued: "Queued with our partner",
  submitting: "Submitting to our partner",
  accepted: "Accepted by our partner",
  pending: "Waiting for delivery",
  unknown: "We're checking delivery with our partner",
  paid: "Recipient received the funds",
  rejected: "Partner rejected the payout",
  cancelled: "Payout cancelled",
  partially_returned: "Part of the payout was returned",
  returned: "The payout was returned",
};

export function payoutCopy(state: TransferPayoutState): string {
  return PAYOUT_COPY[state];
}

export function toneOf(key: StatusToneKey) {
  return statusTone[key];
}

/** RFC3339 UTC -> short readable stamp; IANA zone handling stays server-side (D6). */
export function formatTimestamp(rfc3339: string): string {
  const date = new Date(rfc3339);
  if (Number.isNaN(date.getTime())) return rfc3339;
  return `${date.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

/** D3: countdown shows acceptance expiry, not marketing urgency. */
export function expiryLabel(expiresAt: string, nowMs: number): string {
  const remaining = new Date(expiresAt).getTime() - nowMs;
  if (Number.isNaN(remaining)) return "Expiry unavailable";
  if (remaining <= 0) return "This quote has expired. Request a fresh quote.";
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return `Accepts until ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
