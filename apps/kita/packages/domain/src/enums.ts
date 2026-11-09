/**
 * @kita/domain — string-literal union types derived VERBATIM from the CHECK
 * constraints in docs/kita-plan/sql/001_core.sql (Kita planning artifact,
 * 2026-11-09, PostgreSQL 18 target). Each type cites its table/column. If the
 * SQL changes, this file must change in the same contracts-freeze PR
 * (T-CONTRACT-01) — do not drift it independently.
 *
 * These are compile-time types only: no runtime enums, no state machines, no
 * transition logic (reducers arrive with T-CORE-02).
 */

/** books.status — 001_core.sql line 14: CHECK(status IN ('disabled','sandbox','live','closed')). Default: 'disabled'. */
export type BookStatus = 'disabled' | 'sandbox' | 'live' | 'closed';

/** customers.status — 001_core.sql line 15: CHECK(status IN ('pending','active','restricted','closed')). Default: 'pending'. */
export type CustomerStatus = 'pending' | 'active' | 'restricted' | 'closed';

/** provider_accounts.environment — 001_core.sql line 18. */
export type ProviderEnvironment = 'sandbox' | 'production';

/** transfers.compliance_state — 001_core.sql line 23. Default: 'pending'. */
export type TransferComplianceState = 'pending' | 'review' | 'cleared' | 'blocked';

/** transfers.lifecycle — 001_core.sql line 23. Default: 'active'. */
export type TransferLifecycle = 'active' | 'cancelled' | 'closed';

/** money_operations.kind — 001_core.sql line 25. */
export type MoneyOperationKind =
  | 'remittance'
  | 'topup'
  | 'withdrawal'
  | 'wallet_conversion'
  | 'wallet_transfer'
  | 'bill'
  | 'treasury';

/** money_operations.state — 001_core.sql line 25. Default: 'accepted'. */
export type MoneyOperationState =
  | 'accepted'
  | 'processing'
  | 'unknown'
  | 'completed'
  | 'cancelled'
  | 'failed';

/** recipient_versions.method (payout methods) — 001_core.sql line 21. */
export type PayoutMethod = 'bank' | 'gcash' | 'maya' | 'cash_pickup' | 'bill';

/** funding_instruments.method (funding methods) — 001_core.sql line 26. */
export type FundingMethod = 'ach' | 'debit' | 'credit' | 'apple_pay' | 'google_pay';

/** funding_instruments.state — 001_core.sql line 26. */
export type FundingInstrumentState = 'pending' | 'verified' | 'restricted' | 'revoked';

/** auth_sessions.audience — 001_core.sql line 29. */
export type SessionAudience = 'kita-customer' | 'kita-admin';

/** holds.scope — 001_core.sql line 38. */
export type HoldScope = 'all' | 'funding' | 'fx' | 'payout' | 'refund' | 'withdrawal';

/** command_keys.state — 001_core.sql line 40. */
export type CommandKeyState = 'running' | 'succeeded' | 'rejected' | 'unknown';

/** provider_attempts.leg — 001_core.sql line 41. */
export type ProviderAttemptLeg = 'funding' | 'fx' | 'payout' | 'refund';

/** provider_attempts.state — 001_core.sql line 41. Default: 'queued'. Legal transitions live in the attempt_edges table, NOT here. */
export type ProviderAttemptState =
  | 'queued'
  | 'submitting'
  | 'pending'
  | 'authorized'
  | 'captured'
  | 'settled'
  | 'accepted'
  | 'unknown'
  | 'paid'
  | 'rejected'
  | 'cancelled'
  | 'returned'
  | 'partially_returned';

/** ledger_accounts.account_type — 001_core.sql line 55. */
export type LedgerAccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

/** ledger_accounts.normal_side / journal_lines.side — 001_core.sql lines 55, 58. */
export type NormalSide = 'D' | 'C';

/** accounting_periods.state — 001_core.sql line 35. */
export type AccountingPeriodState = 'open' | 'closed';

/** limit_reservations.state / liquidity_reservations.state / reward_reservations.state — 001_core.sql lines 34, 60, 88. */
export type ReservationState = 'reserved' | 'consumed' | 'released';

/** disputes.state — 001_core.sql line 63. */
export type DisputeState = 'open' | 'evidence_due' | 'won' | 'lost' | 'closed';

/** inbox.state — 001_core.sql line 64. Default: 'received'. */
export type InboxState = 'received' | 'processing' | 'applied' | 'quarantined';

