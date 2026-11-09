/**
 * @kita/domain/identity — session-store gate (T-IDENTITY-01 lane).
 *
 * Backlog signature (docs/kita-plan/13-backlog.md T-IDENTITY-01):
 *   bindSession(ctx: CommandContext, input: OidcEvidence): Promise<Result<Session>>
 *
 * This is a DISABLED GATE, not an implementation. Session persistence over
 * auth_sessions/refresh_tokens and every token effect (mint, rotate, revoke)
 * belong to T-CORE-02 command authority; until that lands, bindSession can
 * ONLY return `err(unavailable(...))`. It never constructs a Session, so no
 * caller can obtain a live session value from this module — replay/expiry/
 * ownership rejection logic arrives with the real reducer, not here.
 *
 * Hard bans honored: no KYC pass, no fake verification outcomes, no money
 * paths, no token minting or hashing (see apps/kita/docs/FORBIDDEN.md).
 */

import { err, unavailable, type OidcEvidence, type Problem, type Result, type Session } from '@kita/contracts';

/**
 * Placeholder for the frozen T-CONTRACT-01 `CommandContext` (validated actor/
 * person, book, assurance, command key/hash, correlation, transaction runner).
 * Deliberately opaque and unused: nothing here may read or fabricate context
 * fields, and no client-selectable role or ledger account exists in scope.
 */
export interface CommandContext {
  readonly __brand: 'CommandContext';
}

/**
 * Bind verified OIDC/PKCE evidence to a durable session. Fail-closed: the
 * only reachable outcome is the 503 capability_unavailable problem from
 * contracts' `unavailable()` helper. A `Result<Session>` success branch is
 * typed but unconstructible here by design.
 */
export function bindSession(_ctx: CommandContext, _input: OidcEvidence): Promise<Result<Session, Problem>> {
  return Promise.resolve(err(unavailable('bindSession')));
}
