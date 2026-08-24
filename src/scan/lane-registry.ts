/**
 * Lane registry. Holds ScanLane implementations keyed by LaneId and resolves
 * which lanes a profile wants per phase. The default registry ships with the
 * real lane implementations from ./lanes — every lane does real work or
 * self-skips with an explicit reason (missing tools, inputs, or scope).
 */

import {
  PHASE_LANES,
  type LaneId,
  type ScanLane,
  type ScanPhase,
  type ScanProfile,
} from './types.js';
import { registerDefaultLanes } from './lanes/index.js';

export class LaneRegistry {
  private lanes = new Map<LaneId, ScanLane>();

  register(lane: ScanLane): void {
    this.lanes.set(lane.id, lane);
  }

  get(id: LaneId): ScanLane | undefined {
    return this.lanes.get(id);
  }

  /** Lane ids the profile wants for a phase, in canonical PHASE_LANES order.
   *  A lane runs only when it is registered AND enabled in the profile. */
  laneIdsForPhase(phase: ScanPhase, profile: ScanProfile): LaneId[] {
    return PHASE_LANES[phase].filter((id) => {
      if (!this.lanes.has(id)) return false;
      return profile.lanes?.[id]?.enabled === true;
    });
  }
}

/** Build a registry pre-populated with the real lane implementations. */
export function createDefaultLaneRegistry(): LaneRegistry {
  return registerDefaultLanes(new LaneRegistry());
}