/** timers.state — 001_core.sql line 68. */
export type TimerState = 'scheduled' | 'claimed' | 'fired' | 'cancelled';

/** approvals.state — 001_core.sql line 72. Default: 'pending'. */
export type ApprovalState = 'pending' | 'approved' | 'rejected' | 'executed' | 'invalidated';

/** approval_decisions.decision — 001_core.sql line 73. */
export type ApprovalDecision = 'approved' | 'rejected';

/** cases.kind — 001_core.sql line 75. */
export type CaseKind =
  | 'kyc'
  | 'aml'
  | 'fraud'
  | 'support'
  | 'complaint'
  | 'error'
  | 'refund'
  | 'reconciliation'
  | 'provider_rfi'
  | 'recovery';

/** cases.state — 001_core.sql line 75. */
export type CaseState =
  | 'open'
  | 'investigating'
  | 'awaiting_customer'
  | 'awaiting_provider'
  | 'resolved'
  | 'closed';

/** identity_decisions.state — 001_core.sql line 76. */
export type IdentityDecisionState =
  | 'pending'
  | 'approved'
  | 'needs_info'
  | 'rejected'
  | 'expired'
  | 'review';

/** screenings.decision — 001_core.sql line 77. */
export type ScreeningDecision = 'clear' | 'review' | 'blocked';

/** documents.scan_state — 001_core.sql line 78. */
export type DocumentScanState = 'quarantine' | 'clean' | 'rejected';

/** reconciliation_breaks.kind — 001_core.sql line 82. */
export type ReconciliationBreakKind =
  | 'timing'
  | 'missing_internal'
  | 'missing_external'
  | 'duplicate'
  | 'amount'
  | 'fee'
  | 'fx'
  | 'unknown_cash';

/** notifications.channel — 001_core.sql line 85. */
export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app';

/** notifications.category — 001_core.sql line 85. */
export type NotificationCategory = 'service' | 'security' | 'marketing';

/** notifications.state — 001_core.sql line 85. */
export type NotificationState =
  | 'queued'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'unknown'
  | 'failed'
  | 'suppressed';

/** rate_alerts.direction — 001_core.sql line 86. */
export type RateAlertDirection = 'above' | 'below';

/** rate_alerts.basis — 001_core.sql line 86. */
export type RateAlertBasis = 'reference' | 'customer_rate' | 'effective_value';

/** rate_alerts.state — 001_core.sql line 86. */
export type RateAlertState = 'armed' | 'triggered' | 'paused' | 'expired';

/** point_events.kind — 001_core.sql line 90. */
export type PointEventKind =
  | 'earn'
  | 'vest'
  | 'reserve'
  | 'redeem'
  | 'release'
  | 'expire'
  | 'reverse'
  | 'adjust';

/** referrals.state — 001_core.sql line 91. */
export type ReferralState = 'pending' | 'review' | 'qualified' | 'vested' | 'reversed' | 'rejected';

/** schedules.kind — 001_core.sql line 92. */
export type ScheduleKind = 'reminder' | 'scheduled_transfer' | 'auto_conversion';

/** schedules.state — 001_core.sql line 92. */
export type ScheduleState = 'active' | 'paused' | 'revoked' | 'expired';

/** schedule_runs.state — 001_core.sql line 93. */
export type ScheduleRunState =
  | 'due'
  | 'consent_required'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'skipped';

/** bill_payments.state — 001_core.sql line 94. */
export type BillPaymentState =
  | 'validated'
  | 'submitted'
  | 'accepted'
  | 'posted'
  | 'unknown'
  | 'rejected'
  | 'reversed';

/** treasury_movements.kind — 001_core.sql line 95. */
export type TreasuryMovementKind = 'fiat' | 'stablecoin';

/** treasury_movements.state — 001_core.sql line 95. */
export type TreasuryMovementState =
  | 'authorized'
  | 'submitted'
  | 'unknown'
  | 'confirmed'
  | 'settled'
  | 'failed'
  | 'reorged';

/** batches.state — 001_core.sql line 97. */
export type BatchState =
  | 'validated'
  | 'approved'
  | 'processing'
  | 'completed'
  | 'partial'
  | 'cancelled';

/** case_messages.visibility — 001_core.sql line 99. */
export type CaseMessageVisibility = 'customer' | 'staff' | 'aml_only';

/** notification_attempts.state — 001_core.sql line 100. */
export type NotificationAttemptState = 'submitted' | 'delivered' | 'unknown' | 'failed';
