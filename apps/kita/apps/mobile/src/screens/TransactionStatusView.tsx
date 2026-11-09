/**
 * Transaction status view (D2 `/activity`, D4 copy). Funding, FX, compliance,
 * payout, refund and dispute legs are rendered as independent server
 * projections; an unknown leg says "checking", never failed or delivered.
 */

import { StyleSheet, Text, View } from "react-native";

import type { EventList, Transfer } from "../contracts/types";
import { colors, radii, spacing, statusTone } from "../theme/tokens";
import { customerStatusTone, formatMoney, formatTimestamp, payoutCopy, toneOf } from "./format";

export interface TransactionStatusViewProps {
  readonly transfer: Transfer;
  readonly timeline?: EventList;
}

interface StatusBadgeProps {
  readonly label: string;
  readonly value: string;
  readonly toneKey: keyof typeof statusTone;
  readonly testID: string;
}

function StatusBadge({ label, value, toneKey, testID }: StatusBadgeProps) {
  const tone = toneOf(toneKey);
  return (
    <View style={styles.badge} testID={testID}>
      <Text style={[styles.badgeGlyph, { color: tone.color }]} accessibilityLabel={`${toneKey} status`}>
        {tone.glyph}
      </Text>
      <View style={styles.badgeText}>
        <Text style={styles.badgeLabel}>{label}</Text>
        {/* Color is always paired with the text value above (D1). */}
        <Text style={[styles.badgeValue, { color: tone.color }]}>{value}</Text>
      </View>
    </View>
  );
}

const LEG_TONES: Record<string, keyof typeof statusTone> = {
  not_started: "neutral",
  queued: "pending",
  submitting: "pending",
  pending: "pending",
  accepted: "pending",
  authorized: "pending",
  captured: "pending",
  settled: "delivered",
  paid: "delivered",
  completed: "delivered",
  matched: "delivered",
  cleared: "delivered",
  none: "neutral",
  unknown: "unknown",
  rejected: "error",
  failed: "error",
  blocked: "error",
  cancelled: "neutral",
  returned: "error",
  partially_returned: "error",
  break_open: "error",
  owed: "pending",
  partial: "pending",
  requested: "pending",
  open: "pending",
  evidence_due: "pending",
  review: "pending",
  won: "delivered",
  lost: "error",
  closed: "neutral",
};

function toneForLeg(state: string): keyof typeof statusTone {
  return LEG_TONES[state] ?? "neutral";
}

export function TransactionStatusView({ transfer, timeline }: TransactionStatusViewProps) {
  const legs = [
    { label: "Funding", state: transfer.fundingState, testID: "leg-funding" },
    { label: "Compliance", state: transfer.complianceState, testID: "leg-compliance" },
    { label: "Currency exchange", state: transfer.fxState ?? "not_started", testID: "leg-fx" },
    { label: "Payout", state: transfer.payoutState, testID: "leg-payout" },
    { label: "Refund", state: transfer.refundState, testID: "leg-refund" },
    { label: "Dispute", state: transfer.disputeState, testID: "leg-dispute" },
    { label: "Reconciliation", state: transfer.reconciliationState ?? "pending", testID: "leg-reconciliation" },
  ] as const;

  return (
    <View style={styles.surface} testID="transaction-status-view">
      <Text style={styles.reference} testID="transfer-reference">
        Reference {transfer.reference}
      </Text>
      <Text style={styles.amount} testID="transfer-receive-amount">
        Recipient receives {formatMoney(transfer.quote.receive)}
      </Text>

      <StatusBadge
        label="Overall status"
        value={transfer.customerStatus.replace(/_/g, " ")}
        toneKey={customerStatusTone(transfer.customerStatus)}
        testID="transfer-customer-status"
      />

      <Text style={styles.sectionHeading}>Independent progress</Text>
      {legs.map((leg) => (
        <StatusBadge
          key={leg.testID}
          label={leg.label}
          value={leg.label === "Payout" ? payoutCopy(transfer.payoutState) : leg.state.replace(/_/g, " ")}
          toneKey={toneForLeg(leg.state)}
          testID={leg.testID}
        />
      ))}

      <Text style={styles.updated} testID="transfer-last-updated">
        Accepted {formatTimestamp(transfer.acceptedAt)}
        {transfer.deliveredAt !== undefined ? ` - Delivered ${formatTimestamp(transfer.deliveredAt)}` : ""}
      </Text>

      {timeline !== undefined && timeline.items.length > 0 ? (
        <View testID="transfer-timeline">
          <Text style={styles.sectionHeading}>Activity</Text>
          {timeline.items.map((event) => (
            <Text key={event.id} style={styles.timelineRow} testID={`timeline-${event.type}`}>
              {formatTimestamp(event.occurredAt)} - {event.messageCode} ({event.type})
            </Text>
          ))}
          <Text style={styles.asOf} testID="timeline-as-of">
            Showing activity as of {formatTimestamp(timeline.asOf)}
          </Text>
        </View>
      ) : null}

      <Text style={styles.footnote} testID="status-footnote">
        Statuses come from our servers. If a step shows "checking", we have not confirmed either way —
        this screen cannot change any transfer.
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
    gap: spacing.md,
    padding: spacing.xl,
  },
  reference: { color: colors.textSecondary, fontSize: 14 },
  amount: { color: colors.textPrimary, fontVariant: ["tabular-nums"], fontSize: 32, fontWeight: "700" },
  sectionHeading: { color: colors.textPrimary, fontSize: 16, fontWeight: "600", marginTop: spacing.sm },
  badge: { alignItems: "flex-start", flexDirection: "row", gap: spacing.md },
  badgeGlyph: { fontSize: 16, fontWeight: "700", width: spacing.lg },
  badgeText: { flex: 1 },
  badgeLabel: { color: colors.textSecondary, fontSize: 14 },
  badgeValue: { color: colors.textPrimary, fontSize: 16, fontWeight: "500" },
  updated: { color: colors.textSecondary, fontSize: 14 },
  timelineRow: { color: colors.textSecondary, fontSize: 14 },
  asOf: { color: colors.textSecondary, fontSize: 12, marginTop: spacing.xs },
  footnote: { color: colors.textSecondary, fontSize: 14 },
});
