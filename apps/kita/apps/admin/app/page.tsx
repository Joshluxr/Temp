import { Brand } from "@kita/ui";

// Placeholder actions that are FORBIDDEN IN PRODUCTION per
// docs/FORBIDDEN-PRODUCTION-ENDPOINTS.md (Sol CONDITIONAL-PASS batch 1).
// This list is static text only — no handlers, no API calls, no trpc.
const forbiddenActions = [
  "addSandboxFunds",
  "simulatePartnerCompletion",
  "admin transfer complete/fail/mark_paid_out",
];

export default function AdminPlaceholderPage() {
  return (
    <div>
      <Brand />
      <p>Admin console — scaffold only. No operational actions.</p>
      <section aria-label="Forbidden production actions">
        <h1>Not implemented — FORBIDDEN IN PRODUCTION</h1>
        <ul>
          {forbiddenActions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
