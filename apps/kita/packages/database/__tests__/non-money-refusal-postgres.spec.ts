import { describe, it } from "vitest";

import {
  postgresSuiteSelected,
  requireRefusalOwnerUrl,
} from "./helpers/non-money-refusal-pg.ts";

const selected = postgresSuiteSelected();

describe.skipIf(!selected)("non-money refusal PostgreSQL 18 evidence", () => {
  it("requires the pinned owner URL and dedicated cluster", () => {
    requireRefusalOwnerUrl();
    throw new Error("PostgreSQL 18 cluster evidence is required and was not observed");
  });
});
