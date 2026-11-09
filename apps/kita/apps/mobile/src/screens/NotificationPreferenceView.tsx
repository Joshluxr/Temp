/**
 * Notification-preference view (D2 `/alerts`, `/profile`).
 *
 * The frozen contract exposes notification preferences only through
 * `PUT /v1/notification-preferences` (`updateNotificationPreferences`) — there
 * is no GET projection (see CONTRACT-GAPS.md). This surface issues no
 * mutations, so the screen renders a read-only snapshot of the locally
 * persisted draft plus the server-side capability label. Controls are present
 * but explicitly disabled with a one-line reason; they never call a financial
 * or profile-mutating endpoint.
 */

import { StyleSheet, Switch, Text, View } from "react-native";

import type { NotificationPreferences } from "../contracts/types";
import { colors, radii, spacing } from "../theme/tokens";

export interface NotificationPreferenceViewProps {
  readonly preferences: NotificationPreferences | null;
  /** Disabled until T-CONTRACT-01 ships a GET projection and a sanctioned write path. */
  readonly editable?: boolean;
}

interface ToggleRowProps {
  readonly label: string;
  readonly value: boolean;
  readonly testID: string;
  readonly disabled: boolean;
}

function ToggleRow({ label, value, testID, disabled }: ToggleRowProps) {
  return (
    <View style={styles.row} testID={testID}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        accessibilityRole="switch"
        accessibilityState={{ checked: value, disabled }}
        disabled={disabled}
        trackColor={{ false: colors.boundary, true: colors.lime }}
        thumbColor={value ? colors.ink : colors.paper}
        value={value}
        // No-op by design: writes require the PUT contract plus a consent
        // version, which this read-only surface does not implement.
        onValueChange={() => {}}
      />
    </View>
  );
}

const DEFAULTS_LABEL = "Server defaults";

export function NotificationPreferenceView({ preferences, editable = false }: NotificationPreferenceViewProps) {
  const disabled = !editable;

  return (
    <View style={styles.surface} testID="notification-preference-view">
      <Text style={styles.heading}>Notifications</Text>
      <Text style={styles.subheading}>
        {preferences === null
          ? `${DEFAULTS_LABEL}: we have not loaded your saved choices yet.`
          : `Locale ${preferences.locale} - time zone ${preferences.timeZone}`}
      </Text>

      <ToggleRow
        label="Transfer service updates (push)"
        value={preferences?.servicePush ?? true}
        testID="pref-service-push"
        disabled={disabled}
      />
      <ToggleRow
        label="Marketing email"
        value={preferences?.marketingEmail ?? false}
        testID="pref-marketing-email"
        disabled={disabled}
      />
      <ToggleRow
        label="Marketing SMS"
        value={preferences?.marketingSms ?? false}
        testID="pref-marketing-sms"
        disabled={disabled}
      />
      <ToggleRow
        label="Marketing push"
        value={preferences?.marketingPush ?? false}
        testID="pref-marketing-push"
        disabled={disabled}
      />

      {preferences?.quietHoursStart !== undefined || preferences?.quietHoursEnd !== undefined ? (
        <Text style={styles.quietHours} testID="pref-quiet-hours">
          Quiet hours {preferences.quietHoursStart ?? "--:--"} to {preferences.quietHoursEnd ?? "--:--"} local
        </Text>
      ) : null}

      <Text style={styles.disabledNote} testID="pref-disabled-note">
        Changes are unavailable in this build: the frozen v1 contract has no read endpoint for
        preferences and this app does not submit them. Use the web profile page to change them.
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
  heading: { color: colors.textPrimary, fontSize: 20, fontWeight: "600" },
  subheading: { color: colors.textSecondary, fontSize: 14 },
  row: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  rowLabel: { color: colors.textPrimary, flex: 1, fontSize: 16 },
  quietHours: { color: colors.textSecondary, fontSize: 14 },
  disabledNote: { color: colors.textSecondary, fontSize: 14 },
});
