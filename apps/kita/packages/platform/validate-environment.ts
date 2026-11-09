/**
 * @kita/platform — validate-environment (T-PLAT-07).
 *
 * Pure fail-closed checker. Never returns ok:true. No Terraform, cloud APIs,
 * DB, or journals. Production plus any sandbox/fixture/addSandboxFunds marker
 * is a non-retryable CAPABILITY_UNAVAILABLE. Every other path is 503
 * dependency_unavailable because live isolation is not implemented.
 */

import type { Plat07Input, Plat07Output, Problem, Result, WorkerContext } from '@kita/contracts';
import { err, problem } from '@kita/contracts';

export const VALIDATE_ENVIRONMENT_SANDBOX_IN_PROD_DETAIL =
  'T-PLAT-07 production cannot start with sandbox capability, fixture adapter, or addSandboxFunds';

export const VALIDATE_ENVIRONMENT_UNAVAILABLE_DETAIL =
  'T-PLAT-07 validateEnvironment cannot attest isolated deployment: live IaC/KMS isolation is not implemented (fail closed)';

function productionContamination(input: Plat07Input): boolean {
  return (
    input.claimedEnvironment === 'production' &&
    (input.sandboxCapabilityPresent || input.fixtureAdapterPresent || input.addSandboxFundsPresent)
  );
}

export async function validateEnvironment(
  ctx: WorkerContext,
  input: Plat07Input,
): Promise<Result<Plat07Output, Problem>> {
  ctx.trace('validate_environment_fail_closed', {
    workId: String(ctx.workId),
    attemptGeneration: ctx.attemptGeneration,
    claimedEnvironment: input.claimedEnvironment,
  });
  if (productionContamination(input)) {
    return err(problem('CAPABILITY_UNAVAILABLE', 409, false, VALIDATE_ENVIRONMENT_SANDBOX_IN_PROD_DETAIL));
  }
  return err(problem('dependency_unavailable', 503, true, VALIDATE_ENVIRONMENT_UNAVAILABLE_DETAIL));
}
