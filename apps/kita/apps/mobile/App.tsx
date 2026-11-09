/**
 * Kita mobile — read-only customer surface (T-PLAT-01 continuation).
 *
 * Bottom-tab structure follows D2/Mobile: Quote / Activity / Notifications.
 * Every screen renders server projections; there is no path from this app to a
 * financial mutation, a sandbox balance, or a KYC bypass. Data loading uses an
 * injected reader so tests never hit the network and offline builds show a
 * stale label instead of a fabricated state (D2/D9).
 */

import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { createReadonlyApiClient, type KitaReadonlyApiClient } from "./src/api/client";
import type { EventList, NotificationPreferences, Quote, Transfer } from "./src/contracts/types";
import { isNotificationPreferences } from "./src/contracts/types";
import { NotificationPreferenceView } from "./src/screens/NotificationPreferenceView";
import { QuoteView } from "./src/screens/QuoteView";
import { TransactionStatusView } from "./src/screens/TransactionStatusView";
import { secretStore } from "./src/storage/secretStore";
import { colors, spacing } from "./src/theme/tokens";

type TabKey = "quote" | "activity" | "notifications";

const TABS: readonly { key: TabKey; label: string }[] = [
  { key: "quote", label: "Quote" },
  { key: "activity", label: "Activity" },
  { key: "notifications", label: "Alerts" },
];

interface MobileAppProps {
  /** Injected for tests/offline demos; defaults to the frozen GET-only client. */
  readonly client?: KitaReadonlyApiClient;
  /** Demo corridor sample from kita-v1.yaml examples (F7 illustrative values). */
  readonly demoQuoteId?: string;
  readonly demoTransferId?: string;
}

export default function App({
  client = createReadonlyApiClient(),
  demoQuoteId = "10000000-0000-4000-8000-000000000001",
  demoTransferId = "40000000-0000-4000-8000-000000000001",
}: MobileAppProps) {
  const [tab, setTab] = useState<TabKey>("quote");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [timeline, setTimeline] = useState<EventList | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "offline">("loading");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const draftRaw = await secretStore.readPreferencesDraft();
      if (draftRaw !== null) {
        const parsed: unknown = JSON.parse(draftRaw);
        if (isNotificationPreferences(parsed)) setPreferences(parsed);
      }
      const [nextQuote, nextTransfer, nextTimeline] = await Promise.all([
        client.getQuote({ quoteId: demoQuoteId }),
        client.getTransfer({ transferId: demoTransferId }),
        client.getTransferTimeline({ transferId: demoTransferId, limit: 25 }),
      ]);
      setQuote(nextQuote);
      setTransfer(nextTransfer);
      setTimeline(nextTimeline);
      setStatus("ready");
    } catch {
      // F2/D9: a failed read keeps whatever we already have and labels it
      // stale. It never clears money facts into a fake "no transfers" state.
      setStatus("offline");
    }
  }, [client, demoQuoteId, demoTransferId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={styles.root} testID="kita-mobile-root">
      <View style={styles.header}>
        <Text style={styles.brand}>Kita</Text>
        <Text style={styles.tagline}>Read-only activity for your transfers</Text>
        {status === "offline" ? (
          <Text style={styles.stale} testID="offline-stale-label">
            Offline - showing the last data we received. Reconnect for current status.
          </Text>
        ) : null}
        {status === "loading" ? <Text testID="loading-label">Loading...</Text> : null}
      </View>

      <ScrollView contentContainerStyle={styles.content} testID={`tab-panel-${tab}`}>
        {tab === "quote" && quote !== null ? <QuoteView quote={quote} /> : null}
        {tab === "activity" && transfer !== null ? (
          <TransactionStatusView transfer={transfer} timeline={timeline ?? undefined} />
        ) : null}
        {tab === "notifications" ? <NotificationPreferenceView preferences={preferences} /> : null}
        {status === "ready" && tab !== "notifications" && (tab === "quote" ? quote === null : transfer === null) ? (
          <Text style={styles.empty} testID="empty-state">
            Nothing to show yet for this account.
          </Text>
        ) : null}
      </ScrollView>

      <View style={styles.tabBar} testID="bottom-tabs">
        {TABS.map((item) => (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            accessibilityState={{ selected: tab === item.key }}
            onPress={() => setTab(item.key)}
            style={[styles.tab, tab === item.key ? styles.tabActive : null]}
            testID={`tab-${item.key}`}
          >
            <Text style={[styles.tabLabel, tab === item.key ? styles.tabLabelActive : null]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.warm, flex: 1 },
  header: { backgroundColor: colors.ink, gap: spacing.xs, padding: spacing.xl },
  brand: { color: colors.lime, fontSize: 24, fontWeight: "700" },
  tagline: { color: colors.warm, fontSize: 14 },
  stale: { color: colors.lime, fontSize: 14 },
  content: { gap: spacing.lg, padding: spacing.lg },
  empty: { color: colors.textSecondary, fontSize: 16 },
  tabBar: {
    backgroundColor: colors.paper,
    borderTopColor: colors.boundary,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
  },
  tab: { alignItems: "center", flex: 1, minHeight: 48, justifyContent: "center", paddingVertical: spacing.md },
  tabActive: { borderBottomColor: colors.lime, borderBottomWidth: 3 },
  tabLabel: { color: colors.textSecondary, fontSize: 16 },
  tabLabelActive: { color: colors.ink, fontWeight: "600" },
});
