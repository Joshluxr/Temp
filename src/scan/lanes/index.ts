/**
 * Lane barrel — the real scan-lane implementations. `registerDefaultLanes`
 * populates a LaneRegistry with every lane; the Phase-0 no-op scaffold is
 * gone — every lane now does real work or skips with an explicit reason.
 */

import type { LaneRegistry } from '../lane-registry.js';
import { reconLane } from './recon.js';
import { tierELane } from './tier-e.js';
import { browserDastLane } from './browser-dast.js';
import { authzMatrixLane } from './authz-matrix.js';
import { flowAttacksLane } from './flow-attacks.js';
import { credentialLane } from './credential.js';
import { solAuditLane } from './sol-audit.js';
import { chainSimLane } from './chain-sim.js';
import { greyboxFuzzLane } from './greybox-fuzz.js';
import { apiFuzzLane } from './api-fuzz.js';
import { protocolTestsLane } from './protocol-tests.js';
import { reportLane } from './report.js';
import { integrationsLane } from './integrations.js';

export {
  reconLane,
  tierELane,
  browserDastLane,
  authzMatrixLane,
  flowAttacksLane,
  credentialLane,
  solAuditLane,
  chainSimLane,
  greyboxFuzzLane,
  apiFuzzLane,
  protocolTestsLane,
  reportLane,
  integrationsLane,
};

export const DEFAULT_LANES = [
  reconLane,
  tierELane,
  browserDastLane,
  authzMatrixLane,
  flowAttacksLane,
  credentialLane,
  solAuditLane,
  chainSimLane,
  greyboxFuzzLane,
  apiFuzzLane,
  protocolTestsLane,
  reportLane,
  integrationsLane,
] as const;

export function registerDefaultLanes(registry: LaneRegistry): LaneRegistry {
  for (const lane of DEFAULT_LANES) registry.register(lane);
  return registry;
}
