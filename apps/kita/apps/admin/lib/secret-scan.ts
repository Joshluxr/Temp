/** Names that may never appear in a client-compiled module (T-PLAT-01 / TEST-PLAT-01). */
export const SECRET_ENV_NAMES = [
  'KITA_ADMIN_SESSION_SECRET',
  'KITA_ADMIN_SERVICE_TOKEN',
  'KITA_API_BASE_URL',
  'DATABASE_URL',
  'OIDC_CLIENT_SECRET',
  'WORKFORCE_OIDC_CLIENT_SECRET',
  'WEBHOOK_SIGNING_KEY',
] as const;

export const FORBIDDEN_MUTATION_NAMES = [
  'addSandboxFunds',
  'simulatePartnerCompletion',
  'mark_paid_out',
  'markPaidOut',
  'set_balance',
  'setBalance',
  'adminComplete',
  'transfer.complete',
] as const;

const CLIENT_MODULE_RE = /(client\.ts|use client)/;

export function isClientVisibleModule(path: string, source: string): boolean {
  return path.endsWith('.tsx') || CLIENT_MODULE_RE.test(source);
}

export interface LeakFinding {
  readonly file: string;
  readonly marker: string;
}

export function findSecretReferences(files: ReadonlyMap<string, string>): LeakFinding[] {
  const findings: LeakFinding[] = [];
  for (const [file, source] of files) {
    if (!isClientVisibleModule(file, source)) continue;
    for (const name of SECRET_ENV_NAMES) {
      if (source.includes(name)) findings.push({ file, marker: name });
    }
    for (const match of source.matchAll(/process\.env\.([A-Za-z0-9_]+)/g)) {
      const key = match[1];
      if (key === undefined) continue;
      if (!key.startsWith('NEXT_PUBLIC_')) findings.push({ file, marker: `process.env.${key}` });
    }
  }
  return findings;
}

export function findMutationReferences(files: ReadonlyMap<string, string>): LeakFinding[] {
  const findings: LeakFinding[] = [];
  for (const [file, source] of files) {
    if (!isClientVisibleModule(file, source)) continue;
    for (const name of FORBIDDEN_MUTATION_NAMES) {
      if (source.includes(name)) findings.push({ file, marker: name });
    }
  }
  return findings;
}
