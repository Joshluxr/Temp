/**
 * @kita/api conventional main entry (T-CORE-01).
 *
 * Trivially thin: importing this module never starts the application — all
 * effects live behind the direct-execution check below. On startup failure
 * (e.g. a missing runtime binding) bootstrap() has already fail-closed with a
 * sanitized diagnostic naming the binding; here we only set the exit code so
 * the process terminates unsuccessfully and nothing listens or connects.
 */
import { pathToFileURL } from 'node:url';
import { bootstrap } from './bootstrap.ts';

async function main(): Promise<void> {
  const result = await bootstrap({ env: process.env });
  if (!result.ok) {
    // Fail closed: no server started, no readiness advertised, no pool created.
    process.exitCode = 1;
    return;
  }
  // Stub scope: listener lifecycle is owned by the injected seams inside
  // bootstrap(); T-CORE-01 deliberately publishes no routes or health here.
}

// Direct-execution check: build the current script's file URL canonically
// (pathToFileURL handles Windows drive letters and percent-encoded characters
// like spaces identically to how import.meta.url is produced) instead of a raw
// `file://${argv[1]}` string concat, which mismarks any encoded path. We do NOT
// realpath argv[1]: that would silently skip startup when invoked through a
// symlink or wrapper path — an operator-visible failure instead is preferable.
const executedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (executedDirectly) {
  void main();
}
