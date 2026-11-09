/**
 * Fixtures mirror the reviewed kita-v1.yaml examples (F3/F7 illustrative
 * values: USD 500.00 principal + USD 3.99 fee = USD 503.99 total, receiving
 * PHP 28,710.00 at customer rate 57.42). Illustrative only — never live prices
 * and never a money-moving fixture.
 */

import type { EventList, Quote, Transfer } from "../src/contracts/types";

export const fixtureQuote: Quote = {
  id: "10000000-0000-4000-8000-000000000001",
  recipientVersionId: "20000000-0000-4000-8000-000000000001",
  principal: { currency: "USD", minor: "50000" },
  grossFee: { currency: "USD", minor: "399" },
  discount: { currency: "USD", minor: "0" },
  tax: { currency: "USD", minor: "0" },
  total: { currency: "USD", minor: "50399" },
  receive: { currency: "PHP", minor: "2871000" },
  rateNumerator: "5742",
  rateDenominator: "100",
  displayRate: "57.42",
  effectiveRate: "57.42",
  referenceRate: "58.00",
  referenceAsOf: "2026-11-09T12:00:00Z",
  pricingVersion: "US-PH-2026-11-pricing3",
  routeId: "a1000000-0000-4000-8000-000000000001",
  createdAt: "2026-11-09T12:00:00Z",
  expiresAt: "2026-11-09T12:15:00Z",
  fundingDeadline: "2026-11-09T12:15:00Z",
  availabilityAt: "2026-11-10T18:00:00Z",
  deliveryRange: {
    earliest: "2026-11-10T09:00:00Z",
    latest: "2026-11-11T18:00:00Z",
    conditions: ["Business-day cutoff 16:00 PT", "Compliance clearance required"],
  },
  disclosureHash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  disclosureVersion: "US-PH-2026-11-policy1",
  bindingPolicy: "quote-bound-until-expiry",
};

export const fixtureTransfer: Transfer = {
  id: "40000000-0000-4000-8000-000000000001",
  reference: "K-20261109-000123",
  version: "8",
  quote: fixtureQuote,
  customerStatus: "processing",
  fundingState: "settled",
  payoutState: "unknown",
  complianceState: "cleared",
  refundState: "none",
  disputeState: "none",
  fxState: "settled",
  reconciliationState: "pending",
  acceptedAt: "2026-11-09T12:01:00Z",
  allowedActions: [{ action: "viewReceipt", allowed: true }],
};

export const fixtureTimeline: EventList = {
  items: [
    {
      id: "30000000-0000-4000-8000-000000000001",
      type: "payout.recipient_credited",
      aggregateId: "40000000-0000-4000-8000-000000000001",
      aggregateVersion: "8",
      occurredAt: "2026-11-09T12:00:00Z",
      recordedAt: "2026-11-09T12:00:03Z",
      schemaVersion: 1,
      messageCode: "status.payout.checking",
      amount: { currency: "PHP", minor: "2871000" },
    },
  ],
  asOf: "2026-11-09T12:05:00Z",
};
