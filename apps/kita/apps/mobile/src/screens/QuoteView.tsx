/**
 * Read-only quote view (D3). Money input and quote creation stay in the shared
 * web QuoteCalculator contract; this screen renders server-returned terms only
 * and offers no confirm/pay control (F4: UI availability is not authorization,
 * and mobile issues no financial mutations).
 */

import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { Quote } from "../contracts/types";
import { colors, radii, spacing } from "../theme/tokens";
import { expiryLabel, formatMoney } from "./format";

export interface QuoteViewProps {
  readonly quote: Quote;
  /** Injectable for deterministic tests; defaults to device clock. */
  readonly nowMs?: number;
}

interface RowProps {
  readonly label: string;
  readonly value: string;
  readonly testID: string;
  readonly emphasis?: "money" | "normal";
}

function Row({ label, value, testID, emphasis = "normal" }: RowProps) {
  return (
    <View style={styles.row} testID={testID}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text
        style={[styles.rowValue, emphasis === "money" ? styles.money : null]}
        accessibilityRole="text"
      >
        {value}
      </Text>
    </View>
  );
}

export function QuoteView({ quote, nowMs = Date.now() }: QuoteViewProps) {
  const rows = useMemo(
    () => [
      { label: "You send", value: formatMoney(quote.principal), testID: "quote-principal" },
      { label: "Fee", value: formatMoney(quote.grossFee), testID: "quote-fee" },
      { label: "Discount", value: formatMoney(quote.discount), testID: "quote-discount" },
      { label: "Tax", value: formatMoney(quote.tax), testID: "quote-tax" },
      { label: "Total", value: formatMoney(quote.total), testID: "quote-total", emphasis: "money" as const },
      { label: "Recipient receives", value: formatMoney(quote.receive), testID: "quote-receive", emphasis: "money" as const },
    ],
    [quote],
  );

  return (
    <View style={styles.surface} testID="quote-view">
      <Text style={styles.heading}>Quote terms</Text>
      <Text style={styles.subheading}>Locked when accepted. Background refreshes never change these values.</Text>

      {rows.map((row) => (
        <Row key={row.testID} {...row} />
      ))}

      <Row label="Your rate" value={quote.effectiveRate} testID="quote-effective-rate" />
      {quote.referenceRate !== undefined ? (
        <Row label="Reference rate" value={quote.referenceRate} testID="quote-reference-rate" />
      ) : null}
      {quote.roundingAdjustmentDestinationMinor !== undefined ? (
        <Row
          label="Rounding adjustment (destination)"
          value={quote.roundingAdjustmentDestinationMinor}
          testID="quote-rounding-adjustment"
        />
      ) : null}

      <Row label="Arrival window" value={`${quote.deliveryRange.earliest} to ${quote.deliveryRange.latest}`} testID="quote-delivery-range" />
      <Row label="Available from" value={quote.availabilityAt} testID="quote-availability" />
      <Row label="Pricing version" value={quote.pricingVersion} testID="quote-pricing-version" />

      <Text style={styles.expiry} testID="quote-expiry">{expiryLabel(quote.expiresAt, nowMs)}</Text>
      {quote.deliveryRange.conditions.length > 0 ? (
        <Text style={styles.conditions} testID="quote-conditions">
          Conditions: {quote.deliveryRange.conditions.join("; ")}
        </Text>
      ) : null}

      <Text style={styles.footnote} testID="quote-read-only-note">
        Read-only view. Confirming and paying happens on the web calculator after a fresh quote —
        this app cannot start or change a transfer.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    backgroundColor: colors.paper,
    borderColor: colors.warm,
    borderRadius: radii.surface,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
    padding: spacing.xl,
  },
  heading: { color: colors.textPrimary, fontSize: 20, fontWeight: "600" },
  subheading: { color: colors.textSecondary, fontSize: 14, marginBottom: spacing.md },
  row: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  rowLabel: { color: colors.textSecondary, flexShrink: 1, fontSize: 16 },
  rowValue: { color: colors.textPrimary, fontSize: 16, fontWeight: "500", textAlign: "right" },
  money: { fontVariant: ["tabular-nums"], fontSize: 22, fontWeight: "700" },
  expiry: { color: colors.pending, fontSize: 14, marginTop: spacing.md },
  conditions: { color: colors.textSecondary, fontSize: 14 },
  footnote: { color: colors.textSecondary, fontSize: 14, marginTop: spacing.md },
});
